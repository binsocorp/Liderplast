'use client';

import React, { useMemo, useState } from 'react';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    LineChart, Line, Legend
} from 'recharts';
import { parseLocalDate, todayLocalString, startOfMonthLocalString } from '@/lib/utils/dates';

interface OrderItem {
    catalog_item: { id: string; name: string; sales_category: string } | null;
    quantity: number;
    subtotal_net: number;
    type: string;
}

interface Order {
    id: string;
    order_number: string;
    client_name: string;
    status: string;
    channel: 'INTERNO' | 'REVENDEDOR';
    seller_id: string | null;
    reseller_id: string | null;
    province_id: string;
    total_net: number;
    created_at: string;
    items: OrderItem[];
    reseller: { id: string; name: string } | null;
}

interface SalesClientProps {
    orders: Order[];
    sellers: { id: string; name: string }[];
    resellers: { id: string; name: string; province_id: string | null }[];
    provinces: { id: string; name: string }[];
}

const CHANNEL_COLORS = { INTERNO: '#6366f1', REVENDEDOR: '#8b5cf6' };

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function DatePresets({ onSelect }: { onSelect: (r: { from: string; to: string }) => void }) {
    const today = new Date();
    const todayStr = formatDate(today);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
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
                <button key={p.label} onClick={() => onSelect({ from: p.from, to: p.to })}
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-700 transition-all">
                    {p.label}
                </button>
            ))}
        </div>
    );
}

