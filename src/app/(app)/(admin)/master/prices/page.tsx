import { createClient } from '@/lib/supabase/server';
import { PricesClient } from './PricesClient';

export default async function PricesPage() {
    const supabase = await createClient();

    const [{ data: prices }, { data: provinces }, { data: catalogItems }] = await Promise.all([
        supabase.from('prices').select('*, province:provinces(name), catalog_item:catalog_items(name)').order('created_at', { ascending: false }),
        supabase.from('provinces').select('id, name').order('name'),
        supabase.from('catalog_items').select('id, name').order('name'),
    ]);

    return <PricesClient prices={prices ?? []} provinces={provinces ?? []} catalogItems={catalogItems ?? []} />;
}
