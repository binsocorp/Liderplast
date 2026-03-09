import { createClient } from '@/lib/supabase/server';
import { InventarioClient } from './InventarioClient';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
    const supabase = await createClient();

    const { data: items, error } = await (supabase
        .from('inventory_items') as any)
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching inventory items:', error);
        return <div className="p-4">Error cargando inventario</div>;
    }

    return (
        <div className="p-1">
            <InventarioClient items={items || []} />
        </div>
    );
}
