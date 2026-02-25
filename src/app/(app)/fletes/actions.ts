'use server';

import { createClient } from '@/lib/supabase/server';
import { tripSchema, type TripFormData } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function createTrip(formData: TripFormData) {
    const parsed = tripSchema.safeParse(formData);
    if (!parsed.success) return { error: parsed.error.errors[0].message };

    const supabase = await createClient();
    const { data, error } = await (supabase
        .from('trips') as any)
        .insert(parsed.data as any)
        .select('id')
        .single();

    if (error) return { error: error.message };
    revalidatePath('/fletes');
    return { data };
}

export async function updateTrip(id: string, formData: Partial<TripFormData>) {
    const supabase = await createClient();
    const { error } = await (supabase.from('trips') as any).update(formData as any).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/fletes');
    return { success: true };
}

export async function deleteTrip(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from('trips') as any).delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/fletes');
    return { success: true };
}
