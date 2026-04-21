'use client';

import React, { useMemo, useState } from 'react';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import type { FinanceExpense, FinanceIncome, FinanceCategory, FinanceIncomeCategory } from '@/lib/types/database';
import { parseLocalDate, todayLocalString, startOfMonthLocalString } from '@/lib/utils/dates';

interface FinanceClientProps {
    expenses: any[];
    income: any[];
    expenseCategories: FinanceCategory[];
    incomeCategories: FinanceIncomeCategory[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function FinanceClient({
    expenses,
    income,
    expenseCategories,
    incomeCategories
}: FinanceClientProps) {
    const [dateRange, setDateRange] = useState({
        from: startOfMonthLocalString(),
        to: todayLocalString()
    });

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

        const fExpenses = expenses.filter(e => {
            const d = parseLocalDate(e.issue_date);
            return d >= dFrom && d <= dTo;
        });

        const fIncome = income.filter(i => {
            const d = parseLocalDate(i.issue_date);
            return d >= dFrom && d <= dTo;
        });

        return { fExpenses, fIncome };
    }, [expenses, income, dateRange]);

    // Data Aggregation for Charts
    const expenseByCategory = useMemo(() => {
        const map = new Map();
        filteredData.fExpenses.forEach(e => {
            const catName = e.category?.name || 'Otros';
            map.set(catName, (map.get(catName) || 0) + Number(e.amount));
        });
        return Array.from(map, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const incomeByNature = useMemo(() => {
        const map = new Map();
        filteredData.fIncome.forEach(i => {
            const nature = i.category?.nature || 'OPERATIVO';
            map.set(nature, (map.get(nature) || 0) + Number(i.amount));
        });
        return Array.from(map, ([name, value]) => ({ name, value }));
    }, [filteredData]);

    const stats = useMemo(() => {
        const totalIncome = filteredData.fIncome.reduce((s, i) => s + Number(i.amount), 0);
        const totalExpense = filteredData.fExpenses.reduce((s, e) => s + Number(e.amount), 0);
        return { totalIncome, totalExpense, margin: totalIncome - totalExpense };
    }, [filteredData]);

    return (
        <div className="pb-10">
            <PageHeader title="Análisis Financiero" subtitle="Ingresos, egresos y flujos de caja" />

            <DashboardFilters dateRange={dateRange} onDateRangeChange={setDateRange} />

            <KPIContainer>
                <KPICard title="Ingresos Totales" value={formatCurrency(stats.totalIncome)} color="success" />
                <KPICard title="Egresos Totales" value={formatCurrency(stats.totalExpense)} color="danger" />
                <KPICard title="Resultado Neto" value={formatCurrency(stats.margin)} color={stats.margin >= 0 ? 'success' : 'danger'} />
                <KPICard title="Eficiencia (ROI)" value={(stats.totalExpense > 0 ? (stats.margin / stats.totalExpense * 100).toFixed(1) : 0) + '%'} color="primary" />
            </KPIContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenses by Category */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Egresos por Categoría</h3>
                            <p className="text-xs text-gray-400 font-medium">Distribución por rubro de gasto</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseByCategory} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: any) => formatCurrency(val)}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {expenseByCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Income Nature Pie */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Composición de Ingresos</h3>
                            <p className="text-xs text-gray-400 font-medium">Clasificación por tipo de entrada</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={incomeByNature}
                                    cx="50%" cy="50%"
                                    innerRadius={80} outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {incomeByNature.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length + 2]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: any) => formatCurrency(val)}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
