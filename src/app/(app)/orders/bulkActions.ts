'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { OrderItemFormData } from '@/lib/validation/schemas';

export async function addOrderItemsBulk(orderId: string, items: Omit<OrderItemFormData, 'order_id'>[]) {
    const supabase = await createClient();

    const insertData = items.map(item => ({
        order_id: orderId,
        catalog_item_id: item.catalog_item_id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unit_price_net: item.unit_price_net,
    }));

    const { error: insertError } = await supabase.from('order_items').insert(insertData as any);
    if (insertError) return { error: insertError.message };

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

export async function replaceOrderItems(orderId: string, items: Omit<OrderItemFormData, 'order_id'>[]) {
    const supabase = await createClient();

    // Eliminar items actuales
    const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', orderId);
    if (deleteError) return { error: deleteError.message };

    if (items.length === 0) {
        revalidatePath(`/orders/${orderId}`);
        return { success: true };
    }

    // Insertar nuevos
    return addOrderItemsBulk(orderId, items);
}
