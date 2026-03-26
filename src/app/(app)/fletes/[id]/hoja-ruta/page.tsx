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

    // Fetch orders already assigned to this trip via the synced trip_id column
    const { data: assignedOrders } = await (supabase
        .from('orders') as any)
        .select(`
            id, order_number, client_name, client_phone, client_document, delivery_address, city, notes,
            province:provinces(name),
            items:order_items(id, description, quantity)
        `)
        .eq('trip_id', id)
        .order('created_at', { ascending: true });

    return (
        <HojaRutaClient
            trip={trip}
            orders={assignedOrders as any}
        />
    );
}
