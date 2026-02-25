'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { CardContainer } from '@/components/ui/CardContainer';
import { assignOrderToTrip, removeOrderFromTrip, updateTripStatus } from './actions';

interface OrderSummary {
    id: string;
    order_number: string;
    client_name: string;
    status: string;
    city: string;
    province: { name: string } | null;
}

interface FleteDetailClientProps {
    trip: any;
    assignedOrders: OrderSummary[];
    availableOrders: OrderSummary[];
}

export function FleteDetailClient({ trip, assignedOrders, availableOrders }: FleteDetailClientProps) {
    const router = useRouter();
    const capacity = trip.truck_type?.capacity || 0;
    const isFull = capacity > 0 && assignedOrders.length >= capacity;
    const remainingCapacity = capacity > 0 ? capacity - assignedOrders.length : 0;

    async function handleAssign(orderId: string) {
        if (isFull) return alert('El flete ya alcanzó su capacidad máxima.');
        await assignOrderToTrip(orderId, trip.id);
        router.refresh();
    }

    async function handleRemove(orderId: string) {
        await removeOrderFromTrip(orderId);
        router.refresh();
    }

    async function handleStatusChange(newStatus: string) {
        await updateTripStatus(trip.id, newStatus);
        router.refresh();
    }

    const orderColumns: Column<OrderSummary>[] = [
        { key: 'order_number', label: 'Nº Pedido', render: (r) => <span className="font-semibold text-primary-600">#{r.order_number}</span> },
        { key: 'client_name', label: 'Cliente' },
        { key: 'location', label: 'Destino', render: (r) => `${r.city}, ${r.province?.name || ''}` },
        { key: 'status', label: 'Estado', render: (r) => <Badge status={r.status} /> },
    ];

    const assignedColumns: Column<OrderSummary>[] = [
        ...orderColumns,
        {
            key: '_actions', label: '', render: (r) => (
                <Button size="sm" variant="danger" onClick={() => handleRemove(r.id)}>Remover</Button>
            )
        }
    ];

    const availableColumns: Column<OrderSummary>[] = [
        ...orderColumns,
        {
            key: '_actions', label: '', render: (r) => (
                <Button size="sm" onClick={() => handleAssign(r.id)} disabled={isFull}>Asignar</Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Flete ${trip.trip_code || ''}`}
                backHref="/fletes"
                subtitle={`Destino: ${trip.destination}`}
                actions={
                    <div className="flex gap-2">
                        {trip.status === 'PENDIENTE' && (
                            <Button onClick={() => handleStatusChange('EN_CURSO')}>Marcar En Curso</Button>
                        )}
                        {trip.status === 'EN_CURSO' && (
                            <Button onClick={() => handleStatusChange('COMPLETADO')} variant="secondary">Marcar Completado</Button>
                        )}
                        <Badge status={trip.status} />
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <CardContainer title="Tipo de Camión" value={trip.truck_type?.name || 'No especificado'} />
                <CardContainer title="Capacidad" value={`${assignedOrders.length} / ${capacity || '∞'}`} />
                <CardContainer title="Lugares Disponibles" value={capacity > 0 ? String(remainingCapacity) : 'Ilimitado'} />
                <CardContainer title="Costo" value={trip.cost ? `$${trip.cost.toLocaleString('es-AR')}` : '-'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Pedidos Asignados</h2>
                        <span className="text-sm text-gray-500">{assignedOrders.length} pedidos</span>
                    </div>
                    <div className="p-0">
                        <DataTable
                            columns={assignedColumns}
                            data={assignedOrders}
                            keyExtractor={(r) => r.id}
                            emptyMessage="No hay pedidos asignados a este flete."
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Pedidos Disponibles</h2>
                        <span className="text-sm text-gray-500">{availableOrders.length} disponibles</span>
                    </div>
                    <div className="p-0">
                        <DataTable
                            columns={availableColumns}
                            data={availableOrders}
                            keyExtractor={(r) => r.id}
                            emptyMessage="No hay pedidos producidos disponibles para asignar."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
