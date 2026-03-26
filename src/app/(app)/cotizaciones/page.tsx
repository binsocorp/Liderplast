import { createClient } from '@/lib/supabase/server';
import { CotizacionesClient } from './CotizacionesClient';

export default async function CotizacionesPage() {
    const supabase = await createClient();

    const [quotationsRes, sellersRes, provincesRes] = await Promise.all([
        (supabase.from('quotations') as any).select(`
            *,
            province:provinces(id, name),
            seller:sellers(id, name),
            reseller:resellers(id, name),
            converted_order:orders!converted_order_id(id, order_number)
        `).order('created_at', { ascending: false }),
        (supabase.from('sellers') as any).select('id, name').order('name'),
        (supabase.from('provinces') as any).select('id, name').order('name')
    ]);

    const quotations = quotationsRes.data ?? [];

    // Fetch creators manually because the FK points to auth.users, not profiles
    const creatorIds = Array.from(new Set(quotations.map((q: any) => q.created_by).filter(Boolean)));

    let profiles: any[] = [];
    if (creatorIds.length > 0) {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds);
        if (data) profiles = data;
    }

    const profilesMap = new Map(profiles.map(p => [p.id, p.full_name]));

    // Build unique list of emisors who have quotations, and attach creator to quotation
    const emisorMap = new Map<string, string>();
    for (const q of quotations) {
        const creatorId = q.created_by;
        if (creatorId) {
            const creatorName = profilesMap.get(creatorId);
            q.creator = { full_name: creatorName }; // attach for the UI
            if (!emisorMap.has(creatorId)) {
                emisorMap.set(creatorId, creatorName || 'Usuario eliminado');
            }
        }
    }

    const emisors = Array.from(emisorMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <CotizacionesClient
            quotations={quotations}
            sellers={sellersRes.data ?? []}
            provinces={provincesRes.data ?? []}
            emisors={emisors}
        />
    );
}
