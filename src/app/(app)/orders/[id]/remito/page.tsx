import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RemitoClient } from './RemitoClient';

export const dynamic = 'force-dynamic';

export default async function RemitoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch the order
    const { data: order } = await (supabase
        .from('orders') as any)
        .select(`
            *,
            province:provinces(name),
            seller:sellers(name),
            items:order_items(
                id, 
                description, 
                quantity, 
                unit_price_net,
                catalog_item:catalog_items(name)
            )
        `)
        .eq('id', id)
        .single();

    if (!order) notFound();

    return (
        <RemitoClient
            order={order}
        />
    );
}
