import { createClient } from '@/lib/supabase/server';
import { InstallersClient } from './InstallersClient';

export default async function AdminInstallersPage() {
    const supabase = await createClient();
    const [installers, provinces] = await Promise.all([
        supabase.from('installers').select('*').order('name'),
        supabase.from('provinces').select('id, name').order('name')
    ]);

    return <InstallersClient installers={installers.data ?? []} provinces={provinces.data ?? []} />;
}
