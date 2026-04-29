import { createClient } from '@/lib/supabase/server';
import { ArchivedOrdersClient } from './ArchivedOrdersClient';

export default async function ArchivedOrdersPage() {
    const supabase = await createClient();

    const { data: ordersData, error } = await (supabase
        .from('orders') as any)
        .select('*, order_items(*, catalog_item:catalog_items(name))')
        .eq('status', 'ARCHIVADO')
        .order('updated_at', { ascending: false });

    if (error || !ordersData) {
        return <div className="p-4">Error cargando pedidos finalizados</div>;
    }

    const sellerIds = [...new Set(ordersData.map((o: any) => o.seller_id).filter(Boolean))];
    const provinceIds = [...new Set(ordersData.map((o: any) => o.province_id).filter(Boolean))];

    const [{ data: sellers }, { data: provinces }] = await Promise.all([
        supabase.from('sellers').select('id, name').in('id', sellerIds as string[]),
        supabase.from('provinces').select('id, name').in('id', provinceIds as string[]),
    ]);

    const enriched = ordersData.map((order: any) => ({
        ...order,
        seller: sellers?.find((s: any) => s.id === order.seller_id) || null,
        province: provinces?.find((p: any) => p.id === order.province_id) || null,
    }));

    return (
        <div className="p-1">
            <ArchivedOrdersClient orders={enriched} />
        </div>
    );
}
