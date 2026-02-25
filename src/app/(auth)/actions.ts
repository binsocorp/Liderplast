'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email y contraseña son obligatorios' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: 'Credenciales inválidas' };
    }

    redirect('/orders');
}

export async function registerAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;

    if (!email || !password || !fullName) {
        return { error: 'Todos los campos son obligatorios' };
    }

    if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (error) {
        return { error: error.message };
    }

    redirect('/orders');
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
