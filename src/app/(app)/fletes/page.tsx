import { createClient } from '@/lib/supabase/server';
import { FletesClient } from './FletesClient';

export default async function FletesPage() {
    const supabase = await createClient();

    const { data: trips } = await supabase
        .from('trips')
        .select(`
            *,
            vehicle:vehicles(name, capacity),
            driver:drivers(name),
            province:provinces(name)
        `)
        .order('created_at', { ascending: false });

    // New bridge table assignments
    const { data: tripOrders } = await (supabase
        .from('trip_orders') as any)
        .select('*, order:orders(id, order_number, client_name)');

    // Master data for modal
    const [{ data: drivers }, { data: vehicles }, { data: provinces }] = await Promise.all([
        supabase.from('drivers').select('*').eq('is_active', true).order('name'),
        supabase.from('vehicles').select('*').eq('is_active', true).order('name'),
        supabase.from('provinces').select('id, name').order('name'),
    ]);

    // Available orders (not in PLANIFICADO or EN_RUTA trips)
    // RPC skipped if it depends on orders.status
    // const { data: availableOrders } = await supabase.rpc('get_available_orders_for_trips');
    const availableOrders = null;

    // Fallback if RPC doesn't exist yet, I'll use a manual query for now
    const { data: activeAssignments } = await (supabase
        .from('trip_orders') as any)
        .select('order_id, trips!inner(status)')
        .in('trips.status', ['PLANIFICADO', 'EN_RUTA']);

    const assignedIds = activeAssignments?.map((a: any) => a.order_id) || [];

    const { data: orders } = await supabase
        .from('orders')
        .select(`
            id, 
            order_number, 
            client_name, 
            province_id, 
            freight_amount,
            province:provinces(name),
            order_items(id, description, catalog_item:catalog_items(name))
        `);
    // .not('status', 'eq', 'CANCELADO')
    // .not('status', 'eq', 'ENTREGADO');

    const filteredOrders = (orders as any[])?.filter((o: any) => !assignedIds.includes(o.id)) || [];

    return (
        <FletesClient
            trips={trips ?? []}
            tripOrders={tripOrders ?? []}
            drivers={drivers ?? []}
            vehicles={vehicles ?? []}
            provinces={provinces ?? []}
            availableOrders={filteredOrders}
        />
    );
}
