'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateUserProfile(
    userId: string,
    data: { role?: string; can_override_prices?: boolean; full_name?: string }
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('profiles')
        .update(data as any)
        .eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath('/settings/users');
    return { success: true };
}

export async function createUser(data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
}) {
    const admin = createAdminClient();

    const { data: userData, error } = await admin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
    });

    if (error) return { error: error.message };

    const { error: profileError } = await admin
        .from('profiles')
        .upsert({
            id: userData.user.id,
            full_name: data.full_name,
            role: data.role,
            can_override_prices: false,
        } as any);

    if (profileError) return { error: profileError.message };

    revalidatePath('/settings/users');
    return { success: true };
}
