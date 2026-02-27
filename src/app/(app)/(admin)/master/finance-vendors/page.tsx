import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';

export default async function FinanceVendorsPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('finance_vendors')
        .select('*')
        .order('name');

    return (
        <MasterCrud
            title="Proveedores"
            entityTable="finance_vendors"
            data={data || []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'cuit', label: 'CUIT' },
                { key: 'is_active', label: 'Activo', renderType: 'badge' },
            ]}
            fields={[
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'cuit', label: 'CUIT', type: 'text' },
                { key: 'is_active', label: 'Activo', type: 'checkbox' },
            ]}
        />
    );
}
