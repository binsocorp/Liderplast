import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RemitoClient } from './RemitoClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await (supabase.from('orders') as any).select('order_number').eq('id', id).single();
    if (data?.order_number) {
        return { title: `Remito ${data.order_number}` };
    }
    return { title: 'Remito' };
}

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
