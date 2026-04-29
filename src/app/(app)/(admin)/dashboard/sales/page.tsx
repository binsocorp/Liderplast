import { createClient } from '@/lib/supabase/server';
import SalesClient from './SalesClient';

export default async function SalesDashboardPage() {
    const supabase = await createClient();

    const [
        { data: orders },
        { data: sellers },
        { data: resellers },
        { data: provinces }
    ] = await Promise.all([
        supabase.from('orders').select('*, items:order_items(*, catalog_item:catalog_items(id, name, sales_category)), reseller:resellers(id, name)'),
        supabase.from('sellers').select('id, name'),
        supabase.from('resellers').select('id, name, province_id'),
        supabase.from('provinces').select('id, name')
    ]);

    return (
        <SalesClient
            orders={orders || []}
            sellers={sellers || []}
            resellers={resellers || []}
            provinces={provinces || []}
        />
    );
}
