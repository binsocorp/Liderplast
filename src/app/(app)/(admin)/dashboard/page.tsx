import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch all orders with relations for analysis
    const { data: orders } = await supabase
        .from('orders')
        .select(`
      *,
      items:order_items(
        type,
        subtotal_net
      )
    `)
        .order('created_at', { ascending: true });

    return <DashboardClient orders={orders ?? []} />;
}
