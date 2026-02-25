import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SubscriptionDetailClient } from './SubscriptionDetailClient';

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
      *,
      expenses:subscription_expenses(*)
    `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

    if (!subscription) notFound();

    // Sort expenses by date descending
    const sortedExpenses = (subscription.expenses || []).sort(
        (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );

    return <SubscriptionDetailClient subscription={{ ...subscription, expenses: sortedExpenses }} />;
}
