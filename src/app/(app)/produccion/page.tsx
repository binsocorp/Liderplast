import { createClient } from '@/lib/supabase/server';
import { ProduccionClient } from './ProduccionClient';

export const dynamic = 'force-dynamic';

export default async function ProduccionPage() {
    const supabase = await createClient();

    // Fetch products that have a BOM
    const { data: products } = await (supabase
        .from('inventory_items') as any)
        .select('id, name, unit')
        .eq('type', 'PRODUCTO_FINAL')
        .eq('is_active', true)
        .order('name');

    // Fetch production records
    const { data: productions, error } = await (supabase
        .from('production_records') as any)
        .select('*, product:inventory_items(name, unit)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching production records:', error);
        return <div className="p-4">Error cargando registros de producción</div>;
    }

    return (
        <div className="p-1">
            <ProduccionClient
                productions={productions || []}
                products={products || []}
            />
        </div>
    );
}
