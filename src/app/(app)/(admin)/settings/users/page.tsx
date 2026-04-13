import { createClient } from '@/lib/supabase/server';
import { UsersClient } from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const supabase = await createClient();

    const { data: users, error } = await supabase.rpc('get_users_with_profiles' as any);

    if (error) {
        console.error('Error fetching users:', error);
    }

    return (
        <div className="p-1">
            <UsersClient users={(users as any) || []} />
        </div>
    );
}
