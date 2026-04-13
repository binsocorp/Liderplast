'use server';

import { createClient } from '@/lib/supabase/server';
import { productionRecordSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { ProductionRecordFormData } from '@/lib/validation/schemas';

export async function createProductionRecords(lines: Array<{ product_id: string; quantity: number }>, shared: { production_date: string; notes: string }) {
    if (!lines.length) return { error: 'Agregue al menos un producto' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // 1. Validate BOM + stock for ALL lines before inserting anything
    const allShortages: Array<{ product: string; material: string; required: number; available: number; unit: string; missing: number }> = [];

    for (const line of lines) {
        const { data: bomItems } = await (supabase
            .from('bom_items') as any)
            .select('material_id, quantity_per_unit, material:inventory_items!material_id(name, current_stock, unit), product:inventory_items!product_id(name)')
            .eq('product_id', line.product_id);

        if (!bomItems || bomItems.length === 0) {
            const { data: prod } = await (supabase.from('inventory_items') as any).select('name').eq('id', line.product_id).single();
            return { error: `"${prod?.name ?? line.product_id}" no tiene una BOM definida` };
        }

        for (const bom of bomItems) {
            const required = bom.quantity_per_unit * line.quantity;
            const available = Number(bom.material.current_stock);
            if (available < required) {
                allShortages.push({
                    product: bom.product?.name ?? '—',
                    material: bom.material.name,
                    required,
                    available,
                    unit: bom.material.unit,
                    missing: required - available,
                });
            }
        }
    }

    if (allShortages.length > 0) {
        return { error: 'Stock insuficiente', shortages: allShortages };
    }

    // 2. Insert all production records (DB trigger handles inventory movements)
    for (const line of lines) {
        const parsed = productionRecordSchema.safeParse({ ...line, ...shared });
        if (!parsed.success) return { error: parsed.error.errors[0].message };

        const { error } = await (supabase
            .from('production_records') as any)
            .insert({ ...parsed.data, created_by: user.id, status: 'CONFIRMADA' } as any);

        if (error) return { error: error.message };
    }

    revalidatePath('/produccion');
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');

    return { success: true, count: lines.length };
}

export async function createProductionRecord(formData: ProductionRecordFormData) {
    const parsed = productionRecordSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // 1. Validate Stock (Application-level detailed check)
    // Fetch BOM for the product
    const { data: bomItems } = await (supabase
        .from('bom_items') as any)
        .select('material_id, quantity_per_unit, material:inventory_items!material_id(name, current_stock, unit)')
        .eq('product_id', parsed.data.product_id);

    if (!bomItems || bomItems.length === 0) {
        return { error: 'El producto no tiene una lista de materiales (BOM) definida' };
    }

    const shortages = [];
    for (const bom of bomItems) {
        const required = bom.quantity_per_unit * parsed.data.quantity;
        const available = Number(bom.material.current_stock);
        if (available < required) {
            shortages.push({
                material: bom.material.name,
                required,
                available,
                unit: bom.material.unit,
                missing: required - available
            });
        }
    }

    if (shortages.length > 0) {
        return {
            error: 'Stock insuficiente',
            shortages
        };
    }

    // 2. Insert Production Record
    // The DB trigger `trg_production_stock_impact` will handle the inventory movements automatically
    const { data, error } = await (supabase
        .from('production_records') as any)
        .insert({
            ...parsed.data,
            created_by: user.id,
            status: 'CONFIRMADA'
        } as any)
        .select('id, production_number')
        .single();

    if (error) return { error: error.message };

    revalidatePath('/produccion');
    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');

    return { data };
}

export async function getProductionRecords() {
    const supabase = await createClient();
    const { data, error } = await (supabase
        .from('production_records') as any)
        .select('*, product:inventory_items(name, unit)')
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { data };
}

export async function deleteProductionRecord(id: string) {
    const supabase = await createClient();

    // Soft delete / Anular
    const { error } = await (supabase
        .from('production_records') as any)
        .update({ status: 'ANULADA', updated_at: new Date().toISOString() } as any)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/produccion');
    return { success: true };
}
