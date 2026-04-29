'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function recalcOrderPayment(supabase: any, orderId: string) {
    const { data: order } = await (supabase.from('orders') as any)
        .select('total_net')
        .eq('id', orderId)
        .single();

    if (!order) return;
    const totalNet = Number(order.total_net) || 0;

    const { data: incomes } = await (supabase.from('finance_incomes') as any)
        .select('amount')
        .eq('order_id', orderId);

    const totalPaid = (incomes || []).reduce((acc: number, i: any) => acc + Number(i.amount), 0);

    let newStatus = 'PENDING';
    if (totalPaid > 0 && totalPaid < totalNet) {
        newStatus = 'PARTIAL';
    } else if (totalPaid >= totalNet && totalNet > 0) {
        newStatus = 'PAID';
    }

    await (supabase.from('orders') as any)
        .update({
            paid_amount: totalPaid,
            payment_status: newStatus,
            updated_at: new Date().toISOString()
        } as any)
        .eq('id', orderId);
}

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
        if (formData.invoice_type) insertPayload.invoice_type = formData.invoice_type;
        if (formData.reference_number) insertPayload.reference_number = formData.reference_number;

        const { error: insertError } = await (supabase.from('finance_incomes') as any)
            .insert(insertPayload);

        if (insertError) return { error: insertError.message };

        if (isVenta && formData.order_id) {
            await recalcOrderPayment(supabase, formData.order_id);
        }

        revalidatePath('/finance/income');
        revalidatePath('/finance/caja');
        if (formData.order_id) revalidatePath('/orders');

        return { success: true };

    } catch (e: any) {
        return { error: e.message || 'Error inesperado' };
    }
}

export async function updateIncome(id: string, formData: any) {
    const supabase = await createClient();

    const { data: current, error: fetchError } = await (supabase.from('finance_incomes') as any)
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !current) return { error: 'Ingreso no encontrado' };

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) return { error: 'Monto inválido' };

    const isVenta = formData.income_type === 'VENTA';
    if (isVenta && !formData.order_id) return { error: 'Debes seleccionar una venta' };

    const updatePayload: any = {
        issue_date: formData.issue_date,
        amount,
        income_type: formData.income_type,
        order_id: isVenta ? formData.order_id : null,
        payment_method_id: formData.payment_method_id || null,
        description: formData.description || null,
        notes: formData.notes || null,
    };
    if (formData.invoice_type) updatePayload.invoice_type = formData.invoice_type;
    if (formData.reference_number !== undefined) updatePayload.reference_number = formData.reference_number || null;

    const { error: updateError } = await (supabase.from('finance_incomes') as any)
        .update(updatePayload)
        .eq('id', id);

    if (updateError) return { error: updateError.message };

    const oldOrderId = current.income_type === 'VENTA' ? current.order_id : null;
    const newOrderId = isVenta ? formData.order_id : null;

    if (oldOrderId && oldOrderId !== newOrderId) {
        await recalcOrderPayment(supabase, oldOrderId);
    }
    if (newOrderId) {
        await recalcOrderPayment(supabase, newOrderId);
    }

    revalidatePath('/finance/income');
    revalidatePath('/finance/caja');
    revalidatePath('/orders');
    return { success: true };
}

export async function deleteIncome(id: string) {
    const supabase = await createClient();

    const { data: income, error: fetchError } = await (supabase.from('finance_incomes') as any)
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !income) return { error: 'Ingreso no encontrado' };

    const { error: delError } = await (supabase.from('finance_incomes') as any)
        .delete()
        .eq('id', id);

    if (delError) return { error: delError.message };

    if (income.income_type === 'VENTA' && income.order_id) {
        await recalcOrderPayment(supabase, income.order_id);
    }

    revalidatePath('/finance/income');
    revalidatePath('/finance/caja');
    if (income.order_id) revalidatePath('/orders');

    return { success: true };
}
