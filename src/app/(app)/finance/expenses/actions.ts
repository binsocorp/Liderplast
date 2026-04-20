'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function syncExpenseMovement(supabase: any, expenseId: string, data: any, userId: string) {
    const isPagado = data.status === 'PAGADO';
    const hasMethod = !!data.payment_method_id;

    if (isPagado && hasMethod) {
        const { data: existing } = await (supabase.from('account_movements') as any)
            .select('id')
            .eq('source_id', expenseId)
            .eq('source_type', 'expense')
            .maybeSingle();

        if (existing) {
            await (supabase.from('account_movements') as any)
                .update({
                    payment_method_id: data.payment_method_id,
                    amount: Number(data.amount),
                    description: data.description || null,
                    movement_date: data.payment_date || data.issue_date,
                } as any)
                .eq('id', existing.id);
        } else {
            await (supabase.from('account_movements') as any)
                .insert({
                    payment_method_id: data.payment_method_id,
                    movement_type: 'EGRESO',
                    amount: Number(data.amount),
                    description: data.description || null,
                    movement_date: data.payment_date || data.issue_date,
                    source_id: expenseId,
                    source_type: 'expense',
                    created_by_user_id: userId,
                } as any);
        }
    } else {
        await (supabase.from('account_movements') as any)
            .delete()
            .eq('source_id', expenseId)
            .eq('source_type', 'expense');
    }
}

export async function createExpense(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const finalData = { ...data };
    if (finalData.status === 'PAGADO' && !finalData.payment_date) {
        finalData.payment_date = finalData.issue_date;
    }
    if (finalData.status === 'PENDIENTE') {
        finalData.payment_date = null;
    }

    const { data: result, error } = await supabase
        .from('finance_expenses')
        .insert(finalData)
        .select()
        .single();

    if (error) {
        console.error('Error creating expense:', error);
        return { error: error.message };
    }

    await syncExpenseMovement(supabase, result.id, finalData, user?.id);

    revalidatePath('/finance/expenses');
    revalidatePath('/finance/caja');
    return { data: result };
}

export async function updateExpense(id: string, data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const finalData = { ...data };
    if (finalData.status === 'PAGADO' && !finalData.payment_date) {
        finalData.payment_date = finalData.issue_date || new Date().toISOString().split('T')[0];
    }
    if (finalData.status === 'PENDIENTE') {
        finalData.payment_date = null;
    }

    // Get current expense to fill missing fields for movement sync
    const { data: current } = await supabase
        .from('finance_expenses')
        .select('amount, payment_method_id, issue_date, description')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('finance_expenses')
        .update(finalData)
        .eq('id', id);

    if (error) {
        console.error('Error updating expense:', error);
        return { error: error.message };
    }

    const merged = { ...current, ...finalData };
    await syncExpenseMovement(supabase, id, merged, user?.id);

    revalidatePath('/finance/expenses');
    revalidatePath('/finance/caja');
    return { success: true };
}

export async function deleteExpense(id: string) {
    const supabase = await createClient();

    await (supabase.from('account_movements') as any)
        .delete()
        .eq('source_id', id)
        .eq('source_type', 'expense');

    const { error } = await supabase
        .from('finance_expenses')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/finance/expenses');
    revalidatePath('/finance/caja');
    return { success: true };
}

export async function toggleExpenseStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
    const data: any = { status: newStatus };

    if (newStatus === 'PAGADO') {
        data.payment_date = new Date().toISOString().split('T')[0];
    } else {
        data.payment_date = null;
    }

    return updateExpense(id, data);
}
