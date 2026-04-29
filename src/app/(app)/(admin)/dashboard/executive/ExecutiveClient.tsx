'use client';

import React, { useMemo, useState } from 'react';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { parseLocalDate, todayLocalString, startOfMonthLocalString } from '@/lib/utils/dates';

interface OrderItem {
    catalog_item: { id: string; name: string; sales_category: string } | null;
    quantity: number;
    type: string;
    subtotal_net: number;
}

interface Order {
    id: string;
    order_number: string;
    client_name: string;
    status: string;
    channel: 'INTERNO' | 'REVENDEDOR';
    seller_id: string | null;
    province_id: string;
    total_net: number;
    created_at: string;
    items: OrderItem[];
}

interface InventoryItem {
    id: string;
    name: string;
    current_stock: number;
    min_stock: number;
    type: string;
}

interface ExecutiveClientProps {
    orders: Order[];
    expenses: any[];
    income: any[];
    sellers: { id: string; name: string }[];
    provinces: { id: string; name: string }[];
    inventoryItems: InventoryItem[];
}

const ACTIVE_STATUSES = ['CONFIRMADO', 'POR_DESPACHAR', 'EN_VIAJE', 'EN_INSTALACION', 'ESPERANDO_INSTALACION'];

const PIPELINE_CONFIG = [
    { status: 'CONFIRMADO',           label: 'Confirmado',       color: '#6366f1' },
    { status: 'POR_DESPACHAR',        label: 'Por despachar',    color: '#f97316' },
    { status: 'EN_VIAJE',             label: 'En viaje',         color: '#f59e0b' },
    { status: 'EN_INSTALACION',       label: 'En instalación',   color: '#8b5cf6' },
    { status: 'ESPERANDO_INSTALACION',label: 'Esp. instalación', color: '#a78bfa' },
];

