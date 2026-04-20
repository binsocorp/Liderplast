'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, DollarSign, FileText, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { ColumnFilter } from '@/components/ui/ColumnFilter';
import { NewExpenseModal } from './NewExpenseModal';
import { toggleExpenseStatus, deleteExpense } from './actions';

// ───── Palette ─────
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) => new Intl.DateTimeFormat('es-AR').format(new Date(d));

// ──────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────
export function ExpensesClient({
    expenses,
    categories,
    subcategories,
    paymentMethods,
    vendors,
    autoOpen
}: any) {
    const router = useRouter();

    // Modal
    const [showModal, setShowModal] = useState(!!autoOpen);
    const [editingExpense, setEditingExpense] = useState<any>(null);

    // ── Date slicer ──
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    );
    const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);

    // ── Column filters ──
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [subcategoryFilter, setSubcategoryFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [onlyPending, setOnlyPending] = useState(false);

    // ── Filtered Data ──
    const filtered = useMemo(() => {
        const dFrom = new Date(dateFrom);
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59);

        let result = expenses.filter((e: any) => {
            const d = new Date(e.issue_date);
            if (d < dFrom || d > dTo) return false;
            if (onlyPending && e.status !== 'PENDIENTE') return false;
            if (statusFilter && e.status !== statusFilter) return false;
            if (categoryFilter && e.category_id !== categoryFilter) return false;
            if (subcategoryFilter && e.subcategory_id !== subcategoryFilter) return false;
            if (paymentMethodFilter && e.payment_method_id !== paymentMethodFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return e.description?.toLowerCase().includes(q) || e.vendor?.name?.toLowerCase().includes(q);
            }
            return true;
        });
        // Sort by age (oldest first) when onlyPending is active
        if (onlyPending) {
            result = [...result].sort((a: any, b: any) =>
                new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
            );
        }
        return result;
    }, [expenses, dateFrom, dateTo, search, statusFilter, categoryFilter, subcategoryFilter, paymentMethodFilter, onlyPending]);

    // ── KPIs ──
    const stats = useMemo(() => {
        const total = filtered.reduce((s: number, e: any) => s + Number(e.amount), 0);
        const count = filtered.length;
        const avg = count > 0 ? total / count : 0;
        const pending = filtered
            .filter((e: any) => e.status === 'PENDIENTE')
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
        return { total, count, avg, pending };
    }, [filtered]);

    // ── Chart: Category Pie ──
    const categoryPie = useMemo(() => {
        const map = new Map<string, number>();
        filtered.forEach((e: any) => {
            const name = e.category?.name || 'Otros';
            map.set(name, (map.get(name) || 0) + Number(e.amount));
        });
        return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filtered]);

    // ── Chart: Payment Method Pie ──
    const paymentPie = useMemo(() => {
        const map = new Map<string, number>();
        filtered.forEach((e: any) => {
            const name = e.payment_method?.name || 'Otros';
            map.set(name, (map.get(name) || 0) + Number(e.amount));
        });
        return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filtered]);

    // ── Actions ──
    async function handleToggleStatus(id: string, current: string) {
        await toggleExpenseStatus(id, current);
        router.refresh();
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este egreso?')) return;
        await deleteExpense(id);
        router.refresh();
    }

    // ── Subcategory options (filtered by selected category) ──
    const subcategoryOptions = useMemo(() => {
        if (!categoryFilter) {
            const seen = new Set<string>();
            return subcategories
                .filter((s: any) => {
                    if (seen.has(s.id)) return false;
                    seen.add(s.id);
                    return true;
                })
                .map((s: any) => ({ value: s.id, label: s.name }));
        }
        return subcategories
            .filter((s: any) => s.category_id === categoryFilter)
            .map((s: any) => ({ value: s.id, label: s.name }));
    }, [subcategories, categoryFilter]);

    return (
        <>
            {/* ─── HEADER ─── */}
            <PageHeader
                title="Egresos"
                subtitle={`${filtered.length} comprobantes`}
                actions={
                    <Button onClick={() => { setEditingExpense(null); setShowModal(true); }} icon={<Plus className="w-4 h-4" />}>
                        Nuevo Egreso
                    </Button>
                }
            />

            {/* ─── DATE SLICER ─── */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período</span>
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 px-2 py-1"
                        />
                        <span className="text-gray-400 text-[10px] font-black mx-1">—</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 px-2 py-1"
                        />
                    </div>
                </div>

                {/* Solo pendientes toggle */}
                <button
                    onClick={() => setOnlyPending(p => !p)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        onlyPending
                            ? 'bg-warning-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-warning-50 hover:text-warning-700'
                    }`}
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Solo pendientes
                </button>

                {/* Quick search */}
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por descripción o proveedor..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-gray-700 placeholder:text-gray-400"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <KPIContainer>
                <KPICard
                    title="Egreso Total"
                    value={formatCurrency(stats.total)}
                    color="danger"
                    icon={<DollarSign className="w-5 h-5" />}
                />
                <KPICard
                    title="Comprobantes"
                    value={stats.count.toString()}
                    color="primary"
                    icon={<FileText className="w-5 h-5" />}
                />
                <KPICard
                    title="Promedio x Egreso"
                    value={formatCurrency(stats.avg)}
                    color="info"
                    icon={<TrendingDown className="w-5 h-5" />}
                />
                <KPICard
                    title="Pendiente de Pago"
                    value={formatCurrency(stats.pending)}
                    color="warning"
                    icon={<Clock className="w-5 h-5" />}
                />
            </KPIContainer>

            {/* ─── PIE CHARTS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PieChartCard title="Distribución por Categoría" subtitle="Participación de cada rubro" data={categoryPie} />
                <PieChartCard title="Distribución por Medio de Pago" subtitle="Canales de pago utilizados" data={paymentPie} />
            </div>

            {/* ─── TABLE ─── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header with Column Filters */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="px-4 py-3 text-left">
                                    <ColumnFilter
                                        label="Estado"
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        options={[
                                            { value: 'PAGADO', label: 'Pagado' },
                                            { value: 'PENDIENTE', label: 'Pendiente' },
                                        ]}
                                        allLabel="Todos los estados"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Emisión</span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <ColumnFilter
                                        label="Categoría"
                                        value={categoryFilter}
                                        onChange={(v) => { setCategoryFilter(v); setSubcategoryFilter(''); }}
                                        options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
                                        allLabel="Todas las categorías"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <ColumnFilter
                                        label="Subcategoría"
                                        value={subcategoryFilter}
                                        onChange={setSubcategoryFilter}
                                        options={subcategoryOptions}
                                        allLabel="Todas"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Descripción</span>
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
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 font-medium">
                                        No hay egresos para el período y filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r: any) => {
                                    const daysPending = r.status === 'PENDIENTE'
                                        ? Math.floor((Date.now() - new Date(r.issue_date).getTime()) / 86400000)
                                        : 0;
                                    const isOverdue = daysPending > 30;
                                    return (
                                    <tr
                                        key={r.id}
                                        className={`transition-colors cursor-pointer ${isOverdue ? 'bg-danger-50/40 hover:bg-danger-50/60' : 'hover:bg-gray-50/50'}`}
                                        onClick={() => { setEditingExpense(r); setShowModal(true); }}
                                    >
                                        <td className="px-4 py-3">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(r.id, r.status); }}
                                                className="cursor-pointer"
                                            >
                                                <Badge status={r.status} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-medium tabular-nums">
                                            {formatDate(r.issue_date)}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-800">
                                            {r.category?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs font-medium">
                                            {r.subcategory?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 max-w-[250px] truncate">
                                            {r.description}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-medium">
                                            {r.payment_method?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                                            {formatCurrency(Number(r.amount))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingExpense(r); setShowModal(true); }}
                                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table footer with totals */}
                {filtered.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Mostrando {filtered.length} de {expenses.length} registros
                        </span>
                        <span className="text-sm font-black text-gray-900 tracking-tight">
                            Total: {formatCurrency(stats.total)}
                        </span>
                    </div>
                )}
            </div>

            {/* ─── MODAL ─── */}
            <NewExpenseModal
                open={showModal}
                onClose={() => setShowModal(false)}
                expense={editingExpense}
                categories={categories}
                subcategories={subcategories}
                paymentMethods={paymentMethods}
                vendors={vendors}
            />
        </>
    );
}

// ──────────────────────────────────────────────────
// Pie Chart Card Component
// ──────────────────────────────────────────────────
function PieChartCard({ title, subtitle, data }: { title: string; subtitle: string; data: { name: string; value: number }[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
                </div>
                <span className="text-xs font-black text-gray-300 bg-gray-50 px-2 py-1 rounded-lg">
                    {data.length} rubros
                </span>
            </div>

            {data.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="h-64 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                    }}
                                    formatter={(val: any) => formatCurrency(val)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend as list */}
                    <div className="w-40 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {data.map((d, i) => {
                            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
                            return (
                                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                    <span className="text-gray-600 font-medium truncate flex-1">{d.name}</span>
                                    <span className="text-gray-400 font-bold tabular-nums">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
