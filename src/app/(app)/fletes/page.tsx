import { createClient } from '@/lib/supabase/server';
import { FletesClient } from './FletesClient';

export default async function FletesPage() {
    const supabase = await createClient();

    const { data: trips } = await supabase
        .from('trips')
        .select('*, truck_type:truck_types(name, capacity)')
        .order('created_at', { ascending: false });

    // Get truck types for the dropdown
    const { data: truckTypes } = await supabase
        .from('truck_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

    // Get orders for each trip
    const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, client_name, trip_id, province:provinces(name)')
        .not('trip_id', 'is', null);

    return <FletesClient trips={trips ?? []} orders={orders ?? []} truckTypes={truckTypes ?? []} />;
}
