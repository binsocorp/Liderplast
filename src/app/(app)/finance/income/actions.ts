'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Helper: Recalcular paid_amount y payment_status de una orden ───
// Suma todos los finance_incomes vinculados y actualiza ambos campos.

async function recalcOrderPayment(supabase: any, orderId: string) {
    // 1. Get order total
    const { data: order } = await (supabase
        .from('orders') as any)
        .select('total_net')
        .eq('id', orderId)
        .single();

    if (!order) return;
    const totalNet = Number(order.total_net) || 0;

    // 2. Sum all incomes linked to this order
    const { data: incomes } = await (supabase
        .from('finance_incomes') as any)
        .select('amount')
        .eq('order_id', orderId);

    const totalPaid = (incomes || []).reduce((acc: number, i: any) => acc + Number(i.amount), 0);

    // 3. Determine payment_status (uses DB enum values: PENDING, PARTIAL, PAID)
    let newStatus = 'PENDING';
    if (totalPaid > 0 && totalPaid < totalNet) {
        newStatus = 'PARTIAL';
    } else if (totalPaid >= totalNet && totalNet > 0) {
        newStatus = 'PAID';
    }

    // 4. Update order
    await (supabase.from('orders') as any)
        .update({
            paid_amount: totalPaid,
            payment_status: newStatus,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', orderId);
}

// ─── Create Income ───

export async function createIncome(formData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    try {
        const amount = Number(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            return { error: 'Monto inválido' };
        }

        const isVenta = formData.income_type === 'VENTA';
        if (isVenta && !formData.order_id) {
            return { error: 'Debes seleccionar una venta para este tipo de ingreso' };
        }

        // 1. Insert income
        const insertPayload: any = {
            issue_date: formData.issue_date,
            amount,
            income_type: formData.income_type,
            order_id: isVenta ? formData.order_id : null,
            payment_method_id: formData.payment_method_id || null,
            description: formData.description || null,
            notes: formData.notes || null,
            currency: 'ARS',
            created_by_user_id: user.id,
        };
        // invoice_type: solo incluir si tiene valor (columna agregada en Phase 13)
        if (formData.invoice_type) insertPayload.invoice_type = formData.invoice_type;

        const { data: income, error: insertError } = await (supabase
            .from('finance_incomes') as any)
            .insert(insertPayload)
            .select('id')
            .single();

        if (insertError) return { error: insertError.message };

        // 2. If linked to order, recalc paid_amount + payment_status
        if (isVenta && formData.order_id) {
            await recalcOrderPayment(supabase, formData.order_id);
        }

        // 3. Sync to account_movements
        if (insertPayload.payment_method_id) {
            await (supabase.from('account_movements') as any)
                .insert({
                    payment_method_id: insertPayload.payment_method_id,
                    movement_type: 'INGRESO',
                    amount,
                    description: insertPayload.description || null,
                    movement_date: insertPayload.issue_date,
                    source_id: income.id,
                    source_type: 'income',
                    created_by_user_id: user.id,
                } as any);
        }

        revalidatePath('/finance/income');
        revalidatePath('/finance/caja');
        if (formData.order_id) {
            revalidatePath('/orders');
        }

        return { success: true };

    } catch (e: any) {
        return { error: e.message || 'Error inesperado' };
    }
}

// ─── Update Income ───

export async function updateIncome(id: string, formData: any) {
    const supabase = await createClient();

    // 1. Get current income to check if order changed
    const { data: current, error: fetchError } = await (supabase
        .from('finance_incomes') as any)
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !current) return { error: 'Ingreso no encontrado' };

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) return { error: 'Monto inválido' };

    const isVenta = formData.income_type === 'VENTA';
    if (isVenta && !formData.order_id) return { error: 'Debes seleccionar una venta' };

    // 2. Update income
    const updatePayload: any = {
        issue_date: formData.issue_date,
        amount,
        income_type: formData.income_type,
        order_id: isVenta ? formData.order_id : null,
        payment_method_id: formData.payment_method_id || null,
        description: formData.description || null,
        notes: formData.notes || null,
    };
    // invoice_type: solo incluir si tiene valor (columna agregada en Phase 13)
    if (formData.invoice_type) updatePayload.invoice_type = formData.invoice_type;

    const { error: updateError } = await (supabase
        .from('finance_incomes') as any)
        .update(updatePayload)
        .eq('id', id);

    if (updateError) return { error: updateError.message };

    // 3. Recalc old order if order changed
    const oldOrderId = current.income_type === 'VENTA' ? current.order_id : null;
    const newOrderId = isVenta ? formData.order_id : null;

    if (oldOrderId && oldOrderId !== newOrderId) {
        await recalcOrderPayment(supabase, oldOrderId);
    }
    if (newOrderId) {
        await recalcOrderPayment(supabase, newOrderId);
    }

    // 4. Sync account_movements
    if (formData.payment_method_id) {
        const { data: existing } = await (supabase.from('account_movements') as any)
            .select('id')
            .eq('source_id', id)
            .eq('source_type', 'income')
            .maybeSingle();

        if (existing) {
            await (supabase.from('account_movements') as any)
                .update({
                    payment_method_id: formData.payment_method_id,
                    amount,
                    description: formData.description || null,
                    movement_date: formData.issue_date,
                } as any)
                .eq('id', existing.id);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            await (supabase.from('account_movements') as any)
                .insert({
                    payment_method_id: formData.payment_method_id,
                    movement_type: 'INGRESO',
                    amount,
                    description: formData.description || null,
                    movement_date: formData.issue_date,
                    source_id: id,
                    source_type: 'income',
                    created_by_user_id: user?.id,
                } as any);
        }
    } else {
        await (supabase.from('account_movements') as any)
            .delete()
            .eq('source_id', id)
            .eq('source_type', 'income');
    }

    revalidatePath('/finance/income');
    revalidatePath('/finance/caja');
    revalidatePath('/orders');
    return { success: true };
}

// ─── Delete Income ───

export async function deleteIncome(id: string) {
    const supabase = await createClient();

    // 1. Get income to check if linked
    const { data: income, error: fetchError } = await (supabase
        .from('finance_incomes') as any)
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !income) return { error: 'Ingreso no encontrado' };

    // 2. Delete linked account_movement first
    await (supabase.from('account_movements') as any)
        .delete()
        .eq('source_id', id)
        .eq('source_type', 'income');

    // 3. Delete income
    const { error: delError } = await (supabase
        .from('finance_incomes') as any)
        .delete()
        .eq('id', id);

    if (delError) return { error: delError.message };

    // 4. If was linked to order, recalc
    if (income.income_type === 'VENTA' && income.order_id) {
        await recalcOrderPayment(supabase, income.order_id);
    }

    revalidatePath('/finance/income');
    revalidatePath('/finance/caja');
    if (income.order_id) {
        revalidatePath('/orders');
    }

    return { success: true };
}
