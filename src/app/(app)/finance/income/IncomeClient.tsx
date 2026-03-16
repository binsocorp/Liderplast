'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, DollarSign, FileText, TrendingUp, Wallet } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { ColumnFilter } from '@/components/ui/ColumnFilter';
import { NewIncomeModal } from './NewIncomeModal';
import { deleteIncome } from './actions';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) => new Intl.DateTimeFormat('es-AR').format(new Date(d));

const INCOME_TYPES: Record<string, string> = {
    'VENTA': 'Ingreso por Venta',
    'EXTRAORDINARIO': 'Ingreso Extraordinario',
    'REINTEGRO_RECUPERO': 'Reintegro / Recupero',
    'OTRO': 'Otro Ingreso'
};

export function IncomeClient({ incomes, orders, paymentMethods }: any) {
    const router = useRouter();

    const [showModal, setShowModal] = useState(false);

    // Filters
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    );
    const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

    const filtered = useMemo(() => {
        const dFrom = new Date(dateFrom);
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59);

        return incomes.filter((e: any) => {
            const d = new Date(e.issue_date);
            if (d < dFrom || d > dTo) return false;
            if (typeFilter && e.income_type !== typeFilter) return false;
            if (paymentMethodFilter && e.payment_method_id !== paymentMethodFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const clientName = e.order?.client_name?.toLowerCase() || '';
                const desc = e.description?.toLowerCase() || '';
                return desc.includes(q) || clientName.includes(q);
            }
            return true;
        });
    }, [incomes, dateFrom, dateTo, search, typeFilter, paymentMethodFilter]);

    // KPIs
    const stats = useMemo(() => {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthIncomes = incomes.filter((i: any) => {
            const d = new Date(i.issue_date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const todayStr = now.toISOString().split('T')[0];
        const dayIncomes = incomes.filter((i: any) => i.issue_date.startsWith(todayStr));

        const monthTotal = monthIncomes.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
        const todayTotal = dayIncomes.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);

        const monthSales = monthIncomes
            .filter((i: any) => i.income_type === 'VENTA')
            .reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);

        const monthExtra = monthIncomes
            .filter((i: any) => i.income_type !== 'VENTA')
            .reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);

        // Pending balance from all orders globally?
        // Or only from selected orders? We just calculate from the passed non-completed orders:
        const totalPendingSales = orders.reduce((acc: number, o: any) => {
            const total = Number(o.total_net) || 0;
            const paid = Number(o.paid_amount) || 0;
            return o.payment_status !== 'PAID' && o.status !== 'CANCELADO' ? acc + (Math.max(0, total - paid)) : acc;
        }, 0);

        return { monthTotal, todayTotal, monthSales, monthExtra, totalPendingSales };
    }, [incomes, orders]);

    // Pie chart
    const typePie = useMemo(() => {
        const map = new Map<string, number>();
        filtered.forEach((e: any) => {
            const name = INCOME_TYPES[e.income_type] || e.income_type;
            map.set(name, (map.get(name) || 0) + Number(e.amount));
        });
        return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filtered]);

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este ingreso? Esto revertirá el saldo cobrado en la venta asociada si existe.')) return;
        const res = await deleteIncome(id);
        if (res.error) alert(res.error);
        router.refresh();
    }

    return (
        <>
            <PageHeader
                title="Ingresos"
                subtitle={`${filtered.length} movimientos`}
                actions={
                    <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
                        Nuevo Ingreso
                    </Button>
                }
            />

            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período</span>
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 px-2 py-1" />
                        <span className="text-gray-400 text-[10px] font-black mx-1">—</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 px-2 py-1" />
                    </div>
                </div>

                <div className="relative flex-1 min-w-[200px]">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por descripción o cliente..." className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-gray-700 placeholder:text-gray-400" />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <KPIContainer>
                <KPICard title="Ingresos del Mes" value={formatCurrency(stats.monthTotal)} color="primary" icon={<TrendingUp className="w-5 h-5" />} />
                <KPICard title="Ingresos de Hoy" value={formatCurrency(stats.todayTotal)} color="success" icon={<DollarSign className="w-5 h-5" />} />
                <KPICard title="Cobranzas de Ventas (Mes)" value={formatCurrency(stats.monthSales)} color="info" icon={<FileText className="w-5 h-5" />} />
                <KPICard title="Saldo Pendiente Ventas" value={formatCurrency(stats.totalPendingSales)} color="warning" icon={<Wallet className="w-5 h-5" />} />
            </KPIContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PieChartCard title="Distribución por Tipo" subtitle="Mes actual / Filtro" data={typePie} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="px-4 py-3 text-left">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Emisión</span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <ColumnFilter
                                        label="Tipo de Ingreso"
                                        value={typeFilter}
                                        onChange={setTypeFilter}
                                        options={Object.entries(INCOME_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                                        allLabel="Todos"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Descripción / Cliente</span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <ColumnFilter
                                        label="Medio Pago"
                                        value={paymentMethodFilter}
                                        onChange={setPaymentMethodFilter}
                                        options={paymentMethods.map((p: any) => ({ value: p.id, label: p.name }))}
                                        allLabel="Todos los medios"
                                    />
                                </th>
                                <th className="px-4 py-3 text-right">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Monto</span>
                                </th>
                                <th className="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 font-medium">
                                        No hay ingresos registrados con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 font-medium tabular-nums">{formatDate(r.issue_date)}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            {INCOME_TYPES[r.income_type] || r.income_type}
                                            {r.order && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-primary-100 text-primary-700">Ref: {r.order.order_number}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 max-w-[250px] truncate">
                                            {r.description || r.order?.client_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-medium">
                                            {r.payment_method?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                                            {formatCurrency(Number(r.amount))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="Eliminar">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <NewIncomeModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    orders={orders}
                    paymentMethods={paymentMethods}
                />
            )}
        </>
    );
}

function PieChartCard({ title, subtitle, data }: { title: string; subtitle: string; data: { name: string; value: number }[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
                </div>
            </div>
            {data.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="h-40 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(val: any) => formatCurrency(val)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
