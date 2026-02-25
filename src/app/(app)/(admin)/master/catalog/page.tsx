import { createClient } from '@/lib/supabase/server';
import { CatalogClient } from './CatalogClient';

export default async function CatalogPage() {
    const supabase = await createClient();
    const { data: catalogItems } = await supabase.from('catalog_items').select('*').order('name');

    return <CatalogClient catalogItems={catalogItems ?? []} />;
}
