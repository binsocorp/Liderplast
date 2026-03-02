'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Textarea, Select } from '@/components/ui/FormInputs';
import { createTrip, deleteTrip } from './actions';
import type { Trip, Driver, Vehicle, Province, TripOrder } from '@/lib/types/database';

interface ExtendedTrip extends Trip {
    vehicle: { name: string; capacity: number } | null;
    driver: { name: string } | null;
    province: { name: string } | null;
}

interface FletesClientProps {
    trips: ExtendedTrip[];
    tripOrders: (TripOrder & { order: { id: string, order_number: string, client_name: string, freight_amount?: number, order_items?: any[] } })[];
    drivers: Driver[];
    vehicles: Vehicle[];
    provinces: Province[];
    availableOrders: any[];
}

export function FletesClient({ trips, tripOrders, drivers, vehicles, provinces, availableOrders }: FletesClientProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    // Form State
    const [provinceId, setProvinceId] = useState('');
    const [exactAddress, setExactAddress] = useState('');
    const [tripDate, setTripDate] = useState('');
    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [cost, setCost] = useState(0); // Costo Presupuestado
    const [actualCost, setActualCost] = useState(0);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    // UI State
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');

    const selectedVehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicleId, vehicles]);

    // Statistics and filtering
    const filteredTrips = useMemo(() => {
        return trips.filter(t => t.trip_date?.startsWith(selectedMonth));
    }, [trips, selectedMonth]);

    const stats = useMemo(() => {
        const totalTrips = filteredTrips.length;
        const totalBudgeted = filteredTrips.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
        const totalActual = filteredTrips.reduce((acc, t) => acc + (Number((t as any).actual_cost) || 0), 0);
        return {
            totalTrips,
            totalBudgeted,
            totalActual,
            profit: totalBudgeted - totalActual
        };
    }, [filteredTrips]);

    // Filtered available orders by search (removing province filter as requested)
    const filteredAvailable = useMemo(() => {
        return availableOrders.filter(o => {
            const matchSearch = (o.order_number?.toLowerCase() || '').includes(orderSearch.toLowerCase()) ||
                (o.client_name?.toLowerCase() || '').includes(orderSearch.toLowerCase());
            return matchSearch && !selectedOrderIds.includes(o.id);
        });
    }, [availableOrders, orderSearch, selectedOrderIds]);

    const selectedOrders = useMemo(() => {
        return availableOrders.filter(o => selectedOrderIds.includes(o.id));
    }, [availableOrders, selectedOrderIds]);

    // Auto-calculate budgeted cost
    const totalBudgetedCost = useMemo(() => {
        return selectedOrders.reduce((acc, o) => acc + (Number(o.freight_amount) || 0), 0);
    }, [selectedOrders]);

    // Sync calculated cost to state when selections change
    useEffect(() => {
        setCost(totalBudgetedCost);
    }, [totalBudgetedCost]);

    async function handleCreate() {
        setError(null);
        setLoading(true);
        try {
            const formData = {
                province_id: provinceId,
                exact_address: exactAddress,
                trip_date: tripDate,
                driver_id: driverId,
                vehicle_id: vehicleId,
                cost,
                actual_cost: actualCost,
                description,
                notes,
                status: 'PLANIFICADO',
                order_ids: selectedOrderIds,
            };

            const result = await createTrip(formData);
            if (result.error) {
                setError(result.error);
            } else {
                setShowModal(false);
                resetForm();
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Error al crear el flete');
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setProvinceId('');
        setExactAddress('');
        setTripDate('');
        setDriverId('');
        setVehicleId('');
        setCost(0);
        setActualCost(0);
        setDescription('');
        setNotes('');
        setSelectedOrderIds([]);
        setOrderSearch('');
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Está seguro de que desea eliminar este flete? Los pedidos asociados volverán a estar disponibles.')) return;
        setLoading(true);
        try {
            await deleteTrip(id);
            router.refresh();
        } catch (err: any) {
            alert(err.message || 'Error al eliminar el flete');
        } finally {
            setLoading(false);
        }
    }

    function toggleOrder(orderId: string) {
        setSelectedOrderIds(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    }

    const columns: Column<any>[] = [
        {
            key: 'trip_code',
            label: 'ID / Nº',
            render: (row) => <span className="font-semibold text-primary-600">{row.trip_code}</span>,
        },
        {
            key: 'trip_date',
            label: 'Fecha',
            render: (row) => row.trip_date ? new Intl.DateTimeFormat('es-AR').format(new Date(row.trip_date)) : '-',
        },
        {
            key: 'province',
            label: 'Provincia Destino',
            render: (row) => row.province?.name || '-',
        },
        {
            key: 'driver',
            label: 'Conductor',
            render: (row) => row.driver?.name || '-',
        },
        {
            key: 'vehicle',
            label: 'Vehículo',
            render: (row) => row.vehicle?.name || '-',
        },
        {
            key: 'orders_count',
            label: 'Pedidos',
            render: (row) => {
                const count = tripOrders.filter(to => to.trip_id === row.id).length;
                const capacity = row.vehicle?.capacity || 0;
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${capacity && count >= capacity ? 'text-danger-600' : 'text-primary-700'}`}>
                            {count} {capacity > 0 ? `/ ${capacity}` : ''}
                        </span>
                        {capacity > 0 && count >= capacity && (
                            <span className="text-[10px] bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded-full uppercase font-bold">Lleno</span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => <Badge status={row.status} />,
        },
        {
            key: '_actions',
            label: '',
            render: (row) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/fletes/${row.id}`)}>
                        Ver/Editar Projecto
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ];

    const formatExtra = (order: any) => {
        const item = order.order_items?.[0];
        if (!item) return null;
        const colorMatch = item.description?.match(/\(Color:\s*(.*?)\)/);
        const model = item.description?.split(' ')[0] || '';
        const color = colorMatch ? colorMatch[1] : '';
        return { model, color };
    };

    return (
        <>
            <PageHeader
                title="Gestión de Fletes"
                subtitle={`${trips.length} fletes registrados`}
                actions={
                    <div className="flex gap-4">
                        <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white border-gray-200"
                        />
                        <Button onClick={() => setShowModal(true)}>+ Nuevo Flete</Button>
                    </div>
                }
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Viajes del Mes</p>
                    <p className="text-2xl font-black text-indigo-950">{stats.totalTrips}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase italic opacity-50">Según fecha de viaje</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Presupuestado</p>
                    <p className="text-2xl font-black text-amber-600">${stats.totalBudgeted.toLocaleString('es-AR')}</p>
                    <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase italic opacity-50">Suma de costos teóricos</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Real Pagado</p>
                    <p className="text-2xl font-black text-primary-600">${stats.totalActual.toLocaleString('es-AR')}</p>
                    <p className="text-[10px] text-primary-500 font-bold mt-1 uppercase italic opacity-50">Monto total abonado</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ganancia por Flete</p>
                    <p className={`text-2xl font-black ${stats.profit >= 0 ? 'text-green-600' : 'text-danger-600'}`}>
                        ${stats.profit.toLocaleString('es-AR')}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase italic opacity-50">Diferencia Presup./Real</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredTrips}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay fletes registrados para este periodo"
            />

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Nuevo Flete"
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={loading || selectedOrderIds.length === 0}>
                            {loading ? 'Creando...' : 'Crear Flete'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {error && (
                        <div className="bg-danger-50 text-danger-600 p-3 rounded-lg text-sm border border-danger-100 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Datos del Viaje */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wider">Datos del Viaje</h3>
                            <FormGrid cols={1}>
                                <FormField label="Provincia Destino" required>
                                    <Select
                                        options={provinces.map(p => ({ value: p.id, label: p.name }))}
                                        value={provinceId}
                                        onChange={(e) => setProvinceId(e.target.value)}
                                        placeholder="Seleccionar provincia..."
                                    />
                                </FormField>
                                <FormField label="Dirección Exacta" required>
                                    <Input value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} placeholder="Ej: Av. Siempre Viva 123" />
                                </FormField>
                                <FormField label="Fecha de Viaje" required>
                                    <Input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Conductor" required>
                                        <Select
                                            options={drivers.map(d => ({ value: d.id, label: d.name }))}
                                            value={driverId}
                                            onChange={(e) => setDriverId(e.target.value)}
                                            placeholder="Seleccionar fletero..."
                                        />
                                    </FormField>
                                    <FormField label="Vehículo" required>
                                        <Select
                                            options={vehicles.map(v => ({ value: v.id, label: v.name }))}
                                            value={vehicleId}
                                            onChange={(e) => setVehicleId(e.target.value)}
                                            placeholder="Seleccionar vehículo..."
                                        />
                                    </FormField>
                                </div>
                                {selectedVehicle && (
                                    <div className="p-2 bg-primary-50 border border-primary-100 rounded text-primary-700 text-xs flex justify-between">
                                        <span>Capacidad del vehículo:</span>
                                        <span className="font-bold">{selectedVehicle.capacity} unidades</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Costo Presup. ($)">
                                        <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} min={0} className="bg-gray-50 font-bold text-primary-700" title="Calculado automáticamente por los pedidos seleccionados" />
                                    </FormField>
                                    <FormField label="Costo Real ($)">
                                        <Input type="number" value={actualCost} onChange={(e) => setActualCost(Number(e.target.value))} min={0} />
                                    </FormField>
                                </div>
                                <FormField label="Descripción">
                                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Viaje extra" />
                                </FormField>
                                <FormField label="Notas">
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Comentarios adicionales..." />
                                </FormField>
                            </FormGrid>
                        </div>

                        {/* Pedidos Incluidos */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wider flex justify-between">
                                Pedidos del Viaje
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedOrderIds.length > 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {selectedOrderIds.length} seleccionados
                                </span>
                            </h3>

                            {/* Buscador de pedidos */}
                            <div className="relative">
                                <Input
                                    className="pl-9"
                                    placeholder="Buscar pedido por ID o cliente..."
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                />
                                <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <div className="border rounded-lg overflow-hidden flex flex-col h-[400px]">
                                {/* Lista de pedidos disponibles */}
                                <div className="flex-1 overflow-y-auto p-2 bg-gray-50 border-b">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-1">Disponibles {provinceId ? `en ${provinces.find(p => p.id === provinceId)?.name}` : '(Todas las provincias)'}</p>
                                    {filteredAvailable.length === 0 ? (
                                        <p className="text-xs text-center py-4 text-gray-400 italic">No se encontraron pedidos disponibles</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredAvailable.map(order => {
                                                const extra = formatExtra(order);
                                                return (
                                                    <div
                                                        key={order.id}
                                                        onClick={() => toggleOrder(order.id)}
                                                        className="flex items-center justify-between p-2 rounded border bg-white hover:border-primary-300 cursor-pointer text-xs"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-primary-700">#{order.order_number}</span>
                                                                <span className="text-[10px] bg-gray-100 px-1 text-gray-500 rounded font-bold uppercase">{order.province?.name}</span>
                                                            </div>
                                                            <p className="text-gray-600 truncate">{order.client_name}</p>
                                                            {extra && (
                                                                <p className="text-[10px] text-primary-600 font-bold mt-0.5 italic">
                                                                    CASCO: {extra.model} {extra.color && `- ${extra.color}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900">${(order.freight_amount || 0).toLocaleString('es-AR')}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase italic">Flete Pedido</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Lista de seleccionados */}
                                <div className="h-1/3 overflow-y-auto p-2 bg-white">
                                    <p className="text-[10px] font-bold text-primary-400 uppercase mb-2 px-1">Seleccionados ({selectedOrderIds.length})</p>
                                    {selectedOrders.length === 0 ? (
                                        <p className="text-xs text-center py-4 text-gray-400">Ningún pedido seleccionado</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {selectedOrders.map(order => (
                                                <div
                                                    key={order.id}
                                                    className="flex items-center justify-between p-1.5 rounded bg-primary-50 border border-primary-200 text-xs"
                                                >
                                                    <div>
                                                        <span className="font-bold text-primary-800">#{order.order_number}</span>
                                                        <span className="ml-2 text-primary-600 truncate">{order.client_name}</span>
                                                    </div>
                                                    <button onClick={() => toggleOrder(order.id)} className="text-danger-500 hover:text-danger-700">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
