import { createClient } from '@/lib/supabase/server';
import ExecutiveClient from './ExecutiveClient';

export default async function ExecutiveDashboardPage() {
    const supabase = await createClient();

    const [
        { data: orders },
        { data: expenses },
        { data: income },
        { data: sellers },
        { data: provinces },
        { data: inventoryItems }
    ] = await Promise.all([
        supabase.from('orders').select('*, items:order_items(*, catalog_item:catalog_items(id, name, sales_category))'),
        supabase.from('finance_expenses').select('*'),
        supabase.from('finance_income').select('*'),
        supabase.from('sellers').select('id, name'),
        supabase.from('provinces').select('id, name'),
        supabase.from('inventory_items').select('id, name, current_stock, min_stock, type')
    ]);

    return (
        <ExecutiveClient
            orders={orders || []}
            expenses={expenses || []}
            income={income || []}
            sellers={sellers || []}
            provinces={provinces || []}
            inventoryItems={inventoryItems || []}
        />
    );
}
