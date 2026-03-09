'use server';

import { createClient } from '@/lib/supabase/server';
import { purchaseSchema, purchaseItemSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { PurchaseFormData, PurchaseItemFormData } from '@/lib/validation/schemas';

// -----------------------------------------------
// PURCHASES
// -----------------------------------------------

interface CreatePurchaseData {
    purchase: PurchaseFormData;
    items: PurchaseItemFormData[];
}

export async function createPurchase(data: CreatePurchaseData) {
    const parsedPurchase = purchaseSchema.safeParse(data.purchase);
    if (!parsedPurchase.success) {
        return { error: parsedPurchase.error.errors[0].message };
    }

    if (!data.items || data.items.length === 0) {
        return { error: 'Debe agregar al menos un ítem a la compra' };
    }

    // Validate each item
    for (const item of data.items) {
        const parsedItem = purchaseItemSchema.safeParse(item);
        if (!parsedItem.success) {
            return { error: parsedItem.error.errors[0].message };
        }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // 1. Create purchase header
    const { data: purchase, error: purchaseError } = await (supabase
        .from('purchases') as any)
        .insert({
            ...parsedPurchase.data,
            created_by: user.id,
        } as any)
        .select('id, purchase_number')
        .single();

    if (purchaseError) return { error: purchaseError.message };

    // 2. Insert purchase items (triggers will create inventory movements)
    for (const item of data.items) {
        const { error: itemError } = await (supabase
            .from('purchase_items') as any)
            .insert({
                purchase_id: purchase.id,
                item_id: item.item_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
            } as any);

        if (itemError) {
            return { error: `Error al agregar ítem: ${itemError.message}` };
        }
    }

    revalidatePath('/inventario');
    revalidatePath('/inventario/compras');
    revalidatePath('/inventario/movimientos');
    return { data: purchase };
}

export async function deletePurchase(id: string) {
    const supabase = await createClient();

    // Soft delete: mark as ANULADA (items/movements remain for audit)
    const { error } = await (supabase
        .from('purchases') as any)
        .update({ status: 'ANULADA', updated_at: new Date().toISOString() } as any)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/inventario/compras');
    return { success: true };
}
