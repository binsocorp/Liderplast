'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { subscriptionSchema, type SubscriptionFormData } from '@/lib/validation/schemas';

// -----------------------------------------------
// SUBSCRIPTIONS
// -----------------------------------------------

export async function createSubscription(formData: SubscriptionFormData) {
    const parsed = subscriptionSchema.safeParse(formData);
    if (!parsed.success) return { error: parsed.error.errors[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
            ...parsed.data,
            user_id: user.id,
        })
        .select('id')
        .single();

    if (error) return { error: error.message };
    revalidatePath('/subscriptions');
    return { data };
}

export async function updateSubscription(id: string, formData: Partial<SubscriptionFormData>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await supabase
        .from('user_subscriptions')
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/subscriptions');
    revalidatePath(`/subscriptions/${id}`);
    return { success: true };
}

export async function deleteSubscription(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/subscriptions');
    return { success: true };
}

// -----------------------------------------------
// EXPENSES
// -----------------------------------------------

export async function addSubscriptionExpense(subscriptionId: string, amount: number, expenseDate: string, notes?: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('subscription_expenses')
        .insert({
            subscription_id: subscriptionId,
            amount,
            expense_date: expenseDate,
            notes,
        });

    if (error) return { error: error.message };
    revalidatePath(`/subscriptions/${subscriptionId}`);
    return { success: true };
}

export async function removeSubscriptionExpense(expenseId: string, subscriptionId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('subscription_expenses')
        .delete()
        .eq('id', expenseId);

    if (error) return { error: error.message };
    revalidatePath(`/subscriptions/${subscriptionId}`);
    return { success: true };
}
