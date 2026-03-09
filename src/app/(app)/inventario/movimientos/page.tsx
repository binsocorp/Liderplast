import { createClient } from '@/lib/supabase/server';
import { MovimientosClient } from './MovimientosClient';

export const dynamic = 'force-dynamic';

export default async function MovimientosPage() {
    const supabase = await createClient();

    // Fetch movements with item name
    const { data: movements, error } = await (supabase
        .from('inventory_movements') as any)
        .select('*, item:inventory_items(name, unit)')
        .order('created_at', { ascending: false });

    // Fetch items for the "new movement" form
    const { data: items } = await (supabase
        .from('inventory_items') as any)
        .select('id, name, unit, current_stock')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching movements:', error);
        return <div className="p-4">Error cargando movimientos</div>;
    }

    return (
        <div className="p-1">
            <MovimientosClient
                movements={movements || []}
                items={items || []}
            />
        </div>
    );
}
