import { createClient } from '@/lib/supabase/server';
import { NewOrderForm } from './NewOrderForm';

export default async function NewOrderPage() {
    const supabase = await createClient();

    const [
        { data: provinces },
        { data: clients },
        { data: sellers },
        { data: resellers },
        { data: catalogItems },
        { data: prices },
    ] = await Promise.all([
        supabase.from('provinces').select('id, name').eq('is_sellable', true).order('name'),
        supabase.from('clients').select('id, name, document, phone, address, city, province_id').eq('is_active', true).order('name'),
        supabase.from('sellers').select('id, name, type').eq('is_active', true).order('name'),
        supabase.from('resellers').select('id, name').eq('is_active', true).order('name'),
        supabase.from('catalog_items').select('id, name, type').eq('is_active', true).order('name'),
        supabase.from('prices').select('catalog_item_id, province_id, unit_price_net').eq('is_active', true),
    ]);

    return (
        <NewOrderForm
            provinces={provinces ?? []}
            clients={clients ?? []}
            sellers={sellers ?? []}
            resellers={resellers ?? []}
            catalogItems={catalogItems ?? []}
            prices={prices ?? []}
        />
    );
}
