import { createClient } from '@/lib/supabase/server';
import { CotizacionesClient } from './CotizacionesClient';

export default async function CotizacionesPage() {
    const supabase = await createClient();

    const [quotationsRes, sellersRes, provincesRes] = await Promise.all([
        (supabase.from('quotations') as any).select(`
            *,
            province:provinces(id, name),
            seller:sellers(id, name),
            reseller:resellers(id, name)
        `).order('created_at', { ascending: false }),
        (supabase.from('sellers') as any).select('id, name').order('name'),
        (supabase.from('provinces') as any).select('id, name').order('name')
    ]);

    return (
        <CotizacionesClient
            quotations={quotationsRes.data ?? []}
            sellers={sellersRes.data ?? []}
            provinces={provincesRes.data ?? []}
        />
    );
}