export default function SalesClient({ orders, sellers, provinces }: SalesClientProps) {
    const [dateRange, setDateRange] = useState({ from: startOfMonthLocalString(), to: todayLocalString() });
    const [filterSeller, setFilterSeller] = useState('');
    const [filterProvince, setFilterProvince] = useState('');
    const [filterChannel, setFilterChannel] = useState('');

    const filteredOrders = useMemo(() => {
        const dFrom = parseLocalDate(dateRange.from);
        const dTo = parseLocalDate(dateRange.to);
        dTo.setHours(23, 59, 59);
        return orders.filter(o => {
            const d = new Date(o.created_at);
            if (d < dFrom || d > dTo) return false;
            if (filterSeller && o.seller_id !== filterSeller) return false;
            if (filterProvince && o.province_id !== filterProvince) return false;
            if (filterChannel && o.channel !== filterChannel) return false;
            return true;
        });
    }, [orders, dateRange, filterSeller, filterProvince, filterChannel]);

    const provinceName = (id: string) => provinces.find(p => p.id === id)?.name || 'Otros';

    const kpis = useMemo(() => {
        const facturacion = filteredOrders.reduce((s, o) => s + Number(o.total_net), 0);
        const cascos = filteredOrders.reduce((s, o) =>
            s + o.items.filter(i => i.catalog_item?.sales_category === 'CASCO').reduce((x, i) => x + i.quantity, 0), 0);
        const ticket = cascos > 0 ? facturacion / cascos : 0;

        const byProv = new Map<string, number>();
        filteredOrders.forEach(o => {
            const n = provinceName(o.province_id);
            byProv.set(n, (byProv.get(n) || 0) + Number(o.total_net));
        });
        const topProv = Array.from(byProv.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        const revendedorPct = filteredOrders.length > 0
            ? Math.round((filteredOrders.filter(o => o.channel === 'REVENDEDOR').length / filteredOrders.length) * 100)
            : 0;

        return { facturacion, cascos, ticket, topProv, revendedorPct };
    }, [filteredOrders, provinces]);

    const byProvince = useMemo(() => {
        const map = new Map<string, number>();
        filteredOrders.forEach(o => {
            const n = provinceName(o.province_id);
            map.set(n, (map.get(n) || 0) + Number(o.total_net));
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 12);
    }, [filteredOrders, provinces]);

    const byCascoModel = useMemo(() => {
        const map = new Map<string, { name: string; cantidad: number; facturacion: number }>();
        filteredOrders.forEach(o => {
            o.items
                .filter(i => i.catalog_item?.sales_category === 'CASCO')
                .forEach(item => {
                    const name = item.catalog_item!.name;
                    const cur = map.get(name) || { name, cantidad: 0, facturacion: 0 };
                    cur.cantidad += item.quantity;
                    cur.facturacion += Number(item.subtotal_net);
                    map.set(name, cur);
                });
        });
        return Array.from(map.values())
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 12);
    }, [filteredOrders]);

    const monthlyByChannel = useMemo(() => {
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
        orders.forEach(o => {
            if (filterSeller && o.seller_id !== filterSeller) return;
            if (filterProvince && o.province_id !== filterProvince) return;
            if (filterChannel && o.channel !== filterChannel) return;
            const key = o.created_at.substring(0, 7);
            const m = months.find(x => x.key === key);
            if (!m) return;
            if (o.channel === 'INTERNO') m.INTERNO += Number(o.total_net);
            else m.REVENDEDOR += Number(o.total_net);
        });
        return months;
    }, [orders, filterSeller, filterProvince, filterChannel]);

    const sellerRanking = useMemo(() => {
        const map = new Map<string, { id: string; name: string; orders: number; total: number; cascos: number }>();
        filteredOrders.forEach(o => {
            const sid = o.seller_id || '__directo__';
            const sname = sellers.find(s => s.id === sid)?.name || 'Directo';
            const cur = map.get(sid) || { id: sid, name: sname, orders: 0, total: 0, cascos: 0 };
            cur.orders++;
            cur.total += Number(o.total_net);
            cur.cascos += o.items.filter(i => i.catalog_item?.sales_category === 'CASCO').reduce((x, i) => x + i.quantity, 0);
            map.set(sid, cur);
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
    }, [filteredOrders, sellers]);

    const resellerRanking = useMemo(() => {
        const map = new Map<string, { id: string; name: string; orders: number; total: number; prov: string }>();
        filteredOrders.filter(o => o.channel === 'REVENDEDOR').forEach(o => {
            const rid = o.reseller_id || '__otros__';
            const r = (o as any).reseller;
            const rname = r?.name || 'Otros';
            const cur = map.get(rid) || { id: rid, name: rname, orders: 0, total: 0, prov: provinceName(o.province_id) };
            cur.orders++;
            cur.total += Number(o.total_net);
            map.set(rid, cur);
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
    }, [filteredOrders, provinces]);

    return (
        <div className="pb-10">
            <PageHeader title="Ventas" subtitle="Qué se vende, dónde y por qué canal" />

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
                <KPICard title="Cascos vendidos" value={kpis.cascos} color="primary"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
                <KPICard title="Facturación" value={formatCurrency(kpis.facturacion)} color="success"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <KPICard title="Ticket por casco" value={formatCurrency(kpis.ticket)} color="info"
                    description="Facturación ÷ cascos vendidos" />
                <KPICard title="Top provincia" value={kpis.topProv} color="warning"
                    description={`${kpis.revendedorPct}% canal revendedor`} />
            </KPIContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Ventas por provincia</h3>
                    <p className="text-xs text-gray-400 font-medium mb-5">Ranking por monto facturado</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byProvince} layout="vertical" barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => formatCurrency(Number(v))} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Modelos de casco vendidos</h3>
                    <p className="text-xs text-gray-400 font-medium mb-5">Ranking por unidades — top 12</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byCascoModel} layout="vertical" barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(v: any, name: string) =>
                                        name === 'cantidad' ? [`${v} uds.`, 'Cascos'] : [formatCurrency(Number(v)), 'Facturación']
                                    }
                                />
                                <Bar dataKey="cantidad" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Evolución mensual por canal</h3>
                <p className="text-xs text-gray-400 font-medium mb-5">Últimos 12 meses</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyByChannel}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => formatCurrency(Number(v))} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                            <Line type="monotone" dataKey="INTERNO" name="Interno" stroke={CHANNEL_COLORS.INTERNO} strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="REVENDEDOR" name="Revendedor" stroke={CHANNEL_COLORS.REVENDEDOR} strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-5">Ranking de vendedores</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['Vendedor', 'Pedidos', 'Cascos', 'Facturación'].map((h, i) => (
                                        <th key={h} className={`py-2 pb-3 font-black text-gray-400 uppercase tracking-wider text-[10px] ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sellerRanking.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-2.5 font-bold text-gray-900">
                                            <span className="text-gray-300 mr-2">#{idx + 1}</span>{s.name}
                                        </td>
                                        <td className="py-2.5 text-right font-medium text-gray-600">{s.orders}</td>
                                        <td className="py-2.5 text-right font-bold text-primary-600">{s.cascos}</td>
                                        <td className="py-2.5 text-right font-black text-gray-900">{formatCurrency(s.total)}</td>
                                    </tr>
                                ))}
                                {sellerRanking.length === 0 && (
                                    <tr><td colSpan={4} className="py-6 text-center text-gray-300 text-xs italic">Sin datos</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-5">Top revendedores</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['Revendedor', 'Provincia', 'Pedidos', 'Facturación'].map((h, i) => (
                                        <th key={h} className={`py-2 pb-3 font-black text-gray-400 uppercase tracking-wider text-[10px] ${i === 0 ? 'text-left' : i < 3 ? 'text-left' : 'text-right'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {resellerRanking.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-2.5 font-bold text-gray-900">
                                            <span className="text-gray-300 mr-2">#{idx + 1}</span>{r.name}
                                        </td>
                                        <td className="py-2.5 font-medium text-gray-500">{r.prov}</td>
                                        <td className="py-2.5 font-medium text-gray-600">{r.orders}</td>
                                        <td className="py-2.5 text-right font-black text-gray-900">{formatCurrency(r.total)}</td>
                                    </tr>
                                ))}
                                {resellerRanking.length === 0 && (
                                    <tr><td colSpan={4} className="py-6 text-center text-gray-300 text-xs italic">Sin datos de revendedores</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
