import { createClient } from '@/lib/supabase/server';
import { CajaClient } from './CajaClient';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
    const supabase = await createClient();

    // Fetch payment methods (accounts)
    const { data: paymentMethods } = await supabase
        .from('finance_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

    // Fetch all account movements (ordered newest first)
    const { data: movements, error } = await (supabase
        .from('account_movements') as any)
        .select('*, payment_method:finance_payment_methods!payment_method_id(id, name), transfer_to:finance_payment_methods!transfer_to_method_id(id, name)')
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching movements:', error);
    }

    return (
        <div className="p-1">
            <CajaClient
                paymentMethods={paymentMethods || []}
                movements={movements || []}
            />
        </div>
    );
}
