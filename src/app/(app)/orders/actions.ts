'use server';

import { createClient } from '@/lib/supabase/server';
import { orderSchema, orderItemSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { OrderFormData, OrderItemFormData } from '@/lib/validation/schemas';

// -----------------------------------------------
// ORDERS
// -----------------------------------------------

export async function createOrder(formData: OrderFormData) {
    const parsed = orderSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // Snapshot del cliente si existe
    let clientName = parsed.data.client_name;
    let deliveryAddress = parsed.data.delivery_address;

    if (parsed.data.client_id) {
        const { data: client } = await supabase
            .from('clients')
            .select('name, address, city')
            .eq('id', parsed.data.client_id)
            .single();
        if (client) {
            clientName = clientName || client.name;
            deliveryAddress = deliveryAddress || client.address;
        }
    }

    const { data, error } = await (supabase
        .from('orders') as any)
        .insert({
            ...parsed.data,
            client_name: clientName,
            delivery_address: deliveryAddress,
            created_by: user.id,
        } as any)
        .select('id')
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/orders');
    return { data };
}

export async function updateOrder(id: string, formData: Partial<OrderFormData>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // If assigning to a flete, check capacity
    if (formData.trip_id) {
        const { data: currentOrder }: any = await supabase.from('orders').select('trip_id').eq('id', id).single();

        if (currentOrder?.trip_id !== formData.trip_id) {
            const { data: trip }: any = await supabase
                .from('trips')
                .select('truck_type:truck_types(capacity)')
                .eq('id', formData.trip_id)
                .single();

            if (trip?.truck_type?.capacity) {
                const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('trip_id', formData.trip_id);

                if (count !== null && count >= trip.truck_type.capacity) {
                    return { error: 'El flete seleccionado ya alcanzó su capacidad máxima.' };
                }
            }
        }
    }

    const { error } = await (supabase
        .from('orders') as any)
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    return { success: true };
}

export async function deleteOrder(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/orders');
    return { success: true };
}

// -----------------------------------------------
// ORDER ITEMS
// -----------------------------------------------

export async function addOrderItem(formData: OrderItemFormData) {
    const parsed = orderItemSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();

    // Get catalog item name for description
    const { data: catalogItem } = await supabase
        .from('catalog_items')
        .select('name, type')
        .eq('id', parsed.data.catalog_item_id)
        .single();

    const { error } = await supabase.from('order_items').insert({
        ...parsed.data,
        description: parsed.data.description || catalogItem?.name || '',
        type: (parsed.data.type || catalogItem?.type || 'PRODUCTO') as any,
    } as any);

    if (error) return { error: error.message };

    revalidatePath(`/orders/${parsed.data.order_id}`);
    return { success: true };
}

export async function updateOrderItem(
    itemId: string,
    orderId: string,
    data: {
        quantity?: number;
        unit_price_net?: number;
    }
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('order_items')
        .update(data)
        .eq('id', itemId);

    if (error) return { error: error.message };

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

export async function removeOrderItem(itemId: string, orderId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

    if (error) return { error: error.message };

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

// -----------------------------------------------
// KITS (Quick-add)
// -----------------------------------------------

export async function addKit(orderId: string, kitKey: string) {
    const { KITS } = await import('@/lib/domain/kits');
    const kit = KITS[kitKey];
    if (!kit) return { error: 'Kit no encontrado' };

    const supabase = await createClient();

    // Get the order's province for price lookup
    const { data: order } = await supabase
        .from('orders')
        .select('province_id')
        .eq('id', orderId)
        .single();

    if (!order) return { error: 'Pedido no encontrado' };

    // For each kit item, find the catalog item and its price
    for (const kitItem of kit.items) {
        const { data: catalogItem } = await supabase
            .from('catalog_items')
            .select('id, name, type')
            .eq('name', kitItem.catalogItemName)
            .eq('is_active', true)
            .single();

        if (!catalogItem) continue;

        // Get price for this item in this province
        const { data: priceData } = await supabase
            .from('prices')
            .select('unit_price_net')
            .eq('catalog_item_id', catalogItem.id)
            .eq('province_id', order.province_id)
            .eq('is_active', true)
            .single();

        await supabase.from('order_items').insert({
            order_id: orderId,
            catalog_item_id: catalogItem.id,
            type: catalogItem.type,
            description: catalogItem.name,
            quantity: kitItem.quantity,
            unit_price_net: priceData?.unit_price_net ?? 0,
        });
    }

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
}

// -----------------------------------------------
// PRICE LOOKUP
// -----------------------------------------------

export async function getPrice(catalogItemId: string, provinceId: string) {
    const supabase = await createClient();

    const { data } = await supabase
        .from('prices')
        .select('unit_price_net')
        .eq('catalog_item_id', catalogItemId)
        .eq('province_id', provinceId)
        .eq('is_active', true)
        .single();

    return data?.unit_price_net ?? 0;
}
