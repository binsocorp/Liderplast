'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Map, Play, Flag } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Textarea, Select } from '@/components/ui/FormInputs';
import { createTrip, updateTrip, deleteTrip } from './actions';
import { assignOrderToTrip, removeOrderFromTrip, updateTripStatus } from './[id]/actions';
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
    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    // Form State
    const [provinceId, setProvinceId] = useState('');
    const [exactAddress, setExactAddress] = useState('');
    const [tripDate, setTripDate] = useState('');
    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [cost, setCost] = useState(0);
    const [actualCost, setActualCost] = useState(0);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    // UI State
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');

    const selectedVehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicleId, vehicles]);

    // Statistics
    const stats = useMemo(() => {
        const totalTrips = trips.length;
        const totalBudgeted = trips.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
        const totalActual = trips.reduce((acc, t) => acc + (Number((t as any).actual_cost) || 0), 0);
        return { totalTrips, totalBudgeted, totalActual, profit: totalBudgeted - totalActual };
    }, [trips]);

    // Edit mode computed values
    const editingTrip = useMemo(
        () => editingTripId ? trips.find(t => t.id === editingTripId) || null : null,
        [editingTripId, trips]
    );
    const editingTripOrders = useMemo(
        () => editingTripId ? tripOrders.filter(to => to.trip_id === editingTripId) : [],
        [editingTripId, tripOrders]
    );
    const editingTripIsFull = useMemo(() => {
        const cap = editingTrip?.vehicle?.capacity || 0;
        return cap > 0 && editingTripOrders.length >= cap;
    }, [editingTrip, editingTripOrders]);

    // Filtered available orders by search
    const filteredAvailable = useMemo(() => {
        return availableOrders.filter(o => {
            const matchSearch =
                (o.order_number?.toLowerCase() || '').includes(orderSearch.toLowerCase()) ||
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

    useEffect(() => {
        setCost(totalBudgetedCost);
    }, [totalBudgetedCost]);

    async function handleSave() {
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
                status: editingTripId ? undefined : 'PLANIFICADO',
                order_ids: editingTripId ? undefined : selectedOrderIds,
            };

            let result;
            if (editingTripId) {
                const updateData = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined));
                result = await updateTrip(editingTripId, updateData as any);
            } else {
                result = await createTrip(formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                setShowModal(false);
                setEditingTripId(null);
                resetForm();
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar el flete');
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(trip: ExtendedTrip) {
        setEditingTripId(trip.id);
        setProvinceId(trip.province_id || '');
        setExactAddress(trip.exact_address || '');
        setTripDate(trip.trip_date || '');
        setDriverId(trip.driver_id || '');
        setVehicleId(trip.vehicle_id || '');
        setCost(Number(trip.cost) || 0);
        setActualCost(Number((trip as any).actual_cost) || 0);
        setDescription(trip.description || '');
        setNotes(trip.notes || '');
        setSelectedOrderIds([]);
        setOrderSearch('');
        setError(null);
        setShowModal(true);
    }

    function resetForm() {
        setEditingTripId(null);
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
        setError(null);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este flete? Los pedidos asociados volverán a estar disponibles.')) return;
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

    async function handleAssign(orderId: string) {
        if (!editingTripId) return;
        setError(null);
        const result = await assignOrderToTrip(orderId, editingTripId);
        if (result.error) setError(result.error);
        else router.refresh();
    }

    async function handleRemove(orderId: string) {
        if (!editingTripId) return;
        setError(null);
        const result = await removeOrderFromTrip(orderId, editingTripId);
        if (result.error) setError(result.error);
        else router.refresh();
    }

    async function handleStatusChange(newStatus: string, tripId?: string) {
        const id = tripId ?? editingTripId;
        if (!id) return;
        setError(null);
        setLoading(true);
        const result = await updateTripStatus(id, newStatus);
        setLoading(false);
        if (result.error) setError(result.error);
        else router.refresh();
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
            render: (row) => {
                if (!row.trip_date) return '-';
                const [year, month, day] = row.trip_date.split('-').map(Number);
                return new Intl.DateTimeFormat('es-AR').format(new Date(year, month - 1, day));
            },
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
            key: 'profit',
            label: 'Ganancia',
            render: (row) => {
                const profit = (Number(row.cost) || 0) - (Number(row.actual_cost) || 0);
                return (
                    <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-danger-600'}`}>
                        ${profit.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </span>
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
                <div className="flex items-center gap-1 justify-end">
                    {row.status === 'PLANIFICADO' && (
                        <button
                            title="Iniciar Viaje"
                            onClick={() => handleStatusChange('EN_RUTA', row.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Iniciar
                        </button>
                    )}
                    {row.status === 'EN_RUTA' && (
                        <button
                            title="Finalizar Viaje"
                            onClick={() => handleStatusChange('ENTREGADO', row.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            Finalizar
                        </button>
                    )}
                    <button
                        title="Descargar hoja de ruta"
                        onClick={() => window.open(`/fletes/${row.id}/hoja-ruta`, '_blank')}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        <Map className="w-4 h-4" />
                    </button>
                    <button
                        title="Editar / Gestionar flete"
                        onClick={() => handleEdit(row)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        title="Eliminar flete"
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Gestión de Fletes"
                subtitle={`${trips.length} fletes registrados`}
                actions={
                    <Button onClick={() => { resetForm(); setShowModal(true); }}>+ Nuevo Flete</Button>
                }
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Viajes</p>
                    <p className="text-2xl font-black text-indigo-950">{stats.totalTrips}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase italic opacity-50">Todos los fletes</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Presupuestado</p>
                    <p className="text-2xl font-black text-amber-600">${stats.totalBudgeted.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase italic opacity-50">Suma de costos teóricos</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Real Pagado</p>
                    <p className="text-2xl font-black text-primary-600">${stats.totalActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-primary-500 font-bold mt-1 uppercase italic opacity-50">Monto total abonado</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ganancia por Flete</p>
                    <p className={`text-2xl font-black ${stats.profit >= 0 ? 'text-green-600' : 'text-danger-600'}`}>
                        ${stats.profit.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase italic opacity-50">Diferencia Presup./Real</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={trips}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay fletes registrados para este periodo"
            />

            <Modal
                open={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editingTripId ? `Editar / Gestionar — ${editingTrip?.trip_code || ''}` : 'Nuevo Flete'}
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={loading}>
                            Cerrar
                        </Button>
                        <Button onClick={handleSave} disabled={loading || (!editingTripId && selectedOrderIds.length === 0)}>
                            {loading ? 'Guardando...' : editingTripId ? 'Guardar Datos del Flete' : 'Crear Flete'}
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
                        {/* ── Columna izquierda: Datos del Viaje ── */}
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
                                        <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} min={0} className="bg-gray-50 font-bold text-primary-700" />
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

                        {/* ── Columna derecha: Pedidos ── */}
                        {!editingTripId ? (
                            /* CREACIÓN: selector de pedidos */
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 border-b pb-2 uppercase tracking-wider flex justify-between">
                                    Pedidos del Viaje
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedOrderIds.length > 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {selectedOrderIds.length} seleccionados
                                    </span>
                                </h3>
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
                                    <div className="flex-1 overflow-y-auto p-2 bg-gray-50 border-b">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-1">Disponibles</p>
                                        {filteredAvailable.length === 0 ? (
                                            <p className="text-xs text-center py-4 text-gray-400 italic">No se encontraron pedidos disponibles</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {filteredAvailable.map(order => (
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
                                                        </div>
                                                        <p className="font-bold text-gray-900">${(order.freight_amount || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-1/3 overflow-y-auto p-2 bg-white">
                                        <p className="text-[10px] font-bold text-primary-400 uppercase mb-2 px-1">Seleccionados ({selectedOrderIds.length})</p>
                                        {selectedOrders.length === 0 ? (
                                            <p className="text-xs text-center py-4 text-gray-400">Ningún pedido seleccionado</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {selectedOrders.map(order => (
                                                    <div key={order.id} className="flex items-center justify-between p-1.5 rounded bg-primary-50 border border-primary-200 text-xs">
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
                        ) : (
                            /* EDICIÓN: gestión del viaje */
                            <div className="space-y-4">
                                {/* Estado y acciones */}
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Gestionar Viaje</h3>
                                    <Badge status={editingTrip?.status} />
                                </div>

                                {editingTrip?.status === 'PLANIFICADO' && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleStatusChange('EN_RUTA')}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        Iniciar Viaje
                                    </Button>
                                )}
                                {editingTrip?.status === 'EN_RUTA' && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleStatusChange('ENTREGADO')}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        Finalizar Viaje
                                    </Button>
                                )}

                                {/* Pedidos cargados */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Pedidos Cargados
                                        </p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${editingTripIsFull ? 'bg-danger-100 text-danger-700' : 'bg-primary-100 text-primary-700'}`}>
                                            {editingTripOrders.length}
                                            {editingTrip?.vehicle?.capacity ? ` / ${editingTrip.vehicle.capacity}` : ''}
                                        </span>
                                    </div>
                                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                                        {editingTripOrders.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-3">Sin pedidos asignados</p>
                                        ) : (
                                            editingTripOrders.map(to => (
                                                <div key={to.id} className="flex items-center justify-between p-2 bg-primary-50 border border-primary-100 rounded text-xs">
                                                    <div>
                                                        <span className="font-bold text-primary-800">#{to.order?.order_number}</span>
                                                        <span className="ml-2 text-gray-600">{to.order?.client_name}</span>
                                                    </div>
                                                    {editingTrip?.status !== 'ENTREGADO' && (
                                                        <button
                                                            onClick={() => handleRemove(to.order?.id ?? '')}
                                                            className="p-0.5 text-danger-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                                                            title="Quitar pedido"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Agregar pedidos (solo si no está entregado) */}
                                {editingTrip?.status !== 'ENTREGADO' && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            Agregar Pedidos
                                        </p>
                                        <div className="relative mb-2">
                                            <Input
                                                className="pl-9 text-xs"
                                                placeholder="Buscar por nº o cliente..."
                                                value={orderSearch}
                                                onChange={(e) => setOrderSearch(e.target.value)}
                                            />
                                            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-gray-50">
                                            {filteredAvailable.length === 0 ? (
                                                <p className="text-xs text-center text-gray-400 py-3 italic">No hay pedidos disponibles</p>
                                            ) : (
                                                filteredAvailable.map(order => (
                                                    <div key={order.id} className="flex items-center justify-between p-2 bg-white border rounded text-xs hover:border-primary-200 transition-colors">
                                                        <div>
                                                            <span className="font-bold text-primary-700">#{order.order_number}</span>
                                                            <span className="ml-2 text-gray-600 truncate">{order.client_name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAssign(order.id)}
                                                            disabled={editingTripIsFull}
                                                            className="text-xs font-bold text-primary-600 hover:text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-0.5 bg-primary-50 hover:bg-primary-100 rounded transition-colors"
                                                        >
                                                            + Agregar
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {editingTripIsFull && (
                                            <p className="text-[10px] text-danger-600 font-bold mt-1">Vehículo al máximo de capacidad.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
