'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, ExternalLink, CheckCircle2, Wallet, DollarSign, Check, Trash2 } from 'lucide-react';
import type { QuotationWithRelations } from '@/lib/types/database';
import { isQuotationExpired } from '@/lib/types/database';
import { User } from 'lucide-react';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { acceptQuotation, deleteQuotation } from './actions';
import { useToast } from '@/components/ui/Toast';
import { Pagination } from '@/components/ui/Pagination';
import { BrandPickerModal } from '@/components/ui/BrandPickerModal';

type StatusFilter = 'TODAS' | 'ACTIVAS' | 'ACEPTADAS' | 'RECHAZADAS' | 'VENCIDAS';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR');
};

function getEffectiveStatus(q: QuotationWithRelations): 'ACTIVA' | 'VENCIDA' | 'ACEPTADA' | 'RECHAZADA' {
    if (q.status === 'ACEPTADA') return 'ACEPTADA';
    if (q.status === 'RECHAZADA') return 'RECHAZADA';
    if (isQuotationExpired(q)) return 'VENCIDA';
    return 'ACTIVA';
}

function StatusBadge({ quotation }: { quotation: QuotationWithRelations }) {
    const eff = getEffectiveStatus(quotation);
    const cfg: Record<string, { label: string; className: string }> = {
        ACTIVA: { label: 'Activa', className: 'bg-blue-100 text-blue-700 border-blue-200' },
        VENCIDA: { label: 'Vencida', className: 'bg-amber-100 text-amber-700 border-amber-200' },
        ACEPTADA: { label: 'Aceptada', className: 'bg-green-100 text-green-700 border-green-200' },
        RECHAZADA: { label: 'Rechazada', className: 'bg-red-100 text-red-700 border-red-200' },
    };
    const { label, className } = cfg[eff];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${className}`}>
            {label}
        </span>
    );
}

export function CotizacionesClient({
    quotations,
    sellers,
    provinces,
    emisors
}: {
    quotations: QuotationWithRelations[];
    sellers: { id: string; name: string }[];
    provinces: { id: string; name: string }[];
    emisors: { id: string; name: string }[];
}) {
    const { addToast } = useToast();
    const [, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [pickerUrl, setPickerUrl] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODAS');
    const [sellerId, setSellerId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [emisorId, setEmisorId] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const handleAccept = (id: string) => {
        setProcessingId(id);
        startTransition(async () => {
            const result = await acceptQuotation(id);
            setProcessingId(null);
            if ('error' in result) {
                addToast({ type: 'error', title: 'Error', message: result.error });
            } else {
                addToast({ type: 'success', title: 'Cotización aceptada', message: `Pedido ${result.data.orderNumber} creado`, action: { label: 'Ver pedido', href: `/orders/${result.data.orderId}` } });
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(null);
        setProcessingId(id);
        startTransition(async () => {
            const result = await deleteQuotation(id);
            setProcessingId(null);
            if ('error' in result) {
                addToast({ type: 'error', title: 'Error', message: result.error });
            } else {
                addToast({ type: 'success', title: 'Cotización eliminada' });
            }
        });
    };

    const tabs: { key: StatusFilter; label: string }[] = [
        { key: 'TODAS', label: 'Todas' },
        { key: 'ACTIVAS', label: 'Activas' },
        { key: 'ACEPTADAS', label: 'Aceptadas' },
        { key: 'RECHAZADAS', label: 'Rechazadas' },
        { key: 'VENCIDAS', label: 'Vencidas' },
    ];

    const baseFiltered = useMemo(() => {
        return quotations.filter(q => {
            if (sellerId && q.seller_id !== sellerId) return false;
            if (provinceId && q.province_id !== provinceId) return false;
            if (emisorId && q.created_by !== emisorId) return false;
            return true;
        });
    }, [quotations, sellerId, provinceId, emisorId]);

    const filtered = useMemo(() => {
        return baseFiltered.filter(q => {
            // Filtro de texto
            if (search) {
                const s = search.toLowerCase();
                const matches =
                    q.quotation_number?.toLowerCase().includes(s) ||
                    q.client_name?.toLowerCase().includes(s) ||
                    q.city?.toLowerCase().includes(s) ||
                    q.reseller?.name?.toLowerCase().includes(s);
                if (!matches) return false;
            }

            // Filtro de estado
            const eff = getEffectiveStatus(q);
            if (statusFilter === 'ACTIVAS' && eff !== 'ACTIVA') return false;
            if (statusFilter === 'ACEPTADAS' && eff !== 'ACEPTADA') return false;
            if (statusFilter === 'RECHAZADAS' && eff !== 'RECHAZADA') return false;
            if (statusFilter === 'VENCIDAS' && eff !== 'VENCIDA') return false;

            return true;
        });
    }, [baseFiltered, search, statusFilter]);

    useEffect(() => { setPage(1); }, [filtered]);

    const paged = useMemo(() =>
        filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]);

    // Contadores por estado y KPIs
    const counts = useMemo(() => {
        const c = { ACTIVAS: 0, ACEPTADAS: 0, RECHAZADAS: 0, VENCIDAS: 0 };
        baseFiltered.forEach(q => {
            const eff = getEffectiveStatus(q);
            if (eff === 'ACTIVA') c.ACTIVAS++;
            if (eff === 'ACEPTADA') c.ACEPTADAS++;
            if (eff === 'RECHAZADA') c.RECHAZADAS++;
            if (eff === 'VENCIDA') c.VENCIDAS++;
        });
        return c;
    }, [baseFiltered]);

    const kpis = useMemo(() => {
        let totalAmount = 0;
        let acceptedAmount = 0;
        let resolvedCount = 0;

        baseFiltered.forEach(q => {
            const eff = getEffectiveStatus(q);
            totalAmount += Number(q.total_net || 0);

            if (eff === 'ACEPTADA') {
                acceptedAmount += Number(q.total_net || 0);
            }
            if (eff !== 'ACTIVA') {
                resolvedCount++;
            }
        });

        const successRate = resolvedCount > 0 ? (counts.ACEPTADAS / resolvedCount) * 100 : 0;

        return {
            totalCount: baseFiltered.length,
            successRate,
            totalAmount,
            acceptedAmount
        };
    }, [baseFiltered, counts]);

    return (
        <div className="space-y-4">
            <BrandPickerModal baseUrl={pickerUrl} onClose={() => setPickerUrl(null)} />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cotizaciones</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{quotations.length} cotizaciones en total</p>
                </div>
                <Link
                    href="/cotizaciones/nueva"
                    className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Cotización
                </Link>
            </div>

            {/* Filtros de segmentación */}
            <DashboardFilters
                filters={[
                    {
                        label: 'Vendedor',
                        value: sellerId,
                        options: sellers.map(s => ({ value: s.id, label: s.name })),
                        onChange: setSellerId
                    },
                    {
                        label: 'Provincia',
                        value: provinceId,
                        options: provinces.map(p => ({ value: p.id, label: p.name })),
                        onChange: setProvinceId
                    },
                    {
                        label: 'Emisor',
                        value: emisorId,
                        options: emisors.map(e => ({ value: e.id, label: e.name })),
                        onChange: setEmisorId
                    }
                ]}
            />

            {/* KPIs */}
            <KPIContainer>
                <KPICard
                    title="Cotizaciones Realizadas"
                    value={kpis.totalCount}
                    color="info"
                    icon={<FileText className="w-5 h-5" />}
                />
                <KPICard
                    title="Tasa de Éxito"
                    value={`${kpis.successRate.toFixed(1)}%`}
                    color="success"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    description="Sobre cotiz. resueltas"
                />
            </KPIContainer>

            {/* Tabs de estado */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {tabs.map(tab => {
                    const count = tab.key === 'TODAS' ? baseFiltered.length : counts[tab.key as keyof typeof counts];
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className="ml-1.5 bg-gray-200 text-gray-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Búsqueda */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por número, cliente, ciudad..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="py-3 px-4 text-left">COT #</th>
                            <th className="py-3 px-4 text-left">Pedido</th>
                            <th className="py-3 px-4 text-left">Cliente</th>
                            <th className="py-3 px-4 text-left">Emisor</th>
                            <th className="py-3 px-4 text-left">Canal</th>
                            <th className="py-3 px-4 text-left">Válida hasta</th>
                            <th className="py-3 px-4 text-right">Subtot. Productos</th>
                            <th className="py-3 px-4 text-right">Subtot. Servicios</th>
                            <th className="py-3 px-4 text-right font-black">Total</th>
                            <th className="py-3 px-4 text-center">Estado</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="py-16 text-center text-gray-400 text-sm">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    No hay cotizaciones que coincidan con los filtros
                                </td>
                            </tr>
                        ) : (
                            paged.map(q => {
                                const subtotalServicios = q.freight_amount + q.installation_amount + q.travel_amount + q.other_amount + q.subtotal_services;
                                return (
                                    <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <Link href={`/cotizaciones/${q.id}`} className="font-black text-gray-900 hover:text-amber-600 transition-colors">
                                                {q.quotation_number}
                                            </Link>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(q.created_at).toLocaleDateString('es-AR')}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {q.status === 'ACEPTADA' ? (
                                                (q as any).converted_order ? (
                                                    <Link href={`/orders/${(q as any).converted_order.id}`} className="font-bold text-green-700 hover:text-green-900 underline underline-offset-2 transition-colors">
                                                        {(q as any).converted_order.order_number}
                                                    </Link>
                                                ) : (
                                                    <span className="text-red-500 font-bold text-xs" title="Inconsistencia: Aceptada pero sin pedido registrado">Sin pedido</span>
                                                )
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900">{q.client_name || '-'}</div>
                                            <div className="text-[11px] text-gray-400">{q.city}{q.province?.name ? `, ${q.province.name}` : ''}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-700">
                                                    {(q as any).creator?.full_name || 'Usuario eliminado'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {q.channel === 'REVENDEDOR' ? (
                                                <div>
                                                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">Revendedor</span>
                                                    {q.reseller && <div className="text-[11px] text-gray-400 mt-0.5">{q.reseller.name}</div>}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Cliente Final</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {q.expires_at ? (
                                                <span className={isQuotationExpired(q) ? 'text-amber-600 font-bold' : 'text-gray-700'}>
                                                    {formatDate(q.expires_at)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">Sin fecha</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-700">
                                            {formatCurrency(q.subtotal_products)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-700">
                                            {formatCurrency(subtotalServicios)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-black text-gray-900">
                                            {formatCurrency(q.total_net)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <StatusBadge quotation={q} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={`/cotizaciones/${q.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </Link>
                                                <button
                                                    onClick={() => setPickerUrl(`/api/cotizaciones/${q.id}/pdf`)}
                                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Descargar PDF"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                {q.status === 'ACEPTADA' && q.converted_order_id && (
                                                    <Link
                                                        href={`/orders/${q.converted_order_id}`}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Ver pedido generado"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {q.status === 'COTIZACION' && (
                                                    <button
                                                        onClick={() => handleAccept(q.id)}
                                                        disabled={processingId === q.id}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                                                        title="Aceptar cotización y crear pedido"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(q.status !== 'ACEPTADA' || !q.converted_order_id) && (
                                                    confirmDeleteId === q.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(q.id)}
                                                                disabled={processingId === q.id}
                                                                className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40"
                                                            >
                                                                Confirmar
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                className="px-2 py-1 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDeleteId(q.id)}
                                                            disabled={processingId === q.id}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                            title="Eliminar cotización"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
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
