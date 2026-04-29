'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, Trash2, Plus, Search, Filter, Users, Store, AlertCircle, LayoutList, LayoutGrid, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrderDrawer } from './OrderDrawer';
import { OrderStats } from './OrderStats';
import { deleteOrder, archiveOrder, completeInstallation } from './actions';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';

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
    trip_id?: string | null;
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

type ActionModal =
    | { type: 'assign-trip'; order: OrderRow }
    | { type: 'archive-debt'; order: OrderRow };

const ACTION_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    CONFIRMADO:    { label: 'Gestionar envío',       bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100' },
    POR_DESPACHAR: { label: 'Iniciar envío',          bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    EN_VIAJE:      { label: 'Finalizar envío',        bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100' },
    EN_INSTALACION:{ label: 'Instalación finalizada', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    COMPLETADO:    { label: 'Finalizar',               bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100' },
};

const fmt = (n: number) => `$${Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export function OrdersClient({ orders, lookups }: OrdersClientProps) {
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const [actionModal, setActionModal] = useState<ActionModal | null>(null);

    const [filterProvince, setFilterProvince] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeller, setFilterSeller] = useState('');
    const [filterChannel, setFilterChannel] = useState<'ALL' | 'INTERNO' | 'REVENDEDOR'>('ALL');
    const [onlyWithDebt, setOnlyWithDebt] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    async function handleAction(order: OrderRow, e: React.MouseEvent) {
        e.stopPropagation();
        const balance = Number(order.total_net) - Number(order.paid_amount || 0);

        switch (order.status) {
            case 'CONFIRMADO':
                setActionModal({ type: 'assign-trip', order });
                break;
            case 'POR_DESPACHAR':
                if (order.trip?.id) router.push(`/fletes/${order.trip.id}`);
                break;
            case 'EN_VIAJE':
                if (order.trip?.id) router.push(`/fletes/${order.trip.id}`);
                break;
            case 'EN_INSTALACION':
                await completeInstallation(order.id);
                router.refresh();
                break;
            case 'COMPLETADO':
                if (balance <= 0) {
                    await archiveOrder(order.id);
                    router.refresh();
                } else {
                    setActionModal({ type: 'archive-debt', order });
                }
                break;
        }
    }

    const getCascoInfo = (items: any[] = []) => {
        const cascoItem = items.find(i =>
            i.catalog_item?.sales_category === 'CASCO' ||
            i.description?.toLowerCase().includes('casco')
        );
        if (!cascoItem) return { model: '—', color: null };
        let model = cascoItem.catalog_item?.name || cascoItem.description || '—';
        if (model.toLowerCase().includes('casco')) {
            const parts = model.split(' ');
            const pCode = parts.find((p: string) => p.startsWith('P-'));
            if (pCode) model = pCode;
        }
        let color = null;
        const colorMatch = (cascoItem.description || '').match(/\(Color:\s*([^)]+)\)/i);
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

    useEffect(() => { setPage(1); }, [filteredOrders]);

    const pagedOrders = useMemo(() =>
        filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page, pageSize]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Gestión de Pedidos</h1>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vista lista"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vista Kanban"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <Link href="/orders/new">
                        <Button className="rounded-2xl px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Añadir Pedido
                        </Button>
                    </Link>
                </div>
            </div>

            <OrderStats orders={orders as any} />

            {/* Canal Filter */}
            <div className="flex bg-gray-100/50 p-1.5 rounded-3xl w-fit border border-gray-200 shadow-inner">
                {(['ALL', 'INTERNO', 'REVENDEDOR'] as const).map((ch) => (
                    <button
                        key={ch}
                        onClick={() => setFilterChannel(ch)}
                        className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterChannel === ch
                            ? 'bg-white text-primary-700 shadow-lg shadow-gray-200/50'
                            : 'text-gray-400 hover:text-gray-600 scale-95 hover:scale-100'}`}
                    >
                        {ch === 'ALL' && <Filter className="w-4 h-4" />}
                        {ch === 'INTERNO' && <Users className="w-4 h-4" />}
                        {ch === 'REVENDEDOR' && <Store className="w-4 h-4" />}
                        {ch === 'ALL' ? 'Ambos' : ch === 'INTERNO' ? 'Cliente Final' : 'Revendedor'}
                    </button>
                ))}
                <div className="w-px h-6 bg-gray-200 mx-2 self-center" />
                <button
                    onClick={() => setOnlyWithDebt(!onlyWithDebt)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${onlyWithDebt
                        ? 'bg-red-50 text-red-600 shadow-lg shadow-red-200/50 scale-100 border border-red-100'
                        : 'text-gray-400 hover:text-gray-600 scale-95 hover:scale-100'}`}
                >
                    <AlertCircle className="w-4 h-4" />
                    Solo con Deuda
                </button>
            </div>

            {/* Search */}
            <div className="relative group">
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

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"># Orden</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Vendedor</span>
                                            <select value={filterSeller} onChange={(e) => setFilterSeller(e.target.value)} className="bg-transparent border-0 p-0 text-[10px] focus:ring-0 cursor-pointer font-black text-primary-600 uppercase tracking-tight">
                                                <option value="">Todos los Vend.</option>
                                                {[...new Set(orders.map(o => o.seller?.name).filter(Boolean))].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Casco</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Provincia</span>
                                            <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} className="bg-transparent border-0 p-0 text-[10px] focus:ring-0 cursor-pointer font-black text-primary-600 uppercase tracking-tight">
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
                                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-0 p-0 text-[10px] focus:ring-0 cursor-pointer font-black text-primary-600 uppercase tracking-tight">
                                                <option value="">Todos los Est.</option>
                                                <option value="CONFIRMADO">Confirmado</option>
                                                <option value="POR_DESPACHAR">Por despachar</option>
                                                <option value="EN_VIAJE">En Viaje</option>
                                                <option value="EN_INSTALACION">Instalación en proceso</option>
                                                <option value="COMPLETADO">Completado</option>
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.length > 0 ? (
                                    pagedOrders.map((order) => {
                                        const { model, color } = getCascoInfo(order.order_items);
                                        const balance = Number(order.total_net) - Number(order.paid_amount || 0);
                                        const isPaid = balance <= 0;
                                        const actionCfg = ACTION_CONFIG[order.status];

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
                                                    <span className="text-sm text-gray-900 font-medium truncate max-w-[140px] block">
                                                        {order.client_name || <span className="text-gray-300">—</span>}
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
                                                    <span className="text-sm text-gray-600 font-medium">{order.province?.name || '—'}</span>
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
                                                    <Badge status={order.status || 'CONFIRMADO'} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {actionCfg && (
                                                            <button
                                                                onClick={(e) => handleAction(order, e)}
                                                                className={`text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${actionCfg.bg} ${actionCfg.text} ${actionCfg.border}`}
                                                            >
                                                                {actionCfg.label}
                                                            </button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            icon={<Printer className="w-4 h-4" />}
                                                            className="bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold"
                                                            onClick={(e) => { e.stopPropagation(); window.location.href = `/api/orders/${order.id}/pdf`; }}
                                                            title="Descargar Remito PDF"
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
                                        <td colSpan={12} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                            No se encontraron pedidos
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        total={filteredOrders.length}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <KanbanBoard
                    orders={filteredOrders}
                    getCascoInfo={getCascoInfo}
                    onSelectOrder={(order) => setSelectedOrder(order as any)}
                    onDeleteOrder={async (id) => {
                        if (confirm('¿Desea eliminar este pedido de forma permanente?')) {
                            const res = await deleteOrder(id);
                            if (res.error) alert('Error: ' + res.error);
                        }
                    }}
                    onAction={handleAction}
                />
            )}

            {/* Sidebar Drawer */}
            <OrderDrawer
                order={selectedOrder as any}
                onClose={() => setSelectedOrder(null)}
                lookups={lookups as any}
            />

            {/* Modal: Asignar flete */}
            {actionModal?.type === 'assign-trip' && (
                <ModalOverlay onClose={() => setActionModal(null)}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        </div>
                        <button onClick={() => setActionModal(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <h3 className="text-base font-black text-gray-900 mb-1">Gestionar envío</h3>
                    <p className="text-sm text-gray-500 mb-5">
                        El pedido <span className="font-bold text-gray-700">#{actionModal.order.order_number?.split('-')[1]}</span> debe ser asignado a un flete antes de poder iniciar el envío.
                    </p>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setActionModal(null)}
                            className="text-sm text-gray-400 hover:text-gray-600 font-bold transition-colors"
                        >
                            Cerrar
                        </button>
                        <Link
                            href="/fletes"
                            onClick={() => setActionModal(null)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                        >
                            Gestionar flete →
                        </Link>
                    </div>
                </ModalOverlay>
            )}

            {/* Modal: Finalizar con deuda */}
            {actionModal?.type === 'archive-debt' && (
                <ModalOverlay onClose={() => setActionModal(null)}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <button onClick={() => setActionModal(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <h3 className="text-base font-black text-gray-900 mb-1">Saldo pendiente</h3>
                    <p className="text-sm text-gray-500 mb-1">
                        El pedido <span className="font-bold text-gray-700">#{actionModal.order.order_number?.split('-')[1]}</span> tiene un saldo pendiente de:
                    </p>
                    <p className="text-2xl font-black text-red-600 mb-5">
                        {fmt(Number(actionModal.order.total_net) - Number(actionModal.order.paid_amount || 0))}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setActionModal(null)}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={async () => {
                                await archiveOrder(actionModal.order.id);
                                setActionModal(null);
                                router.refresh();
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-black hover:bg-black transition-colors"
                        >
                            Finalizar de todas formas
                        </button>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
                {children}
            </div>
        </>
    );
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
    { status: 'CONFIRMADO',     label: 'Confirmado',           color: 'border-blue-400',   headerBg: 'bg-blue-50',   headerText: 'text-blue-700',   dot: 'bg-blue-400' },
    { status: 'POR_DESPACHAR',  label: 'Por despachar',        color: 'border-orange-400', headerBg: 'bg-orange-50', headerText: 'text-orange-700', dot: 'bg-orange-400' },
    { status: 'EN_VIAJE',       label: 'En Viaje',             color: 'border-amber-400',  headerBg: 'bg-amber-50',  headerText: 'text-amber-700',  dot: 'bg-amber-400' },
    { status: 'EN_INSTALACION', label: 'Instalación en proceso',color: 'border-purple-400', headerBg: 'bg-purple-50', headerText: 'text-purple-700', dot: 'bg-purple-400' },
    { status: 'COMPLETADO',     label: 'Completado',           color: 'border-green-400',  headerBg: 'bg-green-50',  headerText: 'text-green-700',  dot: 'bg-green-400' },
];

interface KanbanBoardProps {
    orders: OrderRow[];
    getCascoInfo: (items: any[]) => { model: string; color: string | null };
    onSelectOrder: (order: OrderRow) => void;
    onDeleteOrder: (id: string) => void;
    onAction: (order: OrderRow, e: React.MouseEvent) => void;
}

function KanbanBoard({ orders, getCascoInfo, onSelectOrder, onDeleteOrder, onAction }: KanbanBoardProps) {
    const byStatus = (status: string) => orders.filter(o => (o.status || 'CONFIRMADO') === status);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map((col) => {
                const colOrders = byStatus(col.status);
                return (
                    <div key={col.status} className={`flex flex-col rounded-2xl border-t-4 ${col.color} bg-gray-50 border border-gray-100 overflow-hidden`}>
                        {/* Column header */}
                        <div className={`flex items-center gap-2 px-4 py-3 ${col.headerBg}`}>
                            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                            <span className={`text-xs font-black uppercase tracking-wider ${col.headerText}`}>{col.label}</span>
                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${col.headerText}`}>
                                {colOrders.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-col gap-2 p-3 flex-1 min-h-[200px]">
                            {colOrders.length === 0 && (
                                <p className="text-center text-gray-300 text-xs italic mt-6">Sin pedidos</p>
                            )}
                            {colOrders.map((order) => {
                                const { model, color } = getCascoInfo(order.order_items);
                                const balance = Number(order.total_net) - Number(order.paid_amount || 0);
                                const isPaid = balance <= 0;
                                const actionCfg = ACTION_CONFIG[order.status];

                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => onSelectOrder(order)}
                                        className="bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group"
                                    >
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-primary-600 group-hover:text-primary-700">
                                                #{order.order_number?.split('-')[1] || order.order_number}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(order.created_at))}
                                            </span>
                                        </div>

                                        {/* Client */}
                                        <p className="text-sm font-bold text-gray-900 truncate mb-1">{order.client_name || '—'}</p>

                                        {/* Casco */}
                                        <p className="text-xs text-gray-500 font-medium truncate mb-2">
                                            {model}{color ? ` · ${color}` : ''}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <div className="leading-tight">
                                                <p className="text-[10px] text-gray-400 font-medium">Total</p>
                                                <p className="text-xs font-black text-gray-800">
                                                    ${Number(order.total_net).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="leading-tight text-right">
                                                <p className="text-[10px] text-gray-400 font-medium">Saldo</p>
                                                <p className={`text-xs font-black ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${balance.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.location.href = `/api/orders/${order.id}/pdf`; }}
                                                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                                                    title="Descargar PDF"
                                                >
                                                    <Printer className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                                                    className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Trip / Seller chips */}
                                        {(order._trip_code || order.seller?.name) && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {order._trip_code && (
                                                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                                                        {order._trip_code}
                                                    </span>
                                                )}
                                                {order.seller?.name && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full uppercase">
                                                        {order.seller.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Action button */}
                                        {actionCfg && (
                                            <button
                                                onClick={(e) => onAction(order, e)}
                                                className={`mt-2 w-full text-[10px] font-black uppercase tracking-wider py-1.5 rounded-lg border transition-colors ${actionCfg.bg} ${actionCfg.text} ${actionCfg.border}`}
                                            >
                                                {actionCfg.label}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
