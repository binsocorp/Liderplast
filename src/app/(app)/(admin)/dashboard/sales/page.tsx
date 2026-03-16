import { createClient } from '@/lib/supabase/server';
import SalesClient from './SalesClient';

export default async function SalesDashboardPage() {
    const supabase = await createClient();

    const [
        { data: orders },
        { data: sellers },
        { data: provinces },
        { data: catalogItems }
    ] = await Promise.all([
        supabase.from('orders').select('*, seller:sellers(*), province:provinces(*)'),
        supabase.from('sellers').select('*'),
        supabase.from('provinces').select('*'),
        supabase.from('catalog_items').select('*')
    ]);

    return (
        <SalesClient
            orders={orders || []}
            sellers={sellers || []}
            provinces={provinces || []}
            catalogItems={catalogItems || []}
        />
    );
}
