import { createClient } from '@/lib/supabase/server';
import { ClientsClient } from './ClientsClient';

export default async function ClientsPage() {
    const supabase = await createClient();

    const [{ data: clients }, { data: provinces }] = await Promise.all([
        supabase.from('clients').select('*, province:provinces(name)').order('name'),
        supabase.from('provinces').select('id, name').order('name'),
    ]);

    return <ClientsClient clients={clients ?? []} provinces={provinces ?? []} />;
}
