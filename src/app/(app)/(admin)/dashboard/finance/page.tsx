import { createClient } from '@/lib/supabase/server';
import FinanceClient from './FinanceClient';

export default async function FinanceDashboardPage() {
    const supabase = await createClient();

    const [
        { data: expenses },
        { data: income },
        { data: expenseCategories },
        { data: incomeCategories }
    ] = await Promise.all([
        supabase.from('finance_expenses').select('*, category:finance_categories(*)'),
        supabase.from('finance_income').select('*, category:finance_income_categories(*)'),
        supabase.from('finance_categories').select('*'),
        supabase.from('finance_income_categories').select('*')
    ]);

    return (
        <FinanceClient
            expenses={expenses || []}
            income={income || []}
            expenseCategories={expenseCategories || []}
            incomeCategories={incomeCategories || []}
        />
    );
}
