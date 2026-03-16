'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, Trash2, Plus, Search, Filter, Warehouse, Users, Store, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrderDrawer } from './OrderDrawer';
import { OrderStats } from './OrderStats';
import { deleteOrder } from './actions';
import Link from 'next/link';

interface OrderRow {
    id: string;
    order_number: string;
    created_at: string;
    client_name: string;
    city: string;
    total_net: number;
    paid_amount: number;
    status: string;
    payment_status: string;
    seller?: { name: string } | null;
    province?: { name: string } | null;
    trip?: { id: string; trip_code: string; driver?: { name: string } } | null;
    installer?: { name: string } | null;
    order_items?: any[];
    channel?: string;
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
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtros por columna
    const [filterProvince, setFilterProvince] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    const [filterChannel, setFilterChannel] = useState<'ALL' | 'INTERNO' | 'REVENDEDOR'>('ALL');
    const [onlyWithDebt, setOnlyWithDebt] = useState(false);

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
            const matchesStatus = !filterStatus || order.status === filterStatus;
            const matchesSeller = !filterSeller || order.seller?.name === filterSeller;
            const matchesChannel = filterChannel === 'ALL' || order.channel === filterChannel;
            const matchesDebt = !onlyWithDebt || (Number(order.total_net) - Number(order.paid_amount || 0)) > 0;

            return matchesSearch && matchesProvince && matchesStatus && matchesSeller && matchesChannel && matchesDebt;
        });
    }, [orders, searchQuery, filterProvince, filterStatus, filterSeller, filterChannel, onlyWithDebt]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Gestión de Pedidos</h1>
                <Link href="/orders/new">
                    <Button className="rounded-2xl px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Añadir Pedido
                    </Button>
                </Link>
            </div>

            <OrderStats orders={orders as any} />

            {/* Canal Filter (Segmented Control) */}
            <div className="flex bg-gray-100/50 p-1.5 rounded-3xl w-fit border border-gray-200 shadow-inner">
                <button
                    onClick={() => setFilterChannel('ALL')}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterChannel === 'ALL'
                        ? 'bg-white text-primary-700 shadow-lg shadow-gray-200/50 scale-100'
                        : 'text-gray-400 hover:text-gray-600 scale-95 hover:scale-100'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    Ambos
                </button>
                <button
                    onClick={() => setFilterChannel('INTERNO')}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterChannel === 'INTERNO'
                        ? 'bg-white text-primary-700 shadow-lg shadow-gray-200/50 scale-100'
                        : 'text-gray-400 hover:text-gray-600 scale-95 hover:scale-100'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Cliente Final
                </button>
                <button
                    onClick={() => setFilterChannel('REVENDEDOR')}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterChannel === 'REVENDEDOR'
                        ? 'bg-white text-primary-700 shadow-lg shadow-gray-200/50 scale-100'
                        : 'text-gray-400 hover:text-gray-600 scale-95 hover:scale-100'
                        }`}
                >
                    <Store className="w-4 h-4" />
                    Revendedor
                </button>

                <div className="w-px h-6 bg-gray-200 mx-2 self-center" />

                <button
                    onClick={() => setOnlyWithDebt(!onlyWithDebt)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${onlyWithDebt
                        ? 'bg-red-50 text-red-600 shadow-lg shadow-red-200/50 scale-100 border border-red-100'
                        : 'text-gray-400 hover:text-gray-600 scale-95 hover:scale-100'
                        }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    Solo con Deuda
                </button>
            </div>

            {/* Toolbar: Search + Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
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

                <div className="flex gap-2">
                    {/* Filtros movidos a los headers de la tabla */}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"># Orden</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">
                                    <div className="flex flex-col gap-1">
                                        <span>Vendedor</span>
                                        <select
                                            value={filterSeller}
                                            onChange={(e) => setFilterSeller(e.target.value)}
                                            className="bg-transparent border-0 p-0 text-[10px] focus:ring-0 cursor-pointer font-black text-primary-600 uppercase tracking-tight"
                                        >
                                            <option value="">Todos los Vend.</option>
                                            {[...new Set(orders.map(o => o.seller?.name).filter(Boolean))].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Casco</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cant.</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">
                                    <div className="flex flex-col gap-1">
                                        <span>Provincia</span>
                                        <select
                                            value={filterProvince}
                                            onChange={(e) => setFilterProvince(e.target.value)}
                                            className="bg-transparent border-0 p-0 text-[10px] focus:ring-0 cursor-pointer font-black text-primary-600 uppercase tracking-tight"
                                        >
                                            <option value="">Todas las Prov.</option>
                                            {[...new Set(orders.map(o => o.province?.name).filter(Boolean))].map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Saldo</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Flete</th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inst.</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">
                                    <div className="flex flex-col gap-1">
                                        <span>Estado</span>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="bg-transparent border-0 p-0 text-[10px] focus:ring-0 cursor-pointer font-black text-primary-600 uppercase tracking-tight"
                                        >
                                            <option value="">Todos los Est.</option>
                                            <option value="CONFIRMADO">Confirmado</option>
                                            <option value="EN_VIAJE">En Viaje</option>
                                            <option value="ESPERANDO_INSTALACION">Esperando Inst.</option>
                                            <option value="COMPLETADO">Completado</option>
                                        </select>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const { model, color } = getCascoInfo(order.order_items);
                                    const balance = Number(order.total_net) - Number(order.paid_amount || 0);
                                    const isPaid = balance <= 0;

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`transition-colors cursor-pointer group ${isPaid ? 'bg-green-50/40 hover:bg-green-50/80' : 'bg-red-50/30 hover:bg-red-50/60'}`}
                                            onClick={() => setSelectedOrder(order as any)}
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
                                                    ${Number(order.total_net).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-black ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ${balance.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
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
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700 font-bold whitespace-nowrap">
                                                    {order.installer?.name || <span className="text-gray-300">S/I</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={order.status || 'PENDIENTE'} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        icon={<Printer className="w-4 h-4" />}
                                                        className="bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(`/orders/${order.id}/remito`, '_blank');
                                                        }}
                                                        title="Ver Remito"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        icon={<Trash2 className="w-4 h-4" />}
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (confirm('¿Desea eliminar este pedido de forma permanente?')) {
                                                                const res = await deleteOrder(order.id);
                                                                if (res.error) alert('Error: ' + res.error);
                                                            }
                                                        }}
                                                        title="Eliminar Pedido"
                                                    />
                                                </div>
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
                order={selectedOrder as any}
                onClose={() => setSelectedOrder(null)}
                lookups={lookups as any}
            />
        </div>
    );
}
