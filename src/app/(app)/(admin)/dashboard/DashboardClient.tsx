'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsRow, CardContainer } from '@/components/ui/CardContainer';
import { FormGrid } from '@/components/ui/FormSection';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import type { Order, OrderItem } from '@/lib/types/database';

interface OrderWithItems extends Order {
    items: Pick<OrderItem, 'type' | 'subtotal_net'>[];
}

interface DashboardClientProps {
    orders: OrderWithItems[];
}

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

function formatCurrency(value: any): string {
    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS',
        maximumFractionDigits: 0,
    }).format(numericValue);
}

export default function DashboardClient({ orders }: DashboardClientProps) {
    // 1. Overall Stats
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_net), 0);
    const totalOrders = orders.length;

    // 2. Revenue over time (monthly)
    const revenueByMonth = useMemo(() => {
        const data: Record<string, number> = {};
        orders.forEach(o => {
            const month = o.created_at.substring(0, 7); // YYYY-MM
            data[month] = (data[month] || 0) + Number(o.total_net);
        });
        return Object.entries(data)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, revenue]) => ({ month, revenue }));
    }, [orders]);

    // 3. Channel breakdown
    const channelData = useMemo(() => {
        const data: Record<string, number> = { INTERNO: 0, REVENDEDOR: 0 };
        orders.forEach(o => {
            data[o.channel] += Number(o.total_net);
        });
        return [
            { name: 'Interno', value: data.INTERNO },
            { name: 'Revendedor', value: data.REVENDEDOR },
        ];
    }, [orders]);

    // 4. Products vs Services
    const typeData = useMemo(() => {
        let products = 0;
        let services = 0;
        orders.forEach(o => {
            o.items.forEach(item => {
                if (item.type === 'PRODUCTO') products += Number(item.subtotal_net);
                if (item.type === 'SERVICIO') services += Number(item.subtotal_net);
            });
        });
        return [
            { name: 'Productos', value: products },
            { name: 'Servicios', value: services },
        ];
    }, [orders]);

    // 5. Orders by Status
    const statusData = useMemo(() => {
        const data: Record<string, number> = {};
        orders.forEach(o => {
            data[o.status] = (data[o.status] || 0) + 1;
        });
        return Object.entries(data).map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }));
    }, [orders]);

    return (
        <>
            <PageHeader title="Dashboard Analítico" />

            <StatsRow>
                <CardContainer title="Facturación Total" value={formatCurrency(totalRevenue)} />
                <CardContainer title="Cant. de Pedidos" value={totalOrders} />
                <CardContainer title="Ticket Promedio" value={totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '$0'} />
            </StatsRow>

            <div className="space-y-6">
                {/* Sales Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-6">Evolución de Facturación</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueByMonth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={10} />
                                <YAxis tickFormatter={(val) => `$${val / 1000}k`} tick={{ fontSize: 12 }} />
                                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <FormGrid>
                    {/* Channels Pie */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-6">Canales de Venta</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={channelData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {channelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Prod vs Serv Pie */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-6">Productos vs Servicios</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length + 2]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Bar Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 md:col-span-2">
                        <h3 className="text-base font-semibold text-gray-900 mb-6">Pedidos por Estado</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip />
                                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </FormGrid>
            </div>
        </>
    );
}
