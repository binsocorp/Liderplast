import { createClient } from '@/lib/supabase/server';
import { BomClient } from './BomClient';

export const dynamic = 'force-dynamic';

export default async function BomPage() {
    const supabase = await createClient();

    // Fetch all products (PRODUCTO_FINAL)
    const { data: products } = await (supabase
        .from('inventory_items') as any)
        .select('id, name')
        .eq('type', 'PRODUCTO_FINAL')
        .eq('is_active', true)
        .order('name');

    // Fetch all materials/inputs (MATERIA_PRIMA, INSUMO)
    const { data: materials } = await (supabase
        .from('inventory_items') as any)
        .select('id, name, unit')
        .in('type', ['MATERIA_PRIMA', 'INSUMO'])
        .eq('is_active', true)
        .order('name');

    return (
        <div className="p-1">
            <BomClient
                products={products || []}
                materials={materials || []}
            />
        </div>
    );
}
