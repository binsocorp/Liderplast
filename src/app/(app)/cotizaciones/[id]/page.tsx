import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CotizacionDetailClient } from './CotizacionDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CotizacionDetailPage({ params }: Props) {
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

    // Si fue aceptada, traer el número del pedido generado
    let convertedOrderNumber: string | null = null;
    if ((quotation as any).converted_order_id) {
        const { data: order } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', (quotation as any).converted_order_id)
            .single();
        convertedOrderNumber = (order as any)?.order_number ?? null;
    }

    return (
        <CotizacionDetailClient
            quotation={quotation as any}
            convertedOrderNumber={convertedOrderNumber}
        />
    );
}
