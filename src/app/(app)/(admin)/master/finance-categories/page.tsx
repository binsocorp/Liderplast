import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function FinanceCategoriesPage() {
    const supabase = await createClient();

    const [{ data: categories }, { data: subcategories }] = await Promise.all([
        supabase.from('finance_categories').select('*').order('name'),
        supabase.from('finance_subcategories').select('*, category:finance_categories(name)').order('name'),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Categorías de Finanzas"
                backHref="/master"
                subtitle="Categorías y subcategorías para ingresos y egresos"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <MasterCrud
                        title="Categorías"
                        entityTable="finance_categories"
                        data={categories || []}
                        embedded
                        columns={[
                            { key: 'name', label: 'Nombre' },
                            { key: 'is_active', label: 'Activo', renderType: 'badge' },
                        ]}
                        fields={[
                            { key: 'name', label: 'Nombre', type: 'text', required: true },
                            { key: 'is_active', label: 'Activo', type: 'checkbox' },
                        ]}
                    />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <MasterCrud
                        title="Subcategorías"
                        entityTable="finance_subcategories"
                        data={subcategories || []}
                        embedded
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
                </div>
            </div>
        </div>
    );
}
