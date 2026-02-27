'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createExpense(data: any) {
    const supabase = await createClient();

    // Auto-calculate payment_date if status is PAGADO and not provided
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

    revalidatePath('/finance/expenses');
    return { data: result };
}

export async function updateExpense(id: string, data: any) {
    const supabase = await createClient();

    const finalData = { ...data };
    if (finalData.status === 'PAGADO' && !finalData.payment_date) {
        finalData.payment_date = finalData.issue_date || new Date().toISOString().split('T')[0];
    }
    if (finalData.status === 'PENDIENTE') {
        finalData.payment_date = null;
    }

    const { error } = await supabase
        .from('finance_expenses')
        .update(finalData)
        .eq('id', id);

    if (error) {
        console.error('Error updating expense:', error);
        return { error: error.message };
    }

    revalidatePath('/finance/expenses');
    return { success: true };
}

export async function deleteExpense(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('finance_expenses')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };
    revalidatePath('/finance/expenses');
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
