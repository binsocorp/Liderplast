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
