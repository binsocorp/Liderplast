'use client';

import { useMemo, useState } from 'react';
import { FileText, DollarSign, Clock, CheckCircle, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
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

    const totalVentasMes = monthOrders.reduce((sum, o) => sum + Number(o.total_net || 0), 0);
    const montoPendiente = monthOrders.reduce((sum, o) => sum + (Number(o.total_net || 0) - Number(o.paid_amount || 0)), 0);

    // PED-01: monto total de pedidos con viaje asignado (trip_id no vacío)
    const enViajePedidos = orders.filter((o: any) => !!o.trip_id);
    const enViajeTotal = enViajePedidos.reduce((sum: number, o: any) => sum + Number(o.total_net || 0), 0);

    const stats = [
        {
            label: 'Facturación Potencial',
            value: `$${totalVentasMes.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
            icon: <DollarSign className="w-6 h-6" />,
            iconBg: 'bg-primary-100',
            iconColor: 'text-primary-600',
        },
        {
            label: 'Saldo por Cobrar',
            value: `$${montoPendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
            icon: <Clock className="w-6 h-6" />,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
        },
        {
            label: 'Confirmados',
            value: monthOrders.filter(o => o.status === 'CONFIRMADO').length.toString(),
            icon: <FileText className="w-5 h-5" />,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
        },
        {
            label: 'Completados',
            value: monthOrders.filter(o => o.status === 'COMPLETADO').length.toString(),
            icon: <CheckCircle className="w-5 h-5" />,
            iconBg: 'bg-success-100',
            iconColor: 'text-success-600',
        },
        {
            label: `En Viaje (${enViajePedidos.length})`,
            value: `$${enViajeTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
            icon: <Truck className="w-5 h-5" />,
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600',
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
                        <ChevronLeft className="w-4 h-4" />
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
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
