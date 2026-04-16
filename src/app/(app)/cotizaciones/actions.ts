'use server';

import { createClient } from '@/lib/supabase/server';
import { quotationSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { QuotationFormData } from '@/lib/validation/schemas';

// -----------------------------------------------
// Tipos internos
// -----------------------------------------------

interface QuotationItemInput {
    catalog_item_id: string;
    type: 'PRODUCTO' | 'SERVICIO';
    description: string;
    quantity: number;
    unit_price_net: number;
}

// -----------------------------------------------
// CREAR COTIZACIÓN (header + ítems en bulk)
// -----------------------------------------------

export async function createQuotation(
    formData: QuotationFormData,
    items: QuotationItemInput[]
) {
    const parsed = quotationSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // Insertar cabecera de cotización
    const { data: quotation, error: quotationError } = await (supabase
        .from('quotations') as any)
        .insert({
            ...parsed.data,
            created_by: user.id,
        } as any)
        .select('id')
        .single();

    if (quotationError) return { error: quotationError.message };

    const quotationId = (quotation as any).id;

    // Insertar ítems en bulk si hay alguno
    if (items.length > 0) {
        const itemsToInsert = items.map((item, idx) => ({
            quotation_id: quotationId,
            catalog_item_id: item.catalog_item_id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unit_price_net: item.unit_price_net,
            sort_order: idx,
        }));

        const { error: itemsError } = await (supabase
            .from('quotation_items') as any)
            .insert(itemsToInsert as any);

        if (itemsError) return { error: itemsError.message };
    }

    revalidatePath('/cotizaciones');
    return { data: { id: quotationId } };
}

// -----------------------------------------------
// ACTUALIZAR COTIZACIÓN
// -----------------------------------------------

export async function updateQuotation(id: string, formData: Partial<QuotationFormData>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await (supabase
        .from('quotations') as any)
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/cotizaciones');
    revalidatePath(`/cotizaciones/${id}`);
    return { success: true };
}

// -----------------------------------------------
// REEMPLAZAR ÍTEMS (borra y reinserta todos)
// -----------------------------------------------

export async function replaceQuotationItems(
    quotationId: string,
    items: QuotationItemInput[]
) {
    const supabase = await createClient();

    // Borrar ítems existentes
    const { error: deleteError } = await (supabase
        .from('quotation_items') as any)
        .delete()
        .eq('quotation_id', quotationId);

    if (deleteError) return { error: deleteError.message };

    // Insertar nuevos ítems
    if (items.length > 0) {
        const itemsToInsert = items.map((item, idx) => ({
            quotation_id: quotationId,
            catalog_item_id: item.catalog_item_id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unit_price_net: item.unit_price_net,
            sort_order: idx,
        }));

        const { error: insertError } = await (supabase
            .from('quotation_items') as any)
            .insert(itemsToInsert as any);

        if (insertError) return { error: insertError.message };
    }

    revalidatePath(`/cotizaciones/${quotationId}`);
    return { success: true };
}

// -----------------------------------------------
// ACEPTAR COTIZACIÓN → crea un pedido vinculado
// -----------------------------------------------

export async function acceptQuotation(quotationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // Traer cotización con sus ítems
    const { data: quotation, error: fetchError } = await (supabase
        .from('quotations') as any)
        .select('*, items:quotation_items(*)')
        .eq('id', quotationId)
        .single();

    if (fetchError || !quotation) return { error: 'Cotización no encontrada' };
    if ((quotation as any).status !== 'COTIZACION') {
        return { error: 'Solo se pueden aceptar cotizaciones en estado activo' };
    }

    // Crear el pedido en estado PENDIENTE
    const { data: order, error: orderError } = await (supabase
        .from('orders') as any)
        .insert({
            client_id: (quotation as any).client_id,
            client_name: (quotation as any).client_name,
            client_document: (quotation as any).client_document,
            client_phone: (quotation as any).client_phone,
            delivery_address: (quotation as any).delivery_address,
            city: (quotation as any).city,
            province_id: (quotation as any).province_id,
            channel: (quotation as any).channel,
            seller_id: (quotation as any).seller_id,
            reseller_id: (quotation as any).reseller_id,
            freight_amount: (quotation as any).freight_amount ?? 0,
            installation_amount: (quotation as any).installation_amount ?? 0,
            travel_amount: (quotation as any).travel_amount ?? 0,
            other_amount: (quotation as any).other_amount ?? 0,
            discount_amount: (quotation as any).discount_amount ?? 0,
            tax_amount_manual: (quotation as any).tax_amount_manual ?? 0,
            notes: (quotation as any).notes,
            status: 'CONFIRMADO',
            created_by: user.id,
        } as any)
        .select('id, order_number')
        .single();

    if (orderError) return { error: orderError.message };

    const orderId = (order as any).id;
    const orderNumber = (order as any).order_number;

    // Copiar los ítems al pedido
    const items: any[] = (quotation as any).items ?? [];
    if (items.length > 0) {
        const orderItems = items.map((item: any, idx: number) => ({
            order_id: orderId,
            catalog_item_id: item.catalog_item_id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unit_price_net: item.unit_price_net,
            sort_order: idx,
        }));

        const { error: itemsError } = await (supabase
            .from('order_items') as any)
            .insert(orderItems as any);

        if (itemsError) {
            // Rollback: delete the created order since items failed
            await (supabase.from('orders') as any).delete().eq('id', orderId);
            return { error: 'Error al copiar ítems al pedido: ' + itemsError.message };
        }
    }

    // Marcar cotización como ACEPTADA y vincular el pedido
    const { error: updateError } = await (supabase
        .from('quotations') as any)
        .update({
            status: 'ACEPTADA',
            converted_order_id: orderId,
            updated_at: new Date().toISOString(),
        } as any)
        .eq('id', quotationId);

    if (updateError) {
        // Rollback: delete order + items since quotation update failed
        await (supabase.from('order_items') as any).delete().eq('order_id', orderId);
        await (supabase.from('orders') as any).delete().eq('id', orderId);
        return { error: 'Error al actualizar cotización: ' + updateError.message };
    }

    revalidatePath('/cotizaciones');
    revalidatePath('/orders');
    return { data: { orderId, orderNumber } };
}

// -----------------------------------------------
// CANCELAR COTIZACIÓN
// -----------------------------------------------

export async function cancelQuotation(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await (supabase
        .from('quotations') as any)
        .update({
            status: 'RECHAZADA',
            updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/cotizaciones');
    revalidatePath(`/cotizaciones/${id}`);
    return { success: true };
}

// -----------------------------------------------
// ELIMINAR COTIZACIÓN
// -----------------------------------------------

export async function deleteQuotation(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: quotation } = await (supabase.from('quotations') as any)
        .select('converted_order_id')
        .eq('id', id)
        .single();

    if (!quotation) return { error: 'Cotización no encontrada' };
    if (quotation.converted_order_id) {
        return { error: 'No se puede eliminar una cotización que ya fue convertida a pedido' };
    }

    await (supabase.from('quotation_items') as any).delete().eq('quotation_id', id);

    const { error } = await (supabase.from('quotations') as any).delete().eq('id', id);
    if (error) return { error: error.message };

    revalidatePath('/cotizaciones');
    return { success: true };
}

// -----------------------------------------------
// AGREGAR KIT A COTIZACIÓN
// -----------------------------------------------

export async function addQuotationKit(quotationId: string, kitKey: string) {
    const { KITS } = await import('@/lib/domain/kits');
    const kit = KITS[kitKey];
    if (!kit) return { error: 'Kit no encontrado' };

    const supabase = await createClient();

    const { data: quotation } = await (supabase
        .from('quotations') as any)
        .select('province_id')
        .eq('id', quotationId)
        .single();

    if (!quotation) return { error: 'Cotización no encontrada' };

    for (const kitItem of kit.items) {
        const { data: catalogItem } = await supabase
            .from('catalog_items')
            .select('id, name, type')
            .eq('name', kitItem.catalogItemName)
            .eq('is_active', true)
            .single();

        if (!catalogItem) continue;

        const { data: priceData } = await (supabase
            .from('prices') as any)
            .select('unit_price_net')
            .eq('catalog_item_id', (catalogItem as any).id)
            .eq('province_id', (quotation as any).province_id)
            .eq('is_active', true)
            .single();

        await (supabase.from('quotation_items') as any).insert({
            quotation_id: quotationId,
            catalog_item_id: (catalogItem as any).id,
            type: (catalogItem as any).type,
            description: (catalogItem as any).name,
            quantity: kitItem.quantity,
            unit_price_net: (priceData as any)?.unit_price_net ?? 0,
        });
    }

    revalidatePath(`/cotizaciones/${quotationId}`);
    return { success: true };
}

// -----------------------------------------------
// CONSULTA DE PRECIO (provincia o lista revendedor)
// -----------------------------------------------

export async function getQuotationPrice(
    catalogItemId: string,
    provinceId: string,
    resellerPriceListId?: string | null
): Promise<number> {
    const supabase = await createClient();

    if (resellerPriceListId) {
        const { data } = await (supabase
            .from('reseller_prices') as any)
            .select('unit_price_net')
            .eq('catalog_item_id', catalogItemId)
            .eq('price_list_id', resellerPriceListId)
            .single();
        if (data) return (data as any).unit_price_net ?? 0;
    }

    const { data } = await (supabase
        .from('prices') as any)
        .select('unit_price_net')
        .eq('catalog_item_id', catalogItemId)
        .eq('province_id', provinceId)
        .eq('is_active', true)
        .single();

    return (data as any)?.unit_price_net ?? 0;
}
