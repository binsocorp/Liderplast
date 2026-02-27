import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';

export default async function FinanceCategoriesPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('finance_categories')
        .select('*')
        .order('name');

    return (
        <MasterCrud
            title="Categorías de Finanzas"
            entityTable="finance_categories"
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
