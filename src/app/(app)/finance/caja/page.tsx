import { createClient } from '@/lib/supabase/server';
import { CajaClient } from './CajaClient';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
    const supabase = await createClient();

    const { data: paymentMethods } = await supabase
        .from('finance_payment_methods')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

    const { data: movements, error } = await (supabase
        .from('account_movements') as any)
        .select('id, payment_method_id, movement_type, amount, description, movement_date, created_at, source_type, transfer_id, transfer_to_method_id')
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) console.error('Error fetching movements:', error);

    return (
        <div className="p-1">
            <CajaClient
                paymentMethods={paymentMethods || []}
                movements={movements || []}
            />
        </div>
    );
}
