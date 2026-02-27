import { createClient } from '@/lib/supabase/server';
import { ExpensesClient } from './ExpensesClient';

export default async function ExpensesPage() {
    const supabase = await createClient();

    // Fetch expenses with all relations
    const { data: expenses } = await supabase
        .from('finance_expenses')
        .select(`
            *,
            category:finance_categories(name),
            subcategory:finance_subcategories(name),
            payment_method:finance_payment_methods(name),
            vendor:finance_vendors(name)
        `)
        .order('issue_date', { ascending: false });

    // Fetch master data for filters and modal
    const { data: categories } = await supabase.from('finance_categories').select('*').eq('is_active', true).order('name');
    const { data: subcategories } = await supabase.from('finance_subcategories').select('*').eq('is_active', true).order('name');
    const { data: paymentMethods } = await supabase.from('finance_payment_methods').select('*').eq('is_active', true).order('name');
    const { data: vendors } = await supabase.from('finance_vendors').select('*').eq('is_active', true).order('name');

    return (
        <ExpensesClient
            expenses={expenses || []}
            categories={categories || []}
            subcategories={subcategories || []}
            paymentMethods={paymentMethods || []}
            vendors={vendors || []}
        />
    );
}
