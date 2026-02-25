import { createClient } from '@/lib/supabase/server';
import { InstallersClient } from './InstallersClient';

export default async function AdminInstallersPage() {
    const supabase = await createClient();
    const { data: installers } = await supabase.from('installers').select('*').order('name');

    return <InstallersClient installers={installers ?? []} />;
}
