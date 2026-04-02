import { createClient } from '@/lib/supabase/server';
import { CostosClient } from './CostosClient';

export const dynamic = 'force-dynamic';

export default async function CostosPage() {
    const supabase = await createClient();

    // 1. Órdenes de producción confirmadas
    const { data: productions } = await (supabase
        .from('production_records') as any)
        .select('id, production_number, production_date, quantity, product_id, product:inventory_items(id, name)')
        .eq('status', 'CONFIRMADA')
        .order('production_date', { ascending: false });

    if (!productions || !productions.length) {
        return (
            <div className="p-1">
                <CostosClient rows={[]} products={[]} />
            </div>
        );
    }

    // 2. Costo promedio actual de todos los materiales
    const { data: materials } = await (supabase
        .from('inventory_items') as any)
        .select('id, average_cost, last_cost');

    const materialCostMap: Record<string, number> = {};
    for (const m of materials || []) {
        materialCostMap[m.id] = Number(m.average_cost) || Number(m.last_cost) || 0;
    }

    // 3. BOMs de los productos usados
    const productIds = [...new Set(productions.map((p: any) => p.product_id))];
    const { data: boms } = await (supabase
        .from('bom_items') as any)
        .select('product_id, material_id, quantity_per_unit')
        .in('product_id', productIds);

    const bomMap: Record<string, Array<{ material_id: string; quantity_per_unit: number }>> = {};
    for (const bom of boms || []) {
        if (!bomMap[bom.product_id]) bomMap[bom.product_id] = [];
        bomMap[bom.product_id].push(bom);
    }

    // 4. Movimientos SALIDA vinculados a cada PRD
    const prNumbers = productions.map((p: any) => p.production_number);
    const { data: salidas } = await (supabase
        .from('inventory_movements') as any)
        .select('reference, item_id, quantity')
        .eq('type', 'SALIDA')
        .in('reference', prNumbers);

    const movMap: Record<string, Array<{ item_id: string; quantity: number }>> = {};
    for (const mov of salidas || []) {
        if (!movMap[mov.reference]) movMap[mov.reference] = [];
        movMap[mov.reference].push(mov);
    }

    // 5. Calcular costos por orden
    const rows = productions.map((prd: any) => {
        const qty = Number(prd.quantity);

        // Costo estimado BOM
        const bomLines = bomMap[prd.product_id] || [];
        const bom_cost = bomLines.reduce((sum: number, b: any) => {
            return sum + (Number(b.quantity_per_unit) * qty * (materialCostMap[b.material_id] || 0));
        }, 0);

        // Costo real (movimientos SALIDA × PPP actual)
        const salidasPrd = movMap[prd.production_number] || [];
        const real_cost = salidasPrd.reduce((sum: number, m: any) => {
            return sum + (Number(m.quantity) * (materialCostMap[m.item_id] || 0));
        }, 0);

        return {
            id: prd.id,
            production_number: prd.production_number,
            production_date: prd.production_date,
            product_id: prd.product_id,
            product_name: prd.product?.name || '—',
            quantity: qty,
            bom_cost,
            real_cost,
            cost_per_unit: qty > 0 ? real_cost / qty : 0,
        };
    });

    const products = [...new Map(
        productions.map((p: any) => [p.product_id, { id: p.product_id, name: p.product?.name || '—' }])
    ).values()];

    return (
        <div className="p-1">
            <CostosClient rows={rows} products={products} />
        </div>
    );
}
