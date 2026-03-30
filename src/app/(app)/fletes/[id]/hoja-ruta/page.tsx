import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { HojaRutaClient } from './HojaRutaClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await (supabase.from('trips') as any).select('trip_code').eq('id', id).single();
    if (data?.trip_code) {
        return { title: `Hoja_Ruta_${data.trip_code}` };
    }
    return { title: 'Hoja de Ruta' };
}

export default async function HojaRutaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch the trip
    const { data: trip } = await (supabase
        .from('trips') as any)
        .select(`
            *,
            vehicle:vehicles(name, capacity),
            driver:drivers(name),
            province:provinces(name)
        `)
        .eq('id', id)
        .single();

    if (!trip) notFound();

    // Fetch orders assigned to this trip with payment data
    const { data: assignedOrders } = await (supabase
        .from('orders') as any)
        .select(`
            id, order_number, client_name, client_phone, client_document,
            delivery_address, city, notes,
            total_net, paid_amount, payment_status,
            province:provinces(name),
            items:order_items(id, description, quantity)
        `)
        .eq('trip_id', id)
        .order('created_at', { ascending: true });

    // Fetch incomes linked to these orders
    const orderIds = (assignedOrders || []).map((o: any) => o.id);
    let incomesByOrder: Record<string, any[]> = {};

    if (orderIds.length > 0) {
        const { data: incomes } = await supabase
            .from('finance_incomes')
            .select(`
                order_id, amount, issue_date, income_type,
                payment_method:finance_payment_methods(name)
            `)
            .in('order_id', orderIds)
            .order('issue_date', { ascending: true });

        (incomes || []).forEach((inc: any) => {
            if (!incomesByOrder[inc.order_id]) incomesByOrder[inc.order_id] = [];
            incomesByOrder[inc.order_id].push(inc);
        });
    }

    return (
        <HojaRutaClient
            trip={trip}
            orders={assignedOrders as any}
            incomesByOrder={incomesByOrder}
        />
    );
}
