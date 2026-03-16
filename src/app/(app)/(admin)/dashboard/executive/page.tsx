import { createClient } from '@/lib/supabase/server';
import ExecutiveClient from './ExecutiveClient';

export default async function ExecutiveDashboardPage() {
    const supabase = await createClient();

    // Parallel fetching for performance
    const [
        { data: orders },
        { data: expenses },
        { data: income },
        { data: catalogItems },
        { data: sellers },
        { data: provinces }
    ] = await Promise.all([
        supabase.from('orders').select('*, items:order_items(*)'),
        supabase.from('finance_expenses').select('*'),
        supabase.from('finance_income').select('*'),
        supabase.from('catalog_items').select('id, name'),
        supabase.from('sellers').select('id, name'),
        supabase.from('provinces').select('id, name')
    ]);

    return (
        <ExecutiveClient
            orders={orders || []}
            expenses={expenses || []}
            income={income || []}
            catalogItems={catalogItems || []}
            sellers={sellers || []}
            provinces={provinces || []}
        />
    );
}
