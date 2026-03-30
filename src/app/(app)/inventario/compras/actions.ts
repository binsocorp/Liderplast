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

// ─── Helper: Create linked expense for a purchase ───
async function createLinkedExpense(supabase: any, purchase: {
    id: string;
    purchase_number: string;
    purchase_date: string;
    total: number;
    supplier_name: string;
}) {
    // Look up the "Compras" category (fallback: null)
    const { data: category } = await supabase
        .from('finance_categories')
        .select('id')
        .ilike('name', '%compra%')
        .limit(1)
        .single();

    await (supabase.from('finance_expenses') as any)
        .insert({
            issue_date: purchase.purchase_date,
            amount: purchase.total,
            description: `Compra ${purchase.purchase_number}${purchase.supplier_name ? ` — ${purchase.supplier_name}` : ''}`,
            document_number: purchase.purchase_number,
            category_id: category?.id ?? null,
            status: 'PENDIENTE',
            purchase_id: purchase.id,
        } as any);
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
        .select('id, purchase_number, purchase_date, total, supplier_name')
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

    // 3. CMP-01: Auto-create linked expense (PENDIENTE)
    if (parsedPurchase.data.status === 'CONFIRMADA' || !parsedPurchase.data.status) {
        // Fetch fresh total (calculated by DB trigger/default)
        const { data: freshPurchase } = await (supabase
            .from('purchases') as any)
            .select('total, supplier_name')
            .eq('id', purchase.id)
            .single();

        await createLinkedExpense(supabase, {
            id: purchase.id,
            purchase_number: purchase.purchase_number,
            purchase_date: parsedPurchase.data.purchase_date,
            total: freshPurchase?.total ?? 0,
            supplier_name: freshPurchase?.supplier_name ?? parsedPurchase.data.supplier_name ?? '',
        });
    }

    revalidatePath('/inventario');
    revalidatePath('/inventario/compras');
    revalidatePath('/inventario/movimientos');
    revalidatePath('/finance/expenses');
    return { data: purchase };
}

export async function linkPurchaseSupplier(purchaseId: string, supplierId: string) {
    const supabase = await createClient();

    // Also update supplier_name from the suppliers table for consistency
    const { data: supplier } = await (supabase
        .from('suppliers') as any)
        .select('name')
        .eq('id', supplierId)
        .single();

    const { error } = await (supabase
        .from('purchases') as any)
        .update({
            supplier_id: supplierId,
            supplier_name: supplier?.name ?? '',
            updated_at: new Date().toISOString(),
        } as any)
        .eq('id', purchaseId);

    if (error) return { error: error.message };

    revalidatePath('/inventario/compras');
    return { success: true };
}

export async function deletePurchase(id: string) {
    const supabase = await createClient();

    // Soft delete: mark as ANULADA (items/movements remain for audit)
    const { error } = await (supabase
        .from('purchases') as any)
        .update({ status: 'ANULADA', updated_at: new Date().toISOString() } as any)
        .eq('id', id);

    if (error) return { error: error.message };

    // CMP-04: Annul linked expense (if PENDIENTE)
    const { data: linkedExpense } = await (supabase
        .from('finance_expenses') as any)
        .select('id, status')
        .eq('purchase_id', id)
        .single();

    if (linkedExpense) {
        await (supabase
            .from('finance_expenses') as any)
            .update({ status: 'ANULADO' } as any)
            .eq('id', linkedExpense.id);
    }

    revalidatePath('/inventario/compras');
    revalidatePath('/finance/expenses');
    return { success: true };
}
