'use server';

import { createClient } from '@/lib/supabase/server';
import { bomItemSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';
import type { BomItemFormData } from '@/lib/validation/schemas';

export async function saveBomItem(formData: BomItemFormData) {
    const parsed = bomItemSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await (supabase
        .from('bom_items') as any)
        .upsert(parsed.data as any, { onConflict: 'product_id,material_id' });

    if (error) return { error: error.message };

    revalidatePath('/produccion/bom');
    return { success: true };
}

export async function deleteBomItem(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await (supabase
        .from('bom_items') as any)
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/produccion/bom');
    return { success: true };
}

export async function getBomItems(productId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase
        .from('bom_items') as any)
        .select('*, material:inventory_items(name, unit)')
        .eq('product_id', productId);

    if (error) return { error: error.message };
    return { data };
}
