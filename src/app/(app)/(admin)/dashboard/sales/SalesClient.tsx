'use client';

import React, { useMemo, useState } from 'react';
import { KPICard, KPIContainer } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function SalesClient({
    orders,
    sellers,
    provinces,
    catalogItems
}: any) {
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(val);
    };

    const filteredOrders = useMemo(() => {
        const dFrom = new Date(dateRange.from);
        const dTo = new Date(dateRange.to);
        dTo.setHours(23, 59, 59);

        return orders.filter((o: any) => {
            const d = new Date(o.created_at);
            return d >= dFrom && d <= dTo;
        });
    }, [orders, dateRange]);

    const salesBySeller = useMemo(() => {
        const map = new Map();
        filteredOrders.forEach((o: any) => {
            const name = o.seller?.name || 'Vendedor Directo';
            map.set(name, (map.get(name) || 0) + Number(o.total_net));
        });
        return Array.from(map, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredOrders]);

    const salesByProvince = useMemo(() => {
        const map = new Map();
        filteredOrders.forEach((o: any) => {
            const name = o.province?.name || 'Otros';
            map.set(name, (map.get(name) || 0) + Number(o.total_net));
        });
        return Array.from(map, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredOrders]);

    return (
        <div className="pb-10">
            <PageHeader title="Ventas y Geografía" subtitle="Desempeño comercial por zona y vendedor" />

            <DashboardFilters dateRange={dateRange} onDateRangeChange={setDateRange} />

            <KPIContainer>
                <KPICard title="Ventas Netas" value={formatCurrency(filteredOrders.reduce((s: any, o: any) => s + Number(o.total_net), 0))} color="primary" />
                <KPICard title="Cant. Pedidos" value={filteredOrders.length} color="info" />
                <KPICard title="Mejor Vendedor" value={salesBySeller[0]?.name || '-'} color="success" />
                <KPICard title="Zona Líder" value={salesByProvince[0]?.name || '-'} color="warning" />
            </KPIContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-6">Ranking por Vendedor</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesBySeller}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                                <YAxis hide />
                                <RechartsTooltip formatter={(val: any) => formatCurrency(val)} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {salesBySeller.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-6">Distribución por Provincia</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={salesByProvince}
                                    cx="50%" cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {salesByProvince.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(val: any) => formatCurrency(val)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
