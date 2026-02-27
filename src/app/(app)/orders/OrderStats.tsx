'use client';

import { useMemo, useState } from 'react';
import type { Order } from '@/lib/types/database';

interface OrderStatsProps {
    orders: Order[];
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function OrderStats({ orders }: OrderStatsProps) {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    // Get available years from data
    const availableYears = useMemo(() => {
        const years = new Set(orders.map(o => new Date(o.created_at).getFullYear()));
        years.add(now.getFullYear());
        return Array.from(years).sort((a, b) => b - a);
    }, [orders]);

    // Filter orders for selected month
    const monthOrders = useMemo(() => {
        return orders.filter(o => {
            const d = new Date(o.created_at);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });
    }, [orders, selectedMonth, selectedYear]);

    const totalPedidos = monthOrders.length;
    const montoTotal = monthOrders.reduce((sum, o) => sum + Number(o.total_net || 0), 0);
    const pendientes = monthOrders.filter(o => o.payment_status === 'PENDING' || o.payment_status === 'UNPAID').length;
    const pagados = monthOrders.filter(o => o.payment_status === 'PAID').length;

    const stats = [
        {
            label: 'Total Pedidos',
            value: totalPedidos.toString(),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            iconBg: 'bg-primary-100',
            iconColor: 'text-primary-600',
        },
        {
            label: 'Monto Total',
            value: `$${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-success-100',
            iconColor: 'text-success-600',
        },
        {
            label: 'Pendientes',
            value: pendientes.toString(),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-warning-100',
            iconColor: 'text-warning-600',
        },
        {
            label: 'Pagados',
            value: pagados.toString(),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: 'bg-success-100',
            iconColor: 'text-success-600',
        },
    ];

    return (
        <div className="space-y-4">
            {/* Selector de mes */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-1 py-1 shadow-sm">
                    <button
                        onClick={() => {
                            if (selectedMonth === 0) {
                                setSelectedMonth(11);
                                setSelectedYear(y => y - 1);
                            } else {
                                setSelectedMonth(m => m - 1);
                            }
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-800 min-w-[140px] text-center">
                        {MONTH_NAMES[selectedMonth]} {selectedYear}
                    </span>
                    <button
                        onClick={() => {
                            if (selectedMonth === 11) {
                                setSelectedMonth(0);
                                setSelectedYear(y => y + 1);
                            } else {
                                setSelectedMonth(m => m + 1);
                            }
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[13px] font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
