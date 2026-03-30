import { createClient } from '@/lib/supabase/server';
import { FinanzasDashboardClient } from './FinanzasDashboardClient';

export const dynamic = 'force-dynamic';

export default async function FinanzasDashboardPage() {
    const supabase = await createClient();

    // Payment methods (accounts)
    const { data: paymentMethods } = await supabase
        .from('finance_payment_methods')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

    // Account movements (for balance calculation)
    const { data: movements } = await (supabase
        .from('account_movements') as any)
        .select('payment_method_id, movement_type, amount, movement_date')
        .order('movement_date', { ascending: true });

    // Incomes last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0].slice(0, 7) + '-01';

    const { data: incomes } = await supabase
        .from('finance_incomes')
        .select('amount, issue_date, payment_method_id')
        .gte('issue_date', twelveMonthsAgoStr)
        .order('issue_date');

    // Expenses last 12 months
    const { data: expenses } = await supabase
        .from('finance_expenses')
        .select('amount, issue_date, status, payment_date')
        .gte('issue_date', twelveMonthsAgoStr)
        .order('issue_date');

    // Pending expenses (all time)
    const { data: pendingExpenses } = await supabase
        .from('finance_expenses')
        .select('id, amount, description, issue_date, vendor:finance_vendors(name)')
        .eq('status', 'PENDIENTE')
        .order('issue_date', { ascending: true });

    return (
        <div className="p-1">
            <FinanzasDashboardClient
                paymentMethods={paymentMethods || []}
                movements={movements || []}
                incomes={incomes || []}
                expenses={expenses || []}
                pendingExpenses={pendingExpenses || []}
            />
        </div>
    );
}
