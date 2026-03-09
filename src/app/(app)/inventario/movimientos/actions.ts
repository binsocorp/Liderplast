'use server';

import { createClient } from '@/lib/supabase/server';
import { inventoryMovementSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { InventoryMovementFormData } from '@/lib/validation/schemas';

export async function createMovement(formData: InventoryMovementFormData) {
    const parsed = inventoryMovementSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // For SALIDA, check stock first (application-level check in addition to DB trigger)
    if (parsed.data.type === 'SALIDA') {
        const { data: item } = await (supabase
            .from('inventory_items') as any)
            .select('current_stock, name')
            .eq('id', parsed.data.item_id)
            .single();

        if (item && Number(item.current_stock) < parsed.data.quantity) {
            return {
                error: `Stock insuficiente para "${item.name}". Stock actual: ${item.current_stock}, solicitado: ${parsed.data.quantity}`
            };
        }
    }

    const { data, error } = await (supabase
        .from('inventory_movements') as any)
        .insert({
            ...parsed.data,
            created_by: user.id,
        } as any)
        .select('id')
        .single();

    if (error) return { error: error.message };

    revalidatePath('/inventario');
    revalidatePath('/inventario/movimientos');
    return { data };
}
