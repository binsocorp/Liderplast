import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { OrderDetailClient } from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Get user profile for permissions
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, can_override_prices')
        .eq('id', user!.id)
        .single();

    // Fetch order with relations
    const { data: order } = await supabase
        .from('orders')
        .select(`
      *,
      province:provinces(id, name),
      client:clients(id, name),
      seller:sellers(id, name),
      reseller:resellers(id, name),
      trip:trips(id, trip_code, destination, date),
      installer:installers(id, name)
    `)
        .eq('id', id)
        .single();

    if (!order) notFound();

    // Fetch order items
    const { data: items } = await supabase
        .from('order_items')
        .select(`
      *,
      catalog_item:catalog_items(id, name, type)
    `)
        .eq('order_id', id)
        .order('sort_order')
        .order('created_at');

    // Fetch lookup data
    const [
        { data: provinces },
        { data: sellers },
        { data: resellers },
        { data: trips },
        { data: installers },
        { data: catalogItems },
        { data: prices },
        occupancyData,
    ] = await Promise.all([
        supabase.from('provinces').select('id, name').eq('is_sellable', true).order('name'),
        supabase.from('sellers').select('id, name').eq('is_active', true).order('name'),
        supabase.from('resellers').select('id, name').eq('is_active', true).order('name'),
        supabase.from('trips').select('id, trip_code, destination, date, truck_type:truck_types(name, capacity)').order('created_at', { ascending: false }),
        supabase.from('installers').select('id, name').eq('is_active', true).order('name'),
        supabase.from('catalog_items').select('id, name, type').eq('is_active', true).order('name'),
        supabase.from('prices').select('catalog_item_id, province_id, unit_price_net').eq('is_active', true),
        supabase.from('orders').select('trip_id').not('trip_id', 'is', null).returns<any[]>(),
    ]);

    const occupancy = occupancyData?.data || [];

    return (
        <OrderDetailClient
            order={order}
            items={items ?? []}
            provinces={provinces ?? []}
            sellers={sellers ?? []}
            resellers={resellers ?? []}
            trips={trips ?? []}
            installers={installers ?? []}
            catalogItems={catalogItems ?? []}
            prices={prices ?? []}
            occupancy={occupancy}
            canOverridePrices={profile?.can_override_prices ?? false}
            isAdmin={profile?.role === 'ADMIN'}
        />
    );
}
