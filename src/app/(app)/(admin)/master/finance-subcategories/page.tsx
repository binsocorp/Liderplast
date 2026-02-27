import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';

export default async function FinanceSubcategoriesPage() {
    const supabase = await createClient();

    const { data: categories } = await supabase
        .from('finance_categories')
        .select('id, name')
        .order('name');

    const { data } = await supabase
        .from('finance_subcategories')
        .select('*, category:finance_categories(name)')
        .order('name');

    return (
        <MasterCrud
            title="Subcategorías de Finanzas"
            entityTable="finance_subcategories"
            data={data || []}
            columns={[
                { key: 'category.name', label: 'Categoría' },
                { key: 'name', label: 'Subcategoría' },
                { key: 'is_active', label: 'Activo', renderType: 'badge' },
            ]}
            fields={[
                {
                    key: 'category_id',
                    label: 'Categoría',
                    type: 'select',
                    required: true,
                    options: (categories || []).map((c: any) => ({ value: c.id, label: c.name }))
                },
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'is_active', label: 'Activo', type: 'checkbox' },
            ]}
        />
    );
}
