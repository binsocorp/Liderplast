import { createClient } from '@/lib/supabase/server';
import { SubscriptionsClient } from './SubscriptionsClient';

export default async function SubscriptionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
      *,
      expenses:subscription_expenses(amount)
    `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

    return <SubscriptionsClient subscriptions={subscriptions ?? []} />;
}
