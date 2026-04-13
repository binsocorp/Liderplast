import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PerfilClient } from './PerfilClient';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await (supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single() as any);

    return (
        <div className="p-1">
            <PerfilClient
                email={user.email ?? ''}
                fullName={profile?.full_name ?? null}
            />
        </div>
    );
}
