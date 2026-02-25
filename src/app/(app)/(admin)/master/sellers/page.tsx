import { createClient } from '@/lib/supabase/server';
import { SellersClient } from './SellersClient';

export default async function SellersPage() {
    const supabase = await createClient();
    const { data: sellers } = await supabase.from('sellers').select('*').order('name');

    return <SellersClient sellers={sellers ?? []} />;
}
