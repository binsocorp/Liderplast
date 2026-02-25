import { createClient } from '@/lib/supabase/server';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
    const supabase = await createClient();

    // Fetch orders with relations
    const { data: orders } = await supabase
        .from('orders')
        .select(`
      *,
      province:provinces(name),
      trip:trips(trip_code),
      installer:installers(name),
      reseller:resellers(name)
    `)
        .order('created_at', { ascending: false });

    // Fetch filter options
    const { data: provinces } = await supabase
        .from('provinces')
        .select('id, name')
        .eq('is_sellable', true)
        .order('name');

    const { data: resellers } = await supabase
        .from('resellers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

    // Stats
    const totalOrders = orders?.length ?? 0;
    const confirmedOrders = orders?.filter((o) => o.status === 'CONFIRMADO').length ?? 0;
    const inProductionOrders = orders?.filter(
        (o) => o.status === 'EN_PRODUCCION' || o.status === 'PRODUCIDO'
    ).length ?? 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_net), 0) ?? 0;

    return (
        <OrdersClient
            orders={orders ?? []}
            provinces={provinces ?? []}
            resellers={resellers ?? []}
            stats={{
                totalOrders,
                confirmedOrders,
                inProductionOrders,
                totalRevenue,
            }}
        />
    );
}
