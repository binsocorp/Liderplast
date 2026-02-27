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
    // status removed
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
    const capacity = trip.vehicle?.capacity || 0;
    const isFull = capacity > 0 && assignedOrders.length >= capacity;
    const remainingCapacity = capacity > 0 ? Math.max(0, capacity - assignedOrders.length) : 0;

    async function handleAssign(orderId: string) {
        if (isFull) return alert('El flete ya alcanzó su capacidad máxima.');
        const result = await assignOrderToTrip(orderId, trip.id);
        if (result.error) alert(result.error);
        router.refresh();
    }

    async function handleRemove(orderId: string) {
        const result = await removeOrderFromTrip(orderId, trip.id);
        if (result.error) alert(result.error);
        router.refresh();
    }

    async function handleStatusChange(newStatus: string) {
        const result = await updateTripStatus(trip.id, newStatus);
        if (result.error) alert(result.error);
        router.refresh();
    }

    const orderColumns: Column<OrderSummary>[] = [
        { key: 'order_number', label: 'Nº Pedido', render: (r) => <span className="font-semibold text-primary-600">#{r.order_number}</span> },
        { key: 'client_name', label: 'Cliente' },
        { key: 'location', label: 'Destino', render: (r) => `${r.city || ''}${r.city && r.province ? ', ' : ''}${r.province?.name || ''}` },
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
                subtitle={`Destino: ${trip.exact_address} (${trip.province?.name || ''})`}
                actions={
                    <div className="flex gap-2">
                        {trip.status === 'PLANIFICADO' && (
                            <Button onClick={() => handleStatusChange('EN_RUTA')}>Iniciar Viaje</Button>
                        )}
                        {trip.status === 'EN_RUTA' && (
                            <Button onClick={() => handleStatusChange('ENTREGADO')} variant="secondary">Marcar Entregado</Button>
                        )}
                        <Badge status={trip.status} />
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <CardContainer title="Vehículo" value={trip.vehicle?.name || 'No especificado'} />
                <CardContainer title="Fletero" value={trip.driver?.name || 'No especificado'} />
                <CardContainer title="Capacidad" value={`${assignedOrders.length} / ${capacity || '∞'} unidades`} />
                <CardContainer title="Espacio Libre" value={capacity > 0 ? `${remainingCapacity} unidades` : 'Ilimitado'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardContainer title="Fecha de Viaje" value={trip.trip_date ? new Intl.DateTimeFormat('es-AR').format(new Date(trip.trip_date)) : '-'} />
                <CardContainer title="Costo" value={trip.cost ? `$${trip.cost.toLocaleString('es-AR')}` : '-'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Pedidos Cargados</h2>
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
                        <span className="text-sm text-gray-500">{availableOrders.length} disponibles en {trip.province?.name}</span>
                    </div>
                    <div className="p-0">
                        <DataTable
                            columns={availableColumns}
                            data={availableOrders}
                            keyExtractor={(r) => r.id}
                            emptyMessage="No hay más pedidos disponibles en esta provincia."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
