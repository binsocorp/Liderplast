'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ArrowLeftRight, Wallet, TrendingDown, X, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SegmentedDateFilter } from '@/components/ui/SegmentedDateFilter';
import { createTransfer, deleteMovement } from './actions';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) => new Intl.DateTimeFormat('es-AR').format(new Date(d + 'T12:00:00'));

const MOVEMENT_LABELS: Record<string, { label: string; sign: number; cls: string }> = {
    INGRESO: { label: 'Ingreso', sign: +1, cls: 'text-success-700 bg-success-50' },
    EGRESO: { label: 'Egreso', sign: -1, cls: 'text-danger-700 bg-danger-50' },
    TRANSFERENCIA_IN: { label: 'Transferencia', sign: +1, cls: 'text-primary-700 bg-primary-50' },
    TRANSFERENCIA_OUT: { label: 'Transferencia', sign: -1, cls: 'text-primary-700 bg-primary-50' },
};

interface PaymentMethod { id: string; name: string; }
interface Movement {
    id: string;
    payment_method_id: string;
    movement_type: string;
    amount: number;
    description?: string;
    movement_date: string;
    created_at: string;
    source_type: 'income' | 'expense';
    transfer_id?: string | null;
    transfer_to_method_id?: string | null;
}

export function CajaClient({ paymentMethods, movements }: {
    paymentMethods: PaymentMethod[];
    movements: Movement[];
}) {
    const router = useRouter();
    const [showTransfer, setShowTransfer] = useState(false);
    const [filterMethod, setFilterMethod] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [fromMethod, setFromMethod] = useState('');
    const [toMethod, setToMethod] = useState('');
    const [tAmount, setTAmount] = useState('');
    const [tDesc, setTDesc] = useState('');
    const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const balances = useMemo(() => {
        const map = new Map<string, number>();
        paymentMethods.forEach(pm => map.set(pm.id, 0));
        movements.forEach(m => {
            const cfg = MOVEMENT_LABELS[m.movement_type];
            if (!cfg) return;
            const current = map.get(m.payment_method_id) ?? 0;
            map.set(m.payment_method_id, current + cfg.sign * Number(m.amount));
        });
        return map;
    }, [movements, paymentMethods]);

    const totalBalance = useMemo(() =>
        Array.from(balances.values()).reduce((a, b) => a + b, 0),
        [balances]);

    const filteredMovements = useMemo(() =>
        movements.filter(m => {
            if (filterMethod && m.payment_method_id !== filterMethod) return false;
            if (dateFrom && m.movement_date < dateFrom) return false;
            if (dateTo && m.movement_date > dateTo) return false;
            return true;
        }),
        [movements, filterMethod, dateFrom, dateTo]);

    useEffect(() => { setPage(1); }, [filteredMovements]);

    const pagedMovements = useMemo(() =>
        filteredMovements.slice((page - 1) * pageSize, page * pageSize),
        [filteredMovements, page, pageSize]);

    async function handleTransfer() {
        if (!fromMethod || !toMethod || !tAmount) { setError('Complete todos los campos'); return; }
        setSaving(true);
        setError('');
        const res = await createTransfer({
            from_method_id: fromMethod,
            to_method_id: toMethod,
            amount: Number(tAmount),
            description: tDesc,
            movement_date: tDate,
        });
        setSaving(false);
        if (res.error) { setError(res.error); return; }
        setShowTransfer(false);
        setFromMethod(''); setToMethod(''); setTAmount(''); setTDesc('');
        setTDate(new Date().toISOString().split('T')[0]);
        router.refresh();
    }

    async function handleDelete(m: Movement) {
        if (!confirm('¿Eliminar este movimiento?')) return;
        const res = await deleteMovement(m.id, m.source_type, m.transfer_id);
        if (res.error) alert(res.error);
        else router.refresh();
    }

    return (
        <>
            <PageHeader
                title="Caja"
                subtitle="Movimientos por cuenta"
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setError(''); setShowTransfer(true); }} icon={<ArrowLeftRight className="w-4 h-4" />}>
                            Transferir
                        </Button>
                        <Link href="/finance/expenses?new=1">
                            <Button variant="secondary" icon={<TrendingDown className="w-4 h-4" />}>
                                Egreso
                            </Button>
                        </Link>
                        <Link href="/finance/income?new=1">
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Ingreso
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Balance cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                <div className="col-span-full sm:col-span-1 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl p-5 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 opacity-80" />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Balance Total</span>
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${totalBalance < 0 ? 'text-danger-200' : ''}`}>
                        {formatCurrency(totalBalance)}
                    </p>
                </div>

                {paymentMethods.map(pm => {
                    const bal = balances.get(pm.id) ?? 0;
                    return (
                        <div
                            key={pm.id}
                            onClick={() => setFilterMethod(f => f === pm.id ? '' : pm.id)}
                            className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all shadow-sm hover:shadow-md ${filterMethod === pm.id ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-100'
                                }`}
                        >
                            <p className="text-xs text-gray-400 font-medium truncate mb-1">{pm.name}</p>
                            <p className={`text-xl font-black tabular-nums ${bal < 0 ? 'text-danger-600' : 'text-gray-900'}`}>
                                {formatCurrency(bal)}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
                {filterMethod && (
                    <button
                        onClick={() => setFilterMethod('')}
                        className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        {paymentMethods.find(p => p.id === filterMethod)?.name}
                    </button>
                )}
                <SegmentedDateFilter
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onChange={(from, to) => {
                        setDateFrom(from);
                        setDateTo(to);
                    }}
                />
                <span className="ml-auto text-xs text-gray-400 font-medium">
                    {filteredMovements.length} movimientos
                </span>
            </div>

            {/* Movement history */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80">
                                <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Fecha</th>
                                <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tipo</th>
                                <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Cuenta</th>
                                <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Descripción</th>
                                <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider text-gray-500">Monto</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pagedMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 font-medium">
                                        Sin movimientos registrados.
                                    </td>
                                </tr>
                            ) : (
                                pagedMovements.map(m => {
                                    const cfg = MOVEMENT_LABELS[m.movement_type] ?? { label: m.movement_type, sign: 1, cls: 'text-gray-600 bg-gray-100' };
                                    const signed = cfg.sign * Number(m.amount);
                                    const pmName = paymentMethods.find(p => p.id === m.payment_method_id)?.name;
                                    const transferToName = m.transfer_to_method_id
                                        ? paymentMethods.find(p => p.id === m.transfer_to_method_id)?.name
                                        : null;
                                    const detailHref = m.source_type === 'income'
                                        ? `/finance/income?open=${m.id}`
                                        : `/finance/expenses?open=${m.id}`;
                                    return (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            onClick={() => router.push(detailHref)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="block text-gray-700 font-medium tabular-nums">{formatDate(m.movement_date)}</span>
                                                <span className="block text-[10px] text-gray-400 tabular-nums mt-0.5">
                                                    {new Date(m.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">
                                                {pmName || '—'}
                                                {transferToName && (
                                                    <span className="ml-1 text-gray-400 text-xs">→ {transferToName}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 max-w-[240px] truncate">{m.description || '—'}</td>
                                            <td className={`px-4 py-3 text-right font-bold tabular-nums ${signed >= 0 ? 'text-success-700' : 'text-danger-600'}`}>
                                                {signed >= 0 ? '+' : ''}{formatCurrency(signed)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(m); }}
                                                    className="p-1.5 text-gray-300 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={filteredMovements.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* ─── Transfer Modal ─── */}
            {showTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Transferir entre cuentas</h2>
                            <button onClick={() => setShowTransfer(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-xl">{error}</div>}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Origen <span className="text-danger-500">*</span></label>
                                    <select value={fromMethod} onChange={e => setFromMethod(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                                        <option value="">Seleccionar...</option>
                                        {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Destino <span className="text-danger-500">*</span></label>
                                    <select value={toMethod} onChange={e => setToMethod(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                                        <option value="">Seleccionar...</option>
                                        {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Monto <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input type="number" min="0" step="0.01" value={tAmount} onChange={e => setTAmount(e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Fecha</label>
                                <input type="date" value={tDate} onChange={e => setTDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Descripción</label>
                                <input type="text" value={tDesc} onChange={e => setTDesc(e.target.value)}
                                    placeholder="Descripción opcional..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowTransfer(false)} disabled={saving}>Cancelar</Button>
                            <Button onClick={handleTransfer} disabled={saving}>{saving ? 'Guardando...' : 'Transferir'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
