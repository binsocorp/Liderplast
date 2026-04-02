'use server';

import { createClient } from '@/lib/supabase/server';
import { inventoryItemSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { InventoryItemFormData } from '@/lib/validation/schemas';

// -----------------------------------------------
// INVENTORY ITEMS
// -----------------------------------------------

export async function createInventoryItem(formData: InventoryItemFormData) {
    const parsed = inventoryItemSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const data = {
        ...parsed.data,
        purchase_unit: parsed.data.purchase_unit === '' ? null : parsed.data.purchase_unit
    };

    const { data: inserted, error } = await (supabase
        .from('inventory_items') as any)
        .insert(data as any)
        .select('id')
        .single();

    if (error) return { error: error.message };

    revalidatePath('/inventario');
    return { data: inserted };
}

export async function updateInventoryItem(id: string, formData: Partial<InventoryItemFormData>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const data = {
        ...formData,
        purchase_unit: formData.purchase_unit === '' ? null : formData.purchase_unit,
        updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase
        .from('inventory_items') as any)
        .update(data as any)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/inventario');
    return { success: true };
}

export async function createInventoryAdjustments(
    adjustments: Array<{ item_id: string; current_stock: number; quantity: number }>,
    motivo: string
) {
    if (!adjustments.length) return { error: 'Sin cambios para registrar' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const reference = `TOMA-${new Date().toISOString().split('T')[0]}`;
    const movements: any[] = [];

    for (const adj of adjustments) {
        if (adj.quantity === adj.current_stock) continue;

        if (adj.quantity > 0) {
            // AJUSTE establece el stock al valor indicado
            movements.push({
                item_id: adj.item_id,
                type: 'AJUSTE',
                quantity: adj.quantity,
                description: `Toma de inventario: ${motivo}`,
                reference,
                created_by: user.id,
            });
        } else if (adj.current_stock > 0) {
            // Para llevar a 0: SALIDA por el total actual
            movements.push({
                item_id: adj.item_id,
                type: 'SALIDA',
                quantity: adj.current_stock,
                description: `Toma de inventario (a cero): ${motivo}`,
                reference,
                created_by: user.id,
            });
        }
    }

    if (!movements.length) return { error: 'Sin diferencias entre conteo y stock actual' };

    const { error } = await (supabase
        .from('inventory_movements') as any)
        .insert(movements);

    if (error) return { error: error.message };

    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');
    return { success: true, count: movements.length };
}

export async function deleteInventoryItem(id: string) {
    const supabase = await createClient();

    // Soft delete
    const { error } = await (supabase
        .from('inventory_items') as any)
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/inventario');
    return { success: true };
}
