import { createClient } from '@/lib/supabase/server';
import { ProvincesClient } from './ProvincesClient';

export default async function ProvincesPage() {
    const supabase = await createClient();
    const { data: provinces } = await supabase.from('provinces').select('*').order('name');

    return <ProvincesClient provinces={provinces ?? []} />;
}
