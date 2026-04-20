import { createClient } from '@/lib/supabase/server';
import { CatalogClient } from './CatalogClient';

export default async function CatalogPage({
    searchParams,
}: {
    searchParams: { new?: string };
}) {
    const supabase = await createClient();
    const { data: catalogItems } = await supabase.from('catalog_items').select('*').order('name');

    return <CatalogClient catalogItems={catalogItems ?? []} autoOpen={searchParams.new === '1'} />;
}
