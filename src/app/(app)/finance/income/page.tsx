import { createClient } from '@/lib/supabase/server';
import { IncomeClient } from './IncomeClient';

export default async function IncomePage({
    searchParams
}: {
    searchParams: { orderId?: string }
}) {
    const supabase = await createClient();

    // 1. Fetch incomes with relations
    const { data: incomes, error: incomesError } = await supabase
        .from('finance_incomes')
        .select(`
            *,
            order:orders(order_number, client_name, total_net),
            payment_method:finance_payment_methods(name)
        `)
        .order('issue_date', { ascending: false });

    if (incomesError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 bg-danger-100 text-danger-600 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Base de datos incompleta</h1>
                <p className="text-gray-500 max-w-md">
                    La tabla <code className="bg-gray-100 px-1 rounded">finance_incomes</code> no existe.
                    Ejecutá el script <code className="bg-gray-100 px-1 rounded">db_incomes_schema.sql</code> en el SQL Editor de Supabase.
                </p>
                <div className="text-xs font-mono bg-gray-100 p-3 rounded-xl max-w-xl text-gray-600">
                    {incomesError.message}
                </div>
            </div>
        );
    }

    // 2. Fetch orders (for linking + KPIs) — uses paid_amount from the orders table directly
    const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, client_name, total_net, paid_amount, payment_status, status, created_at')
        .order('created_at', { ascending: false });

    // 3. Payment methods
    const { data: paymentMethods } = await supabase
        .from('finance_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

    return (
        <IncomeClient
            incomes={incomes || []}
            orders={orders || []}
            paymentMethods={paymentMethods || []}
            preloadedOrderId={searchParams.orderId}
        />
    );
}
