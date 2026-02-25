'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Textarea } from '@/components/ui/FormInputs';
import { createTrip } from './actions';
import type { Trip } from '@/lib/types/database';

interface FletesClientProps {
    trips: (Trip & { truck_type: { name: string; capacity: number } | null })[];
    truckTypes: any[];
    orders: {
        id: string;
        order_number: string;
        client_name: string;
        trip_id: string | null;
        province: { name: string } | null;
    }[];
}

export function FletesClient({ trips, orders, truckTypes }: FletesClientProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [truckTypeId, setTruckTypeId] = useState('');
    const [cost, setCost] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        setError(null);
        setLoading(true);
        try {
            const result = await createTrip({
                truck_type_id: truckTypeId || null,
                cost,
                destination,
                date: date || null,
                description,
                notes,
                status: 'PENDIENTE',
            });
            if (result.error) {
                setError(result.error);
            } else {
                setShowModal(false);
                setDestination('');
                setDate('');
                setDescription('');
                setNotes('');
                setTruckTypeId('');
                setCost(0);
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Error al crear el flete');
        } finally {
            setLoading(false);
        }
    }

    const columns: Column<Trip>[] = [
        {
            key: 'trip_code',
            label: 'Código',
            render: (row) => <span className="font-semibold text-primary-600">{row.trip_code}</span>,
        },
        { key: 'destination', label: 'Destino' },
        {
            key: 'date',
            label: 'Fecha',
            render: (row) =>
                row.date
                    ? new Intl.DateTimeFormat('es-AR').format(new Date(row.date))
                    : '-',
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => <Badge status={row.status} />,
        },
        {
            key: 'truck_type',
            label: 'Tipo de Camión',
            render: (row: any) => row.truck_type ? row.truck_type.name : '-',
        },
        {
            key: 'orders',
            label: 'Capacidad (Ctd. Piletas)',
            render: (row: any) => {
                const tripOrders = orders.filter((o) => o.trip_id === row.id);
                const capacity = row.truck_type ? row.truck_type.capacity : 0;
                const isFull = capacity > 0 && tripOrders.length >= capacity;
                return (
                    <span className={`text-sm font-medium ${isFull ? 'text-danger-600' : 'text-gray-600'}`}>
                        {tripOrders.length} {capacity > 0 ? `/ ${capacity}` : ''}
                    </span>
                );
            },
        },
        {
            key: 'cost',
            label: 'Costo',
            render: (row: any) => row.cost ? `$${row.cost.toLocaleString('es-AR')}` : '-',
        },
        {
            key: '_actions',
            label: '',
            render: (row) => (
                <Button size="sm" variant="secondary" onClick={() => router.push(`/fletes/${row.id}`)}>
                    Gestionar Pedidos
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Fletes"
                subtitle={`${trips.length} flete${trips.length !== 1 ? 's' : ''}`}
                actions={
                    <Button onClick={() => setShowModal(true)}>
                        + Nuevo Flete
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={trips}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay fletes registrados"
            />

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Nuevo Flete"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={loading}>{loading ? 'Creando...' : 'Crear Flete'}</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {error && (
                        <div className="bg-danger-50 text-danger-600 p-3 rounded-lg text-sm border border-danger-100 font-medium">
                            {error}
                        </div>
                    )}
                    <FormGrid>
                        <FormField label="Destino" required>
                            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destino" />
                        </FormField>
                        <FormField label="Fecha">
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </FormField>
                        <FormField label="Tipo de Camión">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                value={truckTypeId}
                                onChange={(e) => setTruckTypeId(e.target.value)}
                            >
                                <option value="">Seleccionar camión...</option>
                                {truckTypes.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name} (Capacidad: {t.capacity})</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Costo ($)">
                            <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} min={0} />
                        </FormField>
                    </FormGrid>
                    <FormField label="Descripción">
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve" />
                    </FormField>
                    <FormField label="Notas">
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
                    </FormField>
                </div>
            </Modal>
        </>
    );
}
