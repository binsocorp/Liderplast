import { createClient } from '@/lib/supabase/server';
import { RendimientoClient } from './RendimientoClient';

export const dynamic = 'force-dynamic';

export default async function RendimientoPage() {
    const supabase = await createClient();

    const { data: productions } = await (supabase
        .from('production_records') as any)
        .select('id, production_number, production_date, quantity, product_id, created_by, product:inventory_items(id, name)')
        .eq('status', 'CONFIRMADA')
        .order('production_date', { ascending: false });

    if (!productions || !productions.length) {
        return (
            <div className="p-1">
                <RendimientoClient rows={[]} products={[]} operarios={[]} />
            </div>
        );
    }

    // Costo PPP actual de materiales para calcular costo por unidad
    const { data: materials } = await (supabase
        .from('inventory_items') as any)
        .select('id, average_cost, last_cost');

    const materialCostMap: Record<string, number> = {};
    for (const m of materials || []) {
        materialCostMap[m.id] = Number(m.average_cost) || Number(m.last_cost) || 0;
    }

    // BOMs
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

    // Perfiles (operarios)
    const userIds = [...new Set(productions.map((p: any) => p.created_by).filter(Boolean))];
    const { data: profiles } = await (supabase
        .from('profiles') as any)
        .select('id, full_name')
        .in('id', userIds);

    const profileMap: Record<string, string> = {};
    for (const p of profiles || []) profileMap[p.id] = p.full_name || 'Sin nombre';

    const rows = productions.map((prd: any) => {
        const qty = Number(prd.quantity);
        const bomLines = bomMap[prd.product_id] || [];
        const bom_cost = bomLines.reduce((sum: number, b: any) =>
            sum + (Number(b.quantity_per_unit) * qty * (materialCostMap[b.material_id] || 0)), 0);
        return {
            id: prd.id,
            production_number: prd.production_number,
            production_date: prd.production_date,
            product_id: prd.product_id,
            product_name: prd.product?.name || '—',
            quantity: qty,
            cost_per_unit: qty > 0 ? bom_cost / qty : 0,
            operario_id: prd.created_by || '',
            operario: prd.created_by ? (profileMap[prd.created_by] || 'Desconocido') : '—',
        };
    });

    const products = [...new Map(
        productions.map((p: any) => [p.product_id, { id: p.product_id, name: p.product?.name || '—' }])
    ).values()];

    const operarios = [...new Map(
        productions.filter((p: any) => p.created_by).map((p: any) => [p.created_by, { id: p.created_by, name: profileMap[p.created_by] || 'Desconocido' }])
    ).values()];

    return (
        <div className="p-1">
            <RendimientoClient rows={rows} products={products} operarios={operarios} />
        </div>
    );
}
