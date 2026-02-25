import { createClient } from '@/lib/supabase/server';
import { ResellersClient } from './ResellersClient';

export default async function ResellersPage() {
    const supabase = await createClient();
    const { data: resellers } = await supabase.from('resellers').select('*').order('name');

    return <ResellersClient resellers={resellers ?? []} />;
}
