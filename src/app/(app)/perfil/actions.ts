'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateName(fullName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName } as any)
        .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/perfil');
    return { success: true };
}

export async function updatePassword(newPassword: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) return { error: error.message };

    return { success: true };
}
