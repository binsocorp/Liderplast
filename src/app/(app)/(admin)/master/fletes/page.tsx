import { createClient } from '@/lib/supabase/server';
import { FletesClient } from './FletesClient';

export default async function AdminFletesPage() {
    const supabase = await createClient();
    const { data: trips } = await supabase.from('trips').select('*').order('created_at', { ascending: false });

    return <FletesClient trips={trips ?? []} />;
}
