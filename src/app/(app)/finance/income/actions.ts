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
        const { error: insertError } = await (supabase
            .from('finance_incomes') as any)
            .insert({
                issue_date: formData.issue_date,
                amount,
                income_type: formData.income_type,
                order_id: isVenta ? formData.order_id : null,
                payment_method_id: formData.payment_method_id || null,
                description: formData.description || null,
                notes: formData.notes || null,
                currency: 'ARS',
                created_by_user_id: user.id
            } as any);

        if (insertError) return { error: insertError.message };

        // 2. If linked to order, recalc paid_amount + payment_status
        if (isVenta && formData.order_id) {
            await recalcOrderPayment(supabase, formData.order_id);
        }

        revalidatePath('/finance/income');
        if (formData.order_id) {
            revalidatePath('/orders');
        }

        return { success: true };

    } catch (e: any) {
        return { error: e.message || 'Error inesperado' };
    }
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

    // 2. Delete income
    const { error: delError } = await (supabase
        .from('finance_incomes') as any)
        .delete()
        .eq('id', id);

    if (delError) return { error: delError.message };

    // 3. If was linked to order, recalc
    if (income.income_type === 'VENTA' && income.order_id) {
        await recalcOrderPayment(supabase, income.order_id);
    }

    revalidatePath('/finance/income');
    if (income.order_id) {
        revalidatePath('/orders');
    }

    return { success: true };
}
