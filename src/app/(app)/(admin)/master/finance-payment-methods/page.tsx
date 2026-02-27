import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';

export default async function FinancePaymentMethodsPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('finance_payment_methods')
        .select('*')
        .order('name');

    return (
        <MasterCrud
            title="Medios de Pago"
            entityTable="finance_payment_methods"
            data={data || []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'is_active', label: 'Activo', renderType: 'badge' },
            ]}
            fields={[
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'is_active', label: 'Activo', type: 'checkbox' },
            ]}
        />
    );
}
