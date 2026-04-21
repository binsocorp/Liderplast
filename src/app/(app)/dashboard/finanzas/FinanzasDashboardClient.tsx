'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { parseLocalDate } from '@/lib/utils/dates';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const MOVEMENT_SIGN: Record<string, number> = {
    INGRESO: +1, EGRESO: -1,
    TRANSFERENCIA_IN: +1, TRANSFERENCIA_OUT: -1,
    SALDO_INICIAL: +1, AJUSTE: +1,
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface Props {
    paymentMethods: { id: string; name: string }[];
    movements: any[];
    incomes: any[];
    expenses: any[];
    pendingExpenses: any[];
}

export function FinanzasDashboardClient({ paymentMethods, movements, incomes, expenses, pendingExpenses }: Props) {

    // Balance per account from movements
    const balances = useMemo(() => {
        const map = new Map<string, number>();
        paymentMethods.forEach(pm => map.set(pm.id, 0));
        movements.forEach((m: any) => {
            const sign = MOVEMENT_SIGN[m.movement_type] ?? 0;
            map.set(m.payment_method_id, (map.get(m.payment_method_id) ?? 0) + sign * Number(m.amount));
        });
        return map;
    }, [movements, paymentMethods]);

    const totalBalance = useMemo(() => Array.from(balances.values()).reduce((a, b) => a + b, 0), [balances]);

    // KPIs: this month
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);

    const monthIncomes = useMemo(() =>
        incomes.filter((i: any) => i.issue_date.startsWith(monthStr))
            .reduce((s: number, i: any) => s + Number(i.amount), 0),
    [incomes, monthStr]);

    const monthExpenses = useMemo(() =>
        expenses.filter((e: any) => e.issue_date.startsWith(monthStr))
            .reduce((s: number, e: any) => s + Number(e.amount), 0),
    [expenses, monthStr]);

    const pendingTotal = useMemo(() =>
        pendingExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0),
    [pendingExpenses]);

    // Cash flow chart: last 12 months
    const cashFlowData = useMemo(() => {
        const months: Record<string, { month: string; ingresos: number; egresos: number }> = {};

        // Build 12-month buckets
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months[key] = { month: MONTH_NAMES[d.getMonth()], ingresos: 0, egresos: 0 };
        }

        incomes.forEach((i: any) => {
            const key = i.issue_date.slice(0, 7);
            if (months[key]) months[key].ingresos += Number(i.amount);
        });

        expenses.forEach((e: any) => {
            const key = e.issue_date.slice(0, 7);
            if (months[key]) months[key].egresos += Number(e.amount);
        });

        return Object.values(months);
    }, [incomes, expenses]);

    const daysSince = (dateStr: string) =>
        Math.floor((Date.now() - parseLocalDate(dateStr).getTime()) / 86400000);

    return (
        <>
            <PageHeader
                title="Dashboard Finanzas"
                subtitle="Resumen consolidado de caja e ingresos/egresos"
            />

            {/* KPIs */}
            <KPIContainer>
                <KPICard title="Saldo Total en Caja" value={formatCurrency(totalBalance)} color="primary" icon={<Wallet className="w-5 h-5" />} />
                <KPICard title="Ingresos del Mes" value={formatCurrency(monthIncomes)} color="success" icon={<TrendingUp className="w-5 h-5" />} />
                <KPICard title="Egresos del Mes" value={formatCurrency(monthExpenses)} color="danger" icon={<TrendingDown className="w-5 h-5" />} />
                <KPICard title="Egresos Pendientes" value={formatCurrency(pendingTotal)} color="warning" icon={<AlertTriangle className="w-5 h-5" />} />
            </KPIContainer>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Cash Flow Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Flujo de Caja — Últimos 12 meses</h3>
                    <p className="text-xs text-gray-400 font-medium mb-5">Ingresos vs Egresos registrados</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlowData} barGap={2} barCategoryGap="30%">
                                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(val: any) => formatCurrency(val)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)', fontSize: 12 }}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Balance by account */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Saldo por Cuenta</h3>
                    <p className="text-xs text-gray-400 font-medium mb-4">Balance acumulado actual</p>
                    <div className="space-y-3">
                        {paymentMethods.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Sin cuentas configuradas</p>
                        ) : (
                            paymentMethods.map(pm => {
                                const bal = balances.get(pm.id) ?? 0;
                                return (
                                    <div key={pm.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-sm font-medium text-gray-700">{pm.name}</span>
                                        <span className={`text-sm font-bold tabular-nums ${bal < 0 ? 'text-danger-600' : 'text-gray-900'}`}>
                                            {formatCurrency(bal)}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <Link
                        href="/finance/caja"
                        className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                    >
                        Ver movimientos <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* Pending expenses */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Egresos Pendientes de Pago</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{pendingExpenses.length} comprobantes · {formatCurrency(pendingTotal)}</p>
                    </div>
                    <Link href="/finance/expenses" className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1">
                        Ver todos <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {pendingExpenses.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-400 text-sm">Sin egresos pendientes</p>
                    ) : (
                        pendingExpenses.slice(0, 10).map((e: any) => {
                            const days = daysSince(e.issue_date);
                            const isOverdue = days > 30;
                            return (
                                <div key={e.id} className={`px-6 py-3 flex items-center justify-between ${isOverdue ? 'bg-danger-50/30' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        {isOverdue && <AlertTriangle className="w-4 h-4 text-danger-500 shrink-0" />}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{e.description || '—'}</p>
                                            <p className="text-xs text-gray-400">
                                                {e.vendor?.name && <span className="mr-2">{e.vendor.name}</span>}
                                                {new Intl.DateTimeFormat('es-AR').format(new Date(e.issue_date + 'T12:00:00'))}
                                                {isOverdue && <span className="ml-2 text-danger-600 font-semibold">{days} días</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold tabular-nums ${isOverdue ? 'text-danger-700' : 'text-gray-900'}`}>
                                        {formatCurrency(Number(e.amount))}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
