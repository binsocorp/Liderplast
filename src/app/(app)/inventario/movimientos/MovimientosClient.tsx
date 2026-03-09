'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormSection, FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select, Textarea } from '@/components/ui/FormInputs';
import { createMovement } from './actions';

// -----------------------------------------------
// Types
// -----------------------------------------------

interface Movement {
    id: string;
    item_id: string;
    type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    quantity: number;
    description: string;
    reference: string;
    created_by: string;
    created_at: string;
    item: { name: string; unit: string } | null;
}

interface InventoryItemLookup {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
}

interface Props {
    movements: Movement[];
    items: InventoryItemLookup[];
}

const TYPE_OPTIONS = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
    { value: 'AJUSTE', label: 'Ajuste' },
];

// -----------------------------------------------
// Component
// -----------------------------------------------

export function MovimientosClient({ movements, items }: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        item_id: '',
        type: 'ENTRADA' as string,
        quantity: 0,
        description: '',
        reference: '',
    });

    // Filter
    const filtered = movements.filter((mov) => {
        if (typeFilter && mov.type !== typeFilter) return false;
        if (dateFrom) {
            const movDate = new Date(mov.created_at).toISOString().split('T')[0];
            if (movDate < dateFrom) return false;
        }
        if (dateTo) {
            const movDate = new Date(mov.created_at).toISOString().split('T')[0];
            if (movDate > dateTo) return false;
        }
        if (search) {
            const q = search.toLowerCase();
            const itemName = mov.item?.name?.toLowerCase() || '';
            return itemName.includes(q) || mov.description?.toLowerCase().includes(q) || mov.reference?.toLowerCase().includes(q);
        }
        return true;
    });

    function openNew() {
        setForm({ item_id: '', type: 'ENTRADA', quantity: 0, description: '', reference: '' });
        setError('');
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setError('');

        try {
            const result = await createMovement(form as any);
            if ('error' in result && result.error) {
                setError(result.error);
            } else {
                setModalOpen(false);
            }
        } catch {
            setError('Error inesperado');
        } finally {
            setSaving(false);
        }
    }

    // Selected item info
    const selectedItem = items.find(i => i.id === form.item_id);

    const columns: Column<Movement>[] = [
        {
            key: 'created_at',
            label: 'Fecha',
            render: (row) => (
                <span className="tabular-nums text-gray-600">
                    {new Date(row.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            key: 'item',
            label: 'Ítem',
            render: (row) => (
                <span className="font-medium text-gray-900">
                    {row.item?.name || '—'}
                </span>
            ),
        },
        {
            key: 'type',
            label: 'Tipo',
            render: (row) => <Badge status={row.type} />,
        },
        {
            key: 'quantity',
            label: 'Cantidad',
            render: (row) => {
                const prefix = row.type === 'ENTRADA' ? '+' : row.type === 'SALIDA' ? '-' : '=';
                const color = row.type === 'ENTRADA' ? 'text-success-600' : row.type === 'SALIDA' ? 'text-danger-600' : 'text-purple-600';
                return (
                    <span className={`font-semibold tabular-nums ${color}`}>
                        {prefix}{Number(row.quantity).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        {row.item?.unit ? ` ${row.item.unit}` : ''}
                    </span>
                );
            },
        },
        {
            key: 'description',
            label: 'Descripción',
            render: (row) => (
                <span className="text-gray-600">{row.description || '—'}</span>
            ),
        },
        {
            key: 'reference',
            label: 'Referencia',
            render: (row) => (
                <span className="text-gray-500 text-xs">{row.reference || '—'}</span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Movimientos de Inventario"
                subtitle={`${movements.length} movimientos registrados`}
                backHref="/inventario"
                actions={
                    <Button onClick={openNew} icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Nuevo Movimiento
                    </Button>
                }
            />

            {/* Filters */}
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por ítem, descripción..."
            >
                <SelectFilter
                    label="Tipo"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={TYPE_OPTIONS}
                    allLabel="Todos los tipos"
                />
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        uiSize="sm"
                        className="w-auto"
                        placeholder="Desde"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        uiSize="sm"
                        className="w-auto"
                        placeholder="Hasta"
                    />
                </div>
            </FilterBar>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filtered}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay movimientos registrados"
            />

            {/* New Movement Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nuevo Movimiento"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !form.item_id}>
                            {saving ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {error}
                    </div>
                )}

                <FormSection title="Datos del movimiento">
                    <FormGrid cols={2}>
                        <FormField label="Ítem" required>
                            <Select
                                value={form.item_id}
                                onChange={(e) => setForm(f => ({ ...f, item_id: e.target.value }))}
                                options={items.map(i => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                                placeholder="Seleccionar ítem..."
                            />
                        </FormField>
                        <FormField label="Tipo de movimiento" required>
                            <Select
                                value={form.type}
                                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                                options={TYPE_OPTIONS}
                            />
                        </FormField>
                    </FormGrid>

                    {selectedItem && (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            Stock actual de <strong>{selectedItem.name}</strong>:{' '}
                            <span className="font-semibold">{Number(selectedItem.current_stock).toLocaleString('es-AR')} {selectedItem.unit}</span>
                        </div>
                    )}

                    <FormField label="Cantidad" required>
                        <Input
                            type="number"
                            value={form.quantity || ''}
                            onChange={(e) => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                            min={0.01}
                            step="0.01"
                            placeholder="0"
                        />
                    </FormField>
                    <FormField label="Descripción / Motivo">
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Ej: Ingreso por compra, ajuste de inventario..."
                            rows={2}
                        />
                    </FormField>
                    <FormField label="Referencia (opcional)">
                        <Input
                            value={form.reference}
                            onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))}
                            placeholder="Ej: Factura A-0001-00012345"
                        />
                    </FormField>
                </FormSection>
            </Modal>
        </>
    );
}
