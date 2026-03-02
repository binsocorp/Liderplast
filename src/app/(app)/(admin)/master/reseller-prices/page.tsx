import { createClient } from '@/lib/supabase/server';
import { ResellerPricesClient } from './ResellerPricesClient';

export default async function ResellerPricesPage() {
    const supabase = await createClient();

    // 1. Fetch Lists, Items, and existing Reseller Prices
    const [lists, items, prices] = await Promise.all([
        supabase.from('reseller_price_lists').select('id, name').eq('is_active', true).order('name'),
        supabase.from('catalog_items').select('id, name, type').eq('is_active', true).order('name'),
        supabase.from('reseller_prices').select('*')
    ]);

    // 2. Fetch Córdoba baseline prices for the auto-fill tool
    const { data: cordoba } = await supabase
        .from('provinces')
        .select('id')
        .eq('name', 'Córdoba')
        .single() as any;

    let cordobaPrices: any[] = [];
    if (cordoba) {
        const { data } = await supabase
            .from('prices')
            .select('catalog_item_id, unit_price_net')
            .eq('province_id', cordoba.id) as any;
        cordobaPrices = data ?? [];
    }

    return (
        <ResellerPricesClient
            lists={lists.data ?? []}
            items={items.data ?? []}
            initialPrices={prices.data ?? []}
            cordobaPrices={cordobaPrices}
        />
    );
}
