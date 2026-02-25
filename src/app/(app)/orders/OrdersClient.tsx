'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsRow, CardContainer } from '@/components/ui/CardContainer';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/lib/types/database';

interface OrderRow extends Order {
    province?: { name: string } | null;
    trip?: { trip_code: string } | null;
    installer?: { name: string } | null;
    reseller?: { name: string } | null;
}

interface OrdersClientProps {
    orders: OrderRow[];
    provinces: { id: string; name: string }[];
    resellers: { id: string; name: string }[];
    stats: {
        totalOrders: number;
        confirmedOrders: number;
        inProductionOrders: number;
        totalRevenue: number;
    };
}

const STATUS_OPTIONS = [
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'EN_PRODUCCION', label: 'En Producción' },
    { value: 'PRODUCIDO', label: 'Producido' },
    { value: 'VIAJE_ASIGNADO', label: 'Viaje Asignado' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'CANCELADO', label: 'Cancelado' },
];

const CHANNEL_OPTIONS = [
    { value: 'INTERNO', label: 'Interno' },
    { value: 'REVENDEDOR', label: 'Revendedor' },
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    }).format(new Date(date));
}

export function OrdersClient({ orders, provinces, resellers, stats }: OrdersClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [channelFilter, setChannelFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');
    const [tripFilter, setTripFilter] = useState('');
    const [installerFilter, setInstallerFilter] = useState('');

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            if (statusFilter && order.status !== statusFilter) return false;
            if (channelFilter && order.channel !== channelFilter) return false;
            if (provinceFilter && order.province_id !== provinceFilter) return false;
            if (tripFilter === 'yes' && !order.trip_id) return false;
            if (tripFilter === 'no' && order.trip_id) return false;
            if (installerFilter === 'yes' && !order.installer_id) return false;
            if (installerFilter === 'no' && order.installer_id) return false;
            if (search) {
                const q = search.toLowerCase();
                const matchesSearch =
                    order.order_number?.toLowerCase().includes(q) ||
                    order.client_name.toLowerCase().includes(q) ||
                    order.city.toLowerCase().includes(q) ||
                    order.province?.name?.toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }
            return true;
        });
    }, [orders, statusFilter, channelFilter, provinceFilter, tripFilter, installerFilter, search]);

    const columns: Column<OrderRow>[] = [
        {
            key: 'order_number',
            label: 'N° Pedido',
            render: (row) => (
                <span className="font-medium text-gray-900">{row.order_number}</span>
            ),
        },
        {
            key: 'client_name',
            label: 'Cliente',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.client_name}</p>
                    <p className="text-xs text-gray-400">{row.city}</p>
                </div>
            ),
        },
        {
            key: 'province',
            label: 'Provincia',
            render: (row) => row.province?.name || '-',
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => <Badge status={row.status} />,
        },
        {
            key: 'channel',
            label: 'Canal',
            render: (row) => <Badge status={row.channel} />,
        },
        {
            key: 'trip',
            label: 'Viaje',
            render: (row) =>
                row.trip ? (
                    <span className="text-sm text-primary-600 font-medium">{row.trip.trip_code}</span>
                ) : (
                    <span className="text-gray-400 text-xs">Sin viaje</span>
                ),
        },
        {
            key: 'installer',
            label: 'Instalador',
            render: (row) =>
                row.installer ? (
                    <span className="text-sm">{row.installer.name}</span>
                ) : (
                    <span className="text-gray-400 text-xs">Sin asignar</span>
                ),
        },
        {
            key: 'total_net',
            label: 'Total Neto',
            render: (row) => (
                <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(row.total_net))}
                </span>
            ),
            className: 'text-right',
        },
        {
            key: 'created_at',
            label: 'Fecha',
            render: (row) => (
                <span className="text-gray-500 text-xs">{formatDate(row.created_at)}</span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Pedidos"
                subtitle={`${filteredOrders.length} pedido${filteredOrders.length !== 1 ? 's' : ''}`}
                actions={
                    <Button
                        onClick={() => router.push('/orders/new')}
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Nuevo Pedido
                    </Button>
                }
            />

            <StatsRow>
                <CardContainer
                    title="Total Pedidos"
                    value={stats.totalOrders}
                />
                <CardContainer
                    title="Confirmados"
                    value={stats.confirmedOrders}
                />
                <CardContainer
                    title="En Producción"
                    value={stats.inProductionOrders}
                />
                <CardContainer
                    title="Facturación Neta"
                    value={formatCurrency(stats.totalRevenue)}
                />
            </StatsRow>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por N°, cliente, localidad..."
            >
                <SelectFilter
                    label="Estado"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_OPTIONS}
                    allLabel="Todos los estados"
                />
                <SelectFilter
                    label="Canal"
                    value={channelFilter}
                    onChange={setChannelFilter}
                    options={CHANNEL_OPTIONS}
                    allLabel="Todos los canales"
                />
                <SelectFilter
                    label="Provincia"
                    value={provinceFilter}
                    onChange={setProvinceFilter}
                    options={provinces.map((p) => ({ value: p.id, label: p.name }))}
                    allLabel="Todas las provincias"
                />
                <SelectFilter
                    label="Viaje"
                    value={tripFilter}
                    onChange={setTripFilter}
                    options={[
                        { value: 'yes', label: 'Con viaje' },
                        { value: 'no', label: 'Sin viaje' },
                    ]}
                    allLabel="Viaje: todos"
                />
                <SelectFilter
                    label="Instalador"
                    value={installerFilter}
                    onChange={setInstallerFilter}
                    options={[
                        { value: 'yes', label: 'Con instalador' },
                        { value: 'no', label: 'Sin instalador' },
                    ]}
                    allLabel="Instalador: todos"
                />
            </FilterBar>

            <DataTable
                columns={columns}
                data={filteredOrders}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => router.push(`/orders/${row.id}`)}
                emptyMessage="No se encontraron pedidos"
            />
        </>
    );
}
