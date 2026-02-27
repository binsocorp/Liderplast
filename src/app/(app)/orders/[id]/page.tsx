import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { OrderDetailClient } from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id || id === 'undefined') {
        notFound();
    }

    const supabase = await createClient();

    // 1. Get user profile for permissions
    const { data: userData } = await supabase.auth.getUser();

    let profile = null;
    if (userData.user) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('role, can_override_prices')
            .eq('id', userData.user.id)
            .single();
        profile = profileData;
    }

    // 2. Fetch order with basics (handle joins separately if relationship meta is missing)
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        notFound();
    }

    // 3. Fetch relations manually to avoid schema relationship cache issues
    const [
        { data: province },
        { data: seller },
        { data: reseller },
        { data: trip },
        { data: installer }
    ] = await Promise.all([
        order.province_id ? supabase.from('provinces').select('id, name').eq('id', order.province_id).single() : { data: null },
        order.seller_id ? supabase.from('sellers').select('id, name').eq('id', order.seller_id).single() : { data: null },
        order.reseller_id ? supabase.from('resellers').select('id, name').eq('id', order.reseller_id).single() : { data: null },
        order.trip_id ? supabase.from('trips').select('id, trip_code, trip_date, exact_address').eq('id', order.trip_id).single() : { data: null },
        order.installer_id ? supabase.from('installers').select('id, name').eq('id', order.installer_id).single() : { data: null }
    ]);

    // Attach manually fetched relations
    const enrichedOrder = {
        ...order,
        province,
        seller,
        reseller,
        trip,
        installer
    };

    // 4. Fetch order items
    const { data: items } = await supabase
        .from('order_items')
        .select(`
            *,
            catalog_item:catalog_items(id, name, type)
        `)
        .eq('order_id', id)
        .order('sort_order', { ascending: true });

    // 5. Fetch lookup data
    const [
        provinces,
        sellers,
        resellers,
        trips,
        installers,
        catalogItems,
        prices,
        occupancyData
    ] = await Promise.all([
        supabase.from('provinces').select('id, name').eq('is_sellable', true).order('name').then(r => r.data ?? []),
        supabase.from('sellers').select('id, name').eq('is_active', true).order('name').then(r => r.data ?? []),
        supabase.from('resellers').select('id, name').eq('is_active', true).order('name').then(r => r.data ?? []),
        supabase.from('trips').select('id, trip_code, trip_date, exact_address, vehicle:vehicles(name, capacity)').order('created_at', { ascending: false }).then(r => r.data ?? []),
        supabase.from('installers').select('id, name').eq('is_active', true).order('name').then(r => r.data ?? []),
        supabase.from('catalog_items').select('id, name, type').eq('is_active', true).order('name').then(r => r.data ?? []),
        supabase.from('prices').select('catalog_item_id, province_id, unit_price_net').eq('is_active', true).then(r => r.data ?? []),
        supabase.from('orders').select('trip_id').not('trip_id', 'is', null).then(r => r.data ?? [])
    ]);

    return (
        <OrderDetailClient
            order={enrichedOrder}
            items={items ?? []}
            provinces={provinces}
            sellers={sellers}
            resellers={resellers}
            trips={trips}
            installers={installers}
            catalogItems={catalogItems}
            prices={prices}
            occupancy={occupancyData}
            canOverridePrices={!!profile?.can_override_prices}
            isAdmin={profile?.role === 'ADMIN'}
        />
    );
}
