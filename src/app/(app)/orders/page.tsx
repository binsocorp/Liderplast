import { createClient } from '@/lib/supabase/server';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
    const supabase = await createClient();

    // 1. Fetch base orders + items
    const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*, order_items(*, catalog_item:catalog_items(name))')
        .order('created_at', { ascending: false });

    if (error || !ordersData) {
        console.error('SERVER_DEBUG: Error fetching orders:', error);
        return <div className="p-4">Error cargando pedidos</div>;
    }

    // 2. Fetch all lookup data parallelly to map relations manually
    // This avoids "Relationship not found" errors due to schema cache
    const sellerIds = [...new Set(ordersData.map(o => o.seller_id).filter(Boolean))];
    const provinceIds = [...new Set(ordersData.map(o => o.province_id).filter(Boolean))];
    const tripIds = [...new Set(ordersData.map(o => o.trip_id).filter(Boolean))];
    const installerIds = [...new Set(ordersData.map(o => o.installer_id).filter(Boolean))];

    const [
        { data: sellers },
        { data: provinces },
        { data: trips },
        { data: installers }
    ] = await Promise.all([
        supabase.from('sellers').select('id, name').in('id', sellerIds),
        supabase.from('provinces').select('id, name').in('id', provinceIds),
        supabase.from('trips').select('id, trip_code, driver:drivers(name)').in('id', tripIds),
        supabase.from('installers').select('id, name').in('id', installerIds)
    ]);

    // 3. Enrich orders
    const enrichedOrders = ordersData.map(order => {
        const seller = sellers?.find(s => s.id === order.seller_id) || null;
        const province = provinces?.find(p => p.id === order.province_id) || null;
        const trip: any = trips?.find(t => t.id === order.trip_id) || null;
        const installer = installers?.find(i => i.id === order.installer_id) || null;

        return {
            ...order,
            seller,
            province,
            trip,
            installer,
            _driver_name: trip?.driver?.name || '',
            _trip_code: trip?.trip_code || ''
        };
    });

    // 4. Fetch additional lookup data for the edit drawer (full lists)
    const [
        allSellers,
        allProvinces,
        allInstallers,
        allTrips
    ] = await Promise.all([
        supabase.from('sellers').select('id, name').eq('is_active', true).order('name').then(r => r.data ?? []),
        supabase.from('provinces').select('id, name').eq('is_sellable', true).order('name').then(r => r.data ?? []),
        supabase.from('installers').select('id, name').eq('is_active', true).order('name').then(r => r.data ?? []),
        supabase.from('trips').select('id, trip_code').order('created_at', { ascending: false }).limit(20).then(r => r.data ?? []),
    ]);

    return (
        <div className="p-1">
            <OrdersClient
                orders={enrichedOrders}
                lookups={{
                    sellers: allSellers,
                    provinces: allProvinces,
                    installers: allInstallers,
                    trips: allTrips
                }}
            />
        </div>
    );
}
