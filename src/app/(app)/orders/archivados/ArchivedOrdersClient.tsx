'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Archive, ExternalLink, ArchiveRestore } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import Link from 'next/link';
import { unarchiveOrder } from '../actions';

interface ArchivedOrder {
    id: string;
    order_number: string;
    created_at: string;
    updated_at: string;
    client_name: string;
    city: string;
    total_net: number;
    paid_amount: number;
    seller?: { name: string } | null;
    province?: { name: string } | null;
    order_items?: any[];
}

interface ArchivedOrdersClientProps {
    orders: ArchivedOrder[];
}

export function ArchivedOrdersClient({ orders }: ArchivedOrdersClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const filtered = useMemo(() => {
        if (!searchQuery) return orders;
        const q = searchQuery.toLowerCase();
        return orders.filter(o =>
            `${o.order_number} ${o.client_name} ${o.city}`.toLowerCase().includes(q)
        );
    }, [orders, searchQuery]);

    useEffect(() => { setPage(1); }, [filtered]);

    const paged = useMemo(() =>
        filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Archive className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Pedidos Finalizados</h1>
                        <p className="text-sm text-gray-400 font-medium">{orders.length} pedidos finalizados</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por Nº, cliente, localidad..."
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"># Orden</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Finalizado</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vendedor</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Provincia</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paged.length > 0 ? (
                                paged.map((order) => (
                                    <tr key={order.id} className="bg-gray-50/30 hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-500">
                                                #{order.order_number?.split('-')[1] || order.order_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500 font-medium">
                                                {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(order.created_at))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-400 font-medium">
                                                {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(order.updated_at))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-700 font-medium truncate max-w-[140px] block">
                                                {order.client_name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 font-bold uppercase">
                                                {order.seller?.name || <span className="text-gray-300">S/A</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500 font-medium">
                                                {order.province?.name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-black text-gray-600">
                                                ${Number(order.total_net).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge status="ARCHIVADO" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('¿Restaurar este pedido? Volverá al estado Completado.')) return;
                                                        const res = await unarchiveOrder(order.id);
                                                        if (res.error) alert('Error: ' + res.error);
                                                        else router.refresh();
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                                                    title="Restaurar pedido"
                                                >
                                                    <ArchiveRestore className="w-3.5 h-3.5" />
                                                    Restaurar
                                                </button>
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary-600 transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Ver
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <Archive className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                        <p className="text-gray-400 italic text-sm">No hay pedidos finalizados</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </div>
        </div>
    );
}
