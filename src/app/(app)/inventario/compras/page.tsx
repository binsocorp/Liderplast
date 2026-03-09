import { createClient } from '@/lib/supabase/server';
import { ComprasClient } from './ComprasClient';

export const dynamic = 'force-dynamic';

export default async function ComprasPage() {
    const supabase = await createClient();

    // Fetch purchases with items
    const { data: purchases, error } = await (supabase
        .from('purchases') as any)
        .select('*, purchase_items(*, item:inventory_items(name, unit))')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching purchases:', error);
        return <div className="p-4">Error cargando compras</div>;
    }

    // Fetch items for the new purchase form
    const { data: items } = await (supabase
        .from('inventory_items') as any)
        .select('id, name, unit, last_cost')
        .eq('is_active', true)
        .order('name');

    return (
        <div className="p-1">
            <ComprasClient
                purchases={purchases || []}
                items={items || []}
            />
        </div>
    );
}
