'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrderDrawer } from './OrderDrawer';
import { OrderStats } from './OrderStats';
import Link from 'next/link';

interface OrderRow extends any {
    id: string;
    order_number: string;
    created_at: string;
    client_name: string;
    city: string;
    total_net: number;
    payment_status: string;
    seller?: { name: string } | null;
    province?: { name: string } | null;
    trip?: { id: string; trip_code: string; driver?: { name: string } } | null;
    installer?: { name: string } | null;
    order_items?: any[];
    _driver_name?: string;
    _trip_code?: string;
}

interface OrdersClientProps {
    orders: OrderRow[];
    lookups: {
        sellers: any[];
        provinces: any[];
        installers: any[];
        trips: any[];
    };
}

export function OrdersClient({ orders, lookups }: OrdersClientProps) {
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtros por columna
    const [filterProvince, setFilterProvince] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeller, setFilterSeller] = useState('');

    const getCascoInfo = (items: any[] = []) => {
        const cascoitem = items.find(i =>
            i.catalog_item?.name?.startsWith('P-') ||
            i.description?.toLowerCase().includes('casco')
        );

        if (!cascoitem) return { model: '—', color: null };

        let model = cascoitem.catalog_item?.name || cascoitem.description || '—';
        if (model.toLowerCase().includes('casco')) {
            const parts = model.split(' ');
            const pCode = parts.find((p: string) => p.startsWith('P-'));
            if (pCode) model = pCode;
        }

        let color = null;
        const desc = cascoitem.description || '';
        const colorMatch = desc.match(/\(Color:\s*([^)]+)\)/i);
        if (colorMatch) color = colorMatch[1];

        return { model, color };
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = `${order.order_number} ${order.client_name} ${order.city} ${order.order_number?.split('-')[1] || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProvince = !filterProvince || order.province?.name === filterProvince;
            const matchesStatus = !filterStatus || order.payment_status === filterStatus;
            const matchesSeller = !filterSeller || order.seller?.name === filterSeller;

            return matchesSearch && matchesProvince && matchesStatus && matchesSeller;
        });
    }, [orders, searchQuery, filterProvince, filterStatus, filterSeller]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Gestión de Pedidos</h1>
                <Link href="/orders/new">
                    <Button className="rounded-2xl px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Añadir Pedido
                    </Button>
                </Link>
            </div>

            <OrderStats orders={orders} />

            {/* Toolbar: Search + Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por Nº, cliente, localidad..."
                        className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterProvince}
                        onChange={(e) => setFilterProvince(e.target.value)}
                        className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm transition-all"
                    >
                        <option value="">Todas las Provincias</option>
                        {[...new Set(orders.map(o => o.province?.name).filter(Boolean))].map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm transition-all"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDING">Pendiente</option>
                        <option value="CONFIRMADO">Confirmado</option>
                        <option value="EN_VIAJE">En Viaje</option>
                        <option value="ESPERANDO_INSTALACION">Esperando Inst.</option>
                        <option value="COMPLETADO">Completado</option>
                    </select>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                {[
                                    '# Orden', 'Fecha', 'Vendedor', 'Casco',
                                    'Cant.', 'Provincia', 'Total',
                                    'Flete', 'Instalador', 'Estado'
                                ].map((header) => (
                                    <th key={header} className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const { model, color } = getCascoInfo(order.order_items);
                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    #{order.order_number?.split('-')[1] || order.order_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                                                    {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(order.created_at))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700 font-bold uppercase truncate max-w-[120px] block">
                                                    {order.seller?.name || <span className="text-gray-300">S/A</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="leading-tight">
                                                    <p className="text-sm font-bold text-gray-900">{model}</p>
                                                    {color && <p className="text-[11px] text-gray-400">{color}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">
                                                    {order.order_items?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 font-medium">
                                                    {order.province?.name || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-black text-gray-900">
                                                    ${Number(order.total_net).toLocaleString('es-AR')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {order._trip_code ? (
                                                    <div className="leading-tight">
                                                        <p className="font-bold text-gray-900 text-[13px]">{order._trip_code}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{order._driver_name || 'Sin Chofer'}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-[11px] italic font-medium">No asignado</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700 font-bold whitespace-nowrap">
                                                    {order.installer?.name || <span className="text-gray-300">S/I</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={order.payment_status || 'PENDING'} />
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                        No se encontraron pedidos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sidebar Drawer */}
            <OrderDrawer
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                lookups={lookups}
            />
        </div>
    );
}
