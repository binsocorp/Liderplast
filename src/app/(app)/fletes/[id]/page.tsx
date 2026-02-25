import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FleteDetailClient } from './FleteDetailClient';

export default async function FleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch the trip
    const { data: trip } = await supabase
        .from('trips')
        .select('*, truck_type:truck_types(name, capacity)')
        .eq('id', id)
        .single();

    if (!trip) notFound();

    // Fetch orders already assigned to this trip
    const { data: assignedOrders } = await supabase
        .from('orders')
        .select(`
            id, order_number, client_name, status, city, 
            province:provinces(name)
        `)
        .eq('trip_id', id)
        .order('created_at', { ascending: false });

    // Fetch unassigned orders that could be added
    const { data: availableOrders } = await supabase
        .from('orders')
        .select(`
            id, order_number, client_name, status, city, 
            province:provinces(name)
        `)
        .is('trip_id', null)
        .in('status', ['PRODUCIDO', 'CONFIRMADO']) // Usually only produced or confirmed orders can be shipped
        .order('created_at', { ascending: false });

    return (
        <FleteDetailClient
            trip={trip}
            assignedOrders={assignedOrders ?? []}
            availableOrders={availableOrders ?? []}
        />
    );
}
