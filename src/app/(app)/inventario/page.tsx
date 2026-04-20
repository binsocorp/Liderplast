import { createClient } from '@/lib/supabase/server';
import { InventarioClient } from './InventarioClient';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
    const supabase = await createClient();

    const [
        { data: items, error },
        { data: finalProducts },
        { data: allBomItems },
    ] = await Promise.all([
        (supabase.from('inventory_items') as any).select('*').order('name', { ascending: true }),
        (supabase.from('inventory_items') as any).select('id, name').eq('type', 'PRODUCTO_FINAL').eq('is_active', true).order('name'),
        (supabase.from('bom_items') as any).select('id, product_id, material_id, quantity_per_unit'),
    ]);

    if (error) {
        console.error('Error fetching inventory items:', error);
        return <div className="p-4">Error cargando inventario</div>;
    }

    return (
        <div className="p-1">
            <InventarioClient
                items={items || []}
                finalProducts={finalProducts || []}
                allBomItems={allBomItems || []}
            />
        </div>
    );
}
