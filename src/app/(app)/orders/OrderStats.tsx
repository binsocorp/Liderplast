'use client';

import { useMemo } from 'react';
import { FileText, DollarSign, Clock, CheckCircle, Truck } from 'lucide-react';
import type { Order } from '@/lib/types/database';

interface OrderStatsProps {
    orders: Order[];
}

export function OrderStats({ orders }: OrderStatsProps) {
    const totalVentas = orders.reduce((sum, o) => sum + Number(o.total_net || 0), 0);
    const montoPendiente = orders.reduce((sum, o) => sum + (Number(o.total_net || 0) - Number(o.paid_amount || 0)), 0);

    const enViajePedidos = orders.filter((o: any) => !!o.trip_id);
    const enViajeTotal = enViajePedidos.reduce((sum: number, o: any) => sum + Number(o.total_net || 0), 0);

    const stats = [
        {
            label: 'Facturación Total',
            value: `$${totalVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
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
            value: orders.filter(o => o.status === 'CONFIRMADO').length.toString(),
            icon: <FileText className="w-5 h-5" />,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
        },
        {
            label: 'Completados',
            value: orders.filter(o => o.status === 'COMPLETADO').length.toString(),
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
    );
}
