import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CotizacionPDFClient } from './CotizacionPDFClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CotizacionPDFPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: quotation } = await (supabase
        .from('quotations') as any)
        .select(`
            *,
            province:provinces(id, name),
            seller:sellers(id, name),
            reseller:resellers(id, name),
            items:quotation_items(*)
        `)
        .eq('id', id)
        .single();

    if (!quotation) notFound();

    return <CotizacionPDFClient quotation={quotation} />;
}
