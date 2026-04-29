'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTransfer(data: {
    from_method_id: string;
    to_method_id: string;
    amount: number;
    description?: string;
    movement_date: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    if (!data.from_method_id || !data.to_method_id) return { error: 'Seleccione ambas cuentas' };
    if (data.from_method_id === data.to_method_id) return { error: 'Las cuentas deben ser distintas' };
    if (!data.amount || data.amount <= 0) return { error: 'El monto debe ser mayor a 0' };

    const transferId = crypto.randomUUID();
    const desc = data.description || 'Transferencia entre cuentas';

    const { error: e1 } = await (supabase.from('finance_expenses') as any)
        .insert({
            issue_date: data.movement_date,
            payment_date: data.movement_date,
            status: 'PAGADO',
            amount: data.amount,
            currency: 'ARS',
            payment_method_id: data.from_method_id,
            description: desc,
            expense_type: 'TRANSFERENCIA_OUT',
            transfer_id: transferId,
            created_by_user_id: user.id,
        } as any);

    if (e1) return { error: e1.message };

    const { error: e2 } = await (supabase.from('finance_incomes') as any)
        .insert({
            issue_date: data.movement_date,
            amount: data.amount,
            currency: 'ARS',
            payment_method_id: data.to_method_id,
            description: desc,
            income_type: 'TRANSFERENCIA_IN',
            transfer_id: transferId,
            created_by_user_id: user.id,
        } as any);

    if (e2) {
        await (supabase.from('finance_expenses') as any)
            .delete()
            .eq('transfer_id', transferId);
        return { error: e2.message };
    }

    revalidatePath('/finance/caja');
    return { success: true };
}

export async function deleteMovement(
    id: string,
    sourceType: 'income' | 'expense',
    transferId?: string | null,
) {
    const supabase = await createClient();

    if (transferId) {
        await (supabase.from('finance_incomes') as any).delete().eq('transfer_id', transferId);
        await (supabase.from('finance_expenses') as any).delete().eq('transfer_id', transferId);
    } else if (sourceType === 'income') {
        const { data: income } = await (supabase.from('finance_incomes') as any)
            .select('order_id')
            .eq('id', id)
            .single();

        const { error } = await (supabase.from('finance_incomes') as any).delete().eq('id', id);
        if (error) return { error: error.message };

        if (income?.order_id) {
            const { data: remaining } = await (supabase.from('finance_incomes') as any)
                .select('amount')
                .eq('order_id', income.order_id);
            const { data: order } = await (supabase.from('orders') as any)
                .select('total_net')
                .eq('id', income.order_id)
                .single();
            if (order) {
                const totalPaid = (remaining || []).reduce((a: number, i: any) => a + Number(i.amount), 0);
                const totalNet = Number(order.total_net) || 0;
                const newStatus = totalPaid <= 0 ? 'PENDING' : totalPaid < totalNet ? 'PARTIAL' : 'PAID';
                await (supabase.from('orders') as any)
                    .update({ paid_amount: totalPaid, payment_status: newStatus, updated_at: new Date().toISOString() })
                    .eq('id', income.order_id);
            }
        }
    } else {
        const { error } = await (supabase.from('finance_expenses') as any).delete().eq('id', id);
        if (error) return { error: error.message };
    }

    revalidatePath('/finance/caja');
    revalidatePath('/finance/income');
    revalidatePath('/finance/expenses');
    return { success: true };
}
