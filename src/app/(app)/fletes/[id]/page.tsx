import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FleteDetailClient } from './FleteDetailClient';

export default async function FleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch the trip with new relations
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

    // Fetch orders already assigned to this trip via bridge table
    const { data: assigned } = await (supabase
        .from('trip_orders') as any)
        .select(`
            order:orders(
                id, order_number, client_name, city, 
                province:provinces(name)
            )
        `)
        .eq('trip_id', id);

    const assignedOrders = assigned?.map((a: any) => a.order).filter(Boolean) || [];

    // Fetch unassigned orders (same province, not in active trips)
    // 1. Get IDs of orders in active trips
    const { data: activeAssignments } = await (supabase
        .from('trip_orders') as any)
        .select('order_id, trips!inner(id, status)')
        .in('trips.status', ['PLANIFICADO', 'EN_RUTA']);

    // Filter out assignments from the current trip
    const activeIds = activeAssignments?.filter((a: any) => a.trips.id !== id).map((a: any) => a.order_id) || [];

    const { data: orders } = await (supabase
        .from('orders') as any)
        .select(`
            id, order_number, client_name, city, 
            province_id,
            province:provinces(name)
        `)
        .eq('province_id', trip.province_id)
        .order('created_at', { ascending: false });

    const availableOrders = orders?.filter((o: any) => !assignedOrders.some((ao: any) => ao.id === o.id) && !activeIds.includes(o.id)) || [];

    return (
        <FleteDetailClient
            trip={trip}
            assignedOrders={assignedOrders as any}
            availableOrders={availableOrders as any}
        />
    );
}
