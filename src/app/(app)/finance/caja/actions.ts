'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Create movement (INGRESO, EGRESO, SALDO_INICIAL, AJUSTE) ───
export async function createMovement(data: {
    payment_method_id: string;
    movement_type: string;
    amount: number;
    description?: string;
    movement_date: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    if (!data.payment_method_id) return { error: 'Seleccione una cuenta' };
    if (!data.amount || data.amount <= 0) return { error: 'El monto debe ser mayor a 0' };

    const { error } = await (supabase.from('account_movements') as any)
        .insert({
            ...data,
            created_by_user_id: user.id,
        } as any);

    if (error) return { error: error.message };

    revalidatePath('/finance/caja');
    return { success: true };
}

// ─── Create transfer between accounts ───
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

    const desc = data.description || 'Transferencia entre cuentas';

    const { error: e1 } = await (supabase.from('account_movements') as any)
        .insert({
            payment_method_id: data.from_method_id,
            movement_type: 'TRANSFERENCIA_OUT',
            amount: data.amount,
            description: desc,
            transfer_to_method_id: data.to_method_id,
            movement_date: data.movement_date,
            created_by_user_id: user.id,
        } as any);

    if (e1) return { error: e1.message };

    const { error: e2 } = await (supabase.from('account_movements') as any)
        .insert({
            payment_method_id: data.to_method_id,
            movement_type: 'TRANSFERENCIA_IN',
            amount: data.amount,
            description: desc,
            transfer_to_method_id: data.from_method_id,
            movement_date: data.movement_date,
            created_by_user_id: user.id,
        } as any);

    if (e2) return { error: e2.message };

    revalidatePath('/finance/caja');
    return { success: true };
}

// ─── Delete movement ───
export async function deleteMovement(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from('account_movements') as any)
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };
    revalidatePath('/finance/caja');
    return { success: true };
}
