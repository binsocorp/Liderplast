import { createClient } from '@/lib/supabase/server';
import { ResellerPriceListsClient } from './ResellerPriceListsClient';

export default async function ResellerPriceListsPage() {
    const supabase = await createClient();
    const { data: lists } = await supabase.from('reseller_price_lists').select('*').order('name');

    return <ResellerPriceListsClient lists={lists ?? []} />;
}