const INVENTORY_TYPE_LABELS: Record<string, string> = {
    MATERIA_PRIMA: 'Mat. Prima',
    INSUMO: 'Insumo',
    PRODUCTO_FINAL: 'Prod. Final',
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function DatePresets({ onSelect }: { onSelect: (r: { from: string; to: string }) => void }) {
    const today = new Date();
    const todayStr = formatDate(today);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    const yearStart = `${today.getFullYear()}-01-01`;

    const presets = [
        { label: 'Hoy', from: todayStr, to: todayStr },
        { label: 'Esta semana', from: formatDate(weekStart), to: todayStr },
        { label: 'Este mes', from: monthStart, to: todayStr },
        { label: 'Este año', from: yearStart, to: todayStr },
    ];

    return (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
            {presets.map(p => (
                <button
                    key={p.label}
                    onClick={() => onSelect({ from: p.from, to: p.to })}
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-700 transition-all"
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}

export default function ExecutiveClient({
    orders, sellers, provinces, inventoryItems
}: ExecutiveClientProps) {
    const [dateRange, setDateRange] = useState({
        from: startOfMonthLocalString(),
        to: todayLocalString()
    });
    const [filterSeller, setFilterSeller] = useState('');
    const [filterProvince, setFilterProvince] = useState('');
    const [filterChannel, setFilterChannel] = useState('');

    const applyBaseFilters = (o: Order) => {
        if (filterSeller && o.seller_id !== filterSeller) return false;
        if (filterProvince && o.province_id !== filterProvince) return false;
        if (filterChannel && o.channel !== filterChannel) return false;
        return true;
    };

    const filteredOrders = useMemo(() => {
        const dFrom = parseLocalDate(dateRange.from);
        const dTo = parseLocalDate(dateRange.to);
        dTo.setHours(23, 59, 59);
        return orders.filter(o => {
            const d = new Date(o.created_at);
            return d >= dFrom && d <= dTo && applyBaseFilters(o);
        });
    }, [orders, dateRange, filterSeller, filterProvince, filterChannel]);

    const prevPeriodOrders = useMemo(() => {
        const dFrom = parseLocalDate(dateRange.from);
        const dTo = parseLocalDate(dateRange.to);
        dTo.setHours(23, 59, 59);
        const duration = dTo.getTime() - dFrom.getTime();
        const prevTo = new Date(dFrom.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - duration);
        return orders.filter(o => {
            const d = new Date(o.created_at);
            return d >= prevFrom && d <= prevTo && applyBaseFilters(o);
        });
    }, [orders, dateRange, filterSeller, filterProvince, filterChannel]);

    const countCascos = (list: Order[]) =>
        list.reduce((s, o) =>
            s + o.items.filter(i => i.catalog_item?.sales_category === 'CASCO').reduce((x, i) => x + i.quantity, 0), 0);

    const kpis = useMemo(() => {
        const facturacion = filteredOrders.reduce((s, o) => s + Number(o.total_net), 0);
        const prevFacturacion = prevPeriodOrders.reduce((s, o) => s + Number(o.total_net), 0);
        const cascos = countCascos(filteredOrders);
        const prevCascos = countCascos(prevPeriodOrders);
        const backlog = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
        const stockAlerts = inventoryItems.filter(i => Number(i.current_stock) < Number(i.min_stock)).length;
        const facturacionTrend = prevFacturacion > 0 ? Math.round(((facturacion - prevFacturacion) / prevFacturacion) * 100) : null;
        const cascosTrend = prevCascos > 0 ? Math.round(((cascos - prevCascos) / prevCascos) * 100) : null;
        return { facturacion, cascos, backlog, stockAlerts, facturacionTrend, cascosTrend };
    }, [filteredOrders, prevPeriodOrders, orders, inventoryItems]);

    const monthlyChart = useMemo(() => {
        const today = new Date();
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
            return {
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
                INTERNO: 0,
                REVENDEDOR: 0,
            };
        });
        orders.filter(applyBaseFilters).forEach(o => {
            const key = o.created_at.substring(0, 7);
            const m = months.find(x => x.key === key);
            if (!m) return;
            if (o.channel === 'INTERNO') m.INTERNO += Number(o.total_net);
            else m.REVENDEDOR += Number(o.total_net);
        });
        return months;
    }, [orders, filterSeller, filterProvince, filterChannel]);

    const pipelineData = useMemo(() =>
        PIPELINE_CONFIG.map(cfg => ({
            status: cfg.label,
            cantidad: orders.filter(o => o.status === cfg.status).length,
            color: cfg.color,
        })),
        [orders]
    );

    const stockAlertList = useMemo(() =>
        inventoryItems
            .filter(i => Number(i.current_stock) < Number(i.min_stock))
            .map(i => ({ ...i, deficit: Number(i.min_stock) - Number(i.current_stock) }))
            .sort((a, b) => b.deficit - a.deficit)
            .slice(0, 10),
        [inventoryItems]
    );

    return (
        <div className="pb-10">
            <PageHeader title="Resumen Ejecutivo" subtitle="Foto general del negocio" />

            <DatePresets onSelect={setDateRange} />

            <DashboardFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                filters={[
                    {
                        label: 'Canal', value: filterChannel, onChange: setFilterChannel,
                        options: [{ value: 'INTERNO', label: 'Interno' }, { value: 'REVENDEDOR', label: 'Revendedor' }]
                    },
                    {
                        label: 'Vendedor', value: filterSeller, onChange: setFilterSeller,
                        options: sellers.map(s => ({ value: s.id, label: s.name }))
                    },
                    {
                        label: 'Provincia', value: filterProvince, onChange: setFilterProvince,
                        options: provinces.map(p => ({ value: p.id, label: p.name }))
                    },
                ]}
            />

            <KPIContainer>
                <KPICard
                    title="Facturación del período"
                    value={formatCurrency(kpis.facturacion)}
                    color="primary"
                    trend={kpis.facturacionTrend !== null ? { value: Math.abs(kpis.facturacionTrend), isPositive: kpis.facturacionTrend >= 0, label: 'vs período anterior' } : undefined}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <KPICard
                    title="Cascos vendidos"
                    value={kpis.cascos}
                    color="success"
                    trend={kpis.cascosTrend !== null ? { value: Math.abs(kpis.cascosTrend), isPositive: kpis.cascosTrend >= 0, label: 'vs período anterior' } : undefined}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                />
                <KPICard
                    title="Pedidos activos"
                    value={kpis.backlog}
                    description="Sin completar ni finalizar"
                    color="warning"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                <KPICard
                    title="Alertas de stock"
                    value={kpis.stockAlerts}
                    description="Ítems bajo el mínimo"
                    color={kpis.stockAlerts > 0 ? 'danger' : 'success'}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                />
            </KPIContainer>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Facturación mensual</h3>
                    <p className="text-xs text-gray-400 font-medium mb-5">Últimos 12 meses por canal</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyChart} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(v: any) => formatCurrency(Number(v))}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                                <Bar dataKey="INTERNO" name="Interno" stackId="a" fill="#6366f1" />
                                <Bar dataKey="REVENDEDOR" name="Revendedor" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Pipeline operativo</h3>
                    <p className="text-xs text-gray-400 font-medium mb-5">Pedidos por estado actual</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineData} layout="vertical" barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide allowDecimals={false} />
                                <YAxis dataKey="status" type="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={115} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                                    {pipelineData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {stockAlertList.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-danger-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
                        <h3 className="text-sm font-bold text-gray-900">Alertas de stock</h3>
                        <span className="ml-auto text-[10px] font-black text-danger-600 bg-danger-50 px-2.5 py-1 rounded-full">
                            {stockAlertList.length} ítems bajo mínimo
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['Ítem', 'Stock actual', 'Mínimo', 'Déficit', 'Tipo'].map((h, i) => (
                                        <th key={h} className={`py-2 pb-3 font-black text-gray-400 uppercase tracking-wider text-[10px] ${i === 0 ? 'text-left' : i < 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stockAlertList.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-2.5 font-bold text-gray-900">{item.name}</td>
                                        <td className="py-2.5 text-right font-bold text-danger-600">{Number(item.current_stock).toFixed(1)}</td>
                                        <td className="py-2.5 text-right font-medium text-gray-500">{Number(item.min_stock).toFixed(1)}</td>
                                        <td className="py-2.5 text-right font-black text-danger-700">{item.deficit.toFixed(1)}</td>
                                        <td className="py-2.5 pl-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                {INVENTORY_TYPE_LABELS[item.type] || item.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
