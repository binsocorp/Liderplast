'use client';

import React, { useMemo, useState } from 'react';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import type { Order, OrderItem, FinanceExpense, FinanceIncome } from '@/lib/types/database';
import { parseLocalDate, formatLocalDate, todayLocalString, startOfMonthLocalString } from '@/lib/utils/dates';

interface OrderWithItems extends Order {
    items: OrderItem[];
    seller?: any;
}

interface ExecutiveClientProps {
    orders: OrderWithItems[];
    expenses: FinanceExpense[];
    income: FinanceIncome[];
    catalogItems: any[];
    sellers: any[];
    provinces: any[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function ExecutiveClient({
    orders,
    expenses,
    income,
    catalogItems,
    sellers,
    provinces
}: ExecutiveClientProps) {
    // Filters State
    const [dateRange, setDateRange] = useState({
        from: startOfMonthLocalString(),
        to: todayLocalString()
    });
    const [filterSeller, setFilterSeller] = useState('');
    const [filterProvince, setFilterProvince] = useState('');
    const [filterChannel, setFilterChannel] = useState('');

    // Formatter
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(val);
    };

    // Filtered Data
    const filteredData = useMemo(() => {
        const dFrom = parseLocalDate(dateRange.from);
        const dTo = parseLocalDate(dateRange.to);
        dTo.setHours(23, 59, 59);

        const fOrders = orders.filter(o => {
            const d = new Date(o.created_at);
            if (d < dFrom || d > dTo) return false;
            if (filterSeller && o.seller_id !== filterSeller) return false;
            if (filterProvince && o.province_id !== filterProvince) return false;
            if (filterChannel && o.channel !== filterChannel) return false;
            return true;
        });

        const fExpenses = expenses.filter(e => {
            const d = parseLocalDate(e.issue_date);
            return d >= dFrom && d <= dTo;
        });

        const fIncome = income.filter(i => {
            const d = parseLocalDate(i.issue_date);
            return d >= dFrom && d <= dTo;
        });

        return { fOrders, fExpenses, fIncome };
    }, [orders, expenses, income, dateRange, filterSeller, filterProvince, filterChannel]);

    // KPIs Calculations
    const stats = useMemo(() => {
        const { fOrders, fExpenses, fIncome } = filteredData;

        const totalSales = fOrders.reduce((sum, o) => sum + Number(o.total_net), 0);
        const totalOtherIncome = fIncome.reduce((sum, i) => sum + Number(i.amount), 0);
        const totalEgresos = fExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Beneficio Bruto (Simplified: Sales + Other Income - Expenses)
        const grossProfit = totalSales + totalOtherIncome - totalEgresos;

        const orderCount = fOrders.length;
        const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

        const unitsSold = fOrders.reduce((sum, o) => {
            return sum + o.items.filter(item => item.type === 'PRODUCTO').reduce((s, i) => s + i.quantity, 0);
        }, 0);

        return {
            totalSales,
            totalOtherIncome,
            totalEgresos,
            grossProfit,
            orderCount,
            avgTicket,
            unitsSold,
            totalIngresos: totalSales + totalOtherIncome
        };
    }, [filteredData]);

    // Charts Data Aggregation
    const chartData = useMemo(() => {
        const { fOrders, fExpenses, fIncome } = filteredData;
        const dataMap = new Map();

        // Group by day
        fOrders.forEach(o => {
            const date = o.created_at.split('T')[0];
            const current = dataMap.get(date) || { date, ingreso: 0, egreso: 0 };
            current.ingreso += Number(o.total_net);
            dataMap.set(date, current);
        });

        fIncome.forEach(i => {
            const date = i.issue_date;
            const current = dataMap.get(date) || { date, ingreso: 0, egreso: 0 };
            current.ingreso += Number(i.amount);
            dataMap.set(date, current);
        });

        fExpenses.forEach(e => {
            const date = e.issue_date;
            const current = dataMap.get(date) || { date, ingreso: 0, egreso: 0 };
            current.egreso += Number(e.amount);
            dataMap.set(date, current);
        });

        return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredData]);

    const topProducts = useMemo(() => {
        const map = new Map();
        filteredData.fOrders.forEach(o => {
            o.items.forEach(item => {
                if (item.type === 'PRODUCTO') {
                    const current = map.get(item.catalog_item_id) || { name: item.description, total: 0, count: 0 };
                    current.total += Number(item.subtotal_net);
                    current.count += item.quantity;
                    map.set(item.catalog_item_id, current);
                }
            });
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [filteredData]);

    const recentTransactions = useMemo(() => {
        const items: any[] = [
            ...filteredData.fOrders.map(o => ({
                id: o.id,
                date: o.created_at,
                description: `Pedido ${o.order_number} - ${o.client_name}`,
                category: 'Venta',
                amount: Number(o.total_net),
                type: 'INCOME'
            })),
            ...filteredData.fIncome.map(i => ({
                id: i.id,
                date: i.issue_date,
                description: i.description,
                category: 'Otros Ingresos',
                amount: Number(i.amount),
                type: 'INCOME'
            })),
            ...filteredData.fExpenses.map(e => ({
                id: e.id,
                date: e.issue_date,
                description: e.description,
                category: 'Egreso',
                amount: Number(e.amount),
                type: 'EXPENSE'
            }))
        ];
        return items.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()).slice(0, 5);
    }, [filteredData]);
    return (
        <div className="pb-10">
            <PageHeader
                title="Resumen Ejecutivo"
                subtitle="Indicadores globales de desempeño del negocio"
            />

            <DashboardFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                filters={[
                    {
                        label: 'Vendedor',
                        value: filterSeller,
                        onChange: setFilterSeller,
                        options: sellers.map(s => ({ value: s.id, label: s.name }))
                    },
                    {
                        label: 'Provincia',
                        value: filterProvince,
                        onChange: setFilterProvince,
                        options: provinces.map(p => ({ value: p.id, label: p.name }))
                    },
                    {
                        label: 'Canal',
                        value: filterChannel,
                        onChange: setFilterChannel,
                        options: [
                            { value: 'INTERNO', label: 'Interno' },
                            { value: 'REVENDEDOR', label: 'Revendedor' }
                        ]
                    }
                ]}
            />

            <KPIContainer>
                <KPICard
                    title="Ventas Totales"
                    value={formatCurrency(stats.totalSales)}
                    color="primary"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    trend={{ value: 12, isPositive: true, label: 'vs mes anterior' }}
                />
                <KPICard
                    title="Beneficio Bruto"
                    value={formatCurrency(stats.grossProfit)}
                    color="success"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                />
                <KPICard
                    title="Ticket Promedio"
                    value={formatCurrency(stats.avgTicket)}
                    color="info"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    }
                />
                <KPICard
                    title="Unidades Vendidas"
                    value={stats.unitsSold}
                    color="warning"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    }
                />
            </KPIContainer>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Secondary KPIs */}
                <div className="lg:col-span-1 space-y-4">
                    <KPICard title="Ingresos Totales" value={formatCurrency(stats.totalIngresos)} color="success" description="Ventas + Otros Ingresos" />
                    <KPICard title="Egresos Totales" value={formatCurrency(stats.totalEgresos)} color="danger" description="Gastos y Costos operativos" />
                    <KPICard title="Cant. de Pedidos" value={stats.orderCount} color="info" />
                    <KPICard title="Otros Ingresos" value={formatCurrency(stats.totalOtherIncome)} color="primary" />
                </div>

                {/* Main Trends Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Evolución Financiera</h3>
                            <p className="text-xs text-gray-400 font-medium">Ingresos vs Egresos en el tiempo</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEgreso" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                                />
                                <YAxis
                                    hide
                                />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: any) => formatCurrency(Number(val || 0))}
                                />
                                <Area type="monotone" dataKey="ingreso" stroke="#10b981" fillOpacity={1} fill="url(#colorIngreso)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="egreso" stroke="#ef4444" fillOpacity={1} fill="url(#colorEgreso)" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-danger-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Egresos</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recent Transactions */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-gray-900">Transacciones Recientes</h3>
                        <button className="text-[11px] font-black text-primary-600 hover:underline uppercase tracking-wider">Ver All</button>
                    </div>
                    <div className="space-y-4">
                        {recentTransactions.map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-danger-50 text-danger-600'
                                        }`}>
                                        {tx.type === 'INCOME' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{tx.description}</p>
                                        <p className="text-[10px] text-gray-400 font-medium capitalize">{tx.category} • {formatLocalDate(tx.date)}</p>
                                    </div>
                                </div>
                                <div className={`text-xs font-black ${tx.type === 'INCOME' ? 'text-green-600' : 'text-danger-600'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-gray-900">Productos Destacados</h3>
                        <button className="text-[11px] font-black text-primary-600 hover:underline uppercase tracking-wider">Ver Productos</button>
                    </div>
                    <div className="space-y-4">
                        {topProducts.map((prod: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{prod.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{prod.count} unidades vendidas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-900">{formatCurrency(prod.total)}</p>
                                    <p className="text-[10px] text-green-600 font-bold">En Stock</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
