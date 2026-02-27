'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type EntityTable =
    | 'provinces'
    | 'clients'
    | 'sellers'
    | 'resellers'
    | 'suppliers'
    | 'catalog_items'
    | 'prices'
    | 'installers'
    | 'trips'
    | 'drivers'
    | 'vehicles'
    | 'finance_categories'
    | 'finance_subcategories'
    | 'finance_payment_methods'
    | 'finance_vendors'
    | 'finance_cost_centers';

export async function createEntity(table: EntityTable, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { data: result, error } = await (supabase
        .from(table as any)
        .insert(data as any)
        .select()
        .single() as any);

    if (error) {
        console.error(`Error creating ${table}:`, error);
        return { error: error.message };
    }

    revalidatePath('/master', 'layout');
    return { data: result };
}

export async function updateEntity(table: EntityTable, id: string, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { error } = await (supabase
        .from(table as any)
        .update(data as any)
        .eq('id', id) as any);

    if (error) {
        console.error(`Error updating ${table}:`, error);
        return { error: error.message };
    }

    revalidatePath('/master', 'layout');
    return { success: true };
}

export async function deleteEntity(table: EntityTable, id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await (supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as any);

    if (profile?.role !== 'ADMIN') {
        redirect('/orders');
    }

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };
    revalidatePath(`/master/${table}`);
    return { success: true };
}

export async function upsertPrices(prices: { catalog_item_id: string; province_id: string; unit_price_net: number; is_active?: boolean }[]) {
    const supabase = await createClient();

    // Supabase upsert requires primary keys, but for prices it has a unique constraint on (catalog_item_id, province_id).
    // The preferred way in Supabase is using `onConflict`.
    const { error } = await supabase
        .from('prices')
        .upsert(prices as any, { onConflict: 'catalog_item_id,province_id' });

    if (error) return { error: error.message };
    revalidatePath('/master');
    return { success: true };
}
