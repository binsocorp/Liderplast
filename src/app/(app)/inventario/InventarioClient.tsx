'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormSection, FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select } from '@/components/ui/FormInputs';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from './actions';

// -----------------------------------------------
// Types
// -----------------------------------------------

interface InventoryItem {
    id: string;
    name: string;
    type: 'MATERIA_PRIMA' | 'INSUMO' | 'PRODUCTO_FINAL';
    unit: string;
    purchase_unit: string | null;
    conversion_factor: number;
    current_stock: number;
    min_stock: number;
    last_cost: number;
    average_cost: number;
    is_active: boolean;
    created_at: string;
}

interface Props {
    items: InventoryItem[];
}

const TYPE_OPTIONS = [
    { value: 'MATERIA_PRIMA', label: 'Materia Prima' },
    { value: 'INSUMO', label: 'Insumo' },
    { value: 'PRODUCTO_FINAL', label: 'Producto Final' },
];

const UNIT_OPTIONS = [
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'unidad', label: 'Unidad' },
    { value: 'litro', label: 'Litros (lt)' },
    { value: 'metro', label: 'Metros (m)' },
    { value: 'rollo', label: 'Rollo' },
    { value: 'plancha', label: 'Plancha' },
    { value: 'balde', label: 'Balde' },
    { value: 'bidon', label: 'Bidón' },
];

// -----------------------------------------------
// Component
// -----------------------------------------------

export function InventarioClient({ items }: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [form, setForm] = useState({
        name: '',
        type: 'MATERIA_PRIMA' as string,
        unit: 'kg',
        purchase_unit: '' as string,
        conversion_factor: 1,
        min_stock: 0,
        last_cost: 0,
        is_active: true,
    });

    // Filter items
    const filtered = items.filter((item) => {
        if (!showInactive && !item.is_active) return false;
        if (typeFilter && item.type !== typeFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return item.name.toLowerCase().includes(q);
        }
        return true;
    });

    // Stats
    const activeItems = items.filter(i => i.is_active);
    const lowStockCount = activeItems.filter(i => i.current_stock < i.min_stock && i.min_stock > 0).length;
    const totalValue = activeItems.reduce((sum, i) => sum + (i.current_stock * (i.average_cost || i.last_cost)), 0);

    // Open modal
    function openNew() {
        setEditItem(null);
        setForm({
            name: '',
            type: 'MATERIA_PRIMA',
            unit: 'kg',
            purchase_unit: '',
            conversion_factor: 1,
            min_stock: 0,
            last_cost: 0,
            is_active: true
        });
        setError('');
        setModalOpen(true);
    }

    function openEdit(item: InventoryItem) {
        setEditItem(item);
        setForm({
            name: item.name,
            type: item.type,
            unit: item.unit,
            purchase_unit: item.purchase_unit || '',
            conversion_factor: item.conversion_factor,
            min_stock: item.min_stock,
            last_cost: item.last_cost,
            is_active: item.is_active,
        });
        setError('');
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setError('');

        try {
            const result = editItem
                ? await updateInventoryItem(editItem.id, form as any)
                : await createInventoryItem(form as any);

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

    async function handleDelete() {
        if (!editItem) return;
        if (!confirm('¿Desactivar este ítem?')) return;

        setSaving(true);
        const result = await deleteInventoryItem(editItem.id);
        if ('error' in result && result.error) {
            setError(result.error);
        } else {
            setModalOpen(false);
        }
        setSaving(false);
    }

    // Columns
    const columns: Column<InventoryItem>[] = [
        {
            key: 'name',
            label: 'Nombre',
            render: (row) => (
                <span className="font-medium text-gray-900">{row.name}</span>
            ),
        },
        {
            key: 'type',
            label: 'Tipo',
            render: (row) => <Badge status={row.type} />,
        },
        {
            key: 'unit',
            label: 'Unidad',
        },
        {
            key: 'current_stock',
            label: 'Stock actual',
            render: (row) => {
                const purchaseQty = row.purchase_unit && row.conversion_factor > 0
                    ? row.current_stock / row.conversion_factor
                    : null;

                return (
                    <div className="flex flex-col">
                        <span className="font-semibold tabular-nums">
                            {Number(row.current_stock).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {row.unit}
                        </span>
                        {purchaseQty !== null && (
                            <span className="text-xs text-gray-400">
                                ≈ {purchaseQty.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {row.purchase_unit}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'min_stock',
            label: 'Stock mínimo',
            render: (row) => (
                <span className="tabular-nums text-gray-500">
                    {Number(row.min_stock).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => {
                if (!row.is_active) return <Badge status="CANCELLED" />;
                if (row.min_stock > 0 && row.current_stock < row.min_stock) {
                    return <Badge status="STOCK_BAJO" />;
                }
                return <Badge status="STOCK_OK" />;
            },
        },
        {
            key: 'average_cost',
            label: 'Costo PPP',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="tabular-nums text-gray-900 font-medium">
                        ${Number(row.average_cost || row.last_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    {row.average_cost > 0 && row.last_cost !== row.average_cost && (
                        <span className="text-xs text-gray-400 tabular-nums">
                            último: ${Number(row.last_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Inventario"
                subtitle={`${activeItems.length} ítems · ${lowStockCount > 0 ? `⚠ ${lowStockCount} con stock bajo` : 'Stock OK'}`}
                actions={
                    <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>
                        Nuevo Ítem
                    </Button>
                }
            />

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Ítems</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeItems.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock Bajo</p>
                    <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                        {lowStockCount}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valuación Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        ${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre..."
            >
                <SelectFilter
                    label="Tipo"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={TYPE_OPTIONS}
                    allLabel="Todos los tipos"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    Mostrar inactivos
                </label>
            </FilterBar>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filtered}
                keyExtractor={(row) => row.id}
                onRowClick={openEdit}
                emptyMessage="No hay ítems de inventario"
                getRowClassName={(row) =>
                    row.is_active && row.min_stock > 0 && row.current_stock < row.min_stock
                        ? 'bg-red-50 hover:bg-red-100'
                        : ''
                }
            />

            {/* Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}
                size="md"
                footer={
                    <>
                        {editItem && (
                            <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
                                Desactivar
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : (editItem ? 'Guardar' : 'Crear')}
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {error}
                    </div>
                )}

                <FormSection title="Datos del ítem">
                    <FormGrid cols={2}>
                        <FormField label="Nombre" required>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ej: Resina Poliester"
                            />
                        </FormField>
                        <FormField label="Tipo de ítem" required>
                            <Select
                                value={form.type}
                                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                                options={TYPE_OPTIONS}
                            />
                        </FormField>
                    </FormGrid>

                    <FormGrid cols={2}>
                        <FormField label="Unidad de consumo" required>
                            <Select
                                value={form.unit}
                                onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                                options={UNIT_OPTIONS}
                            />
                        </FormField>
                        <FormField label="Unidad de compra (opcional)">
                            <Select
                                value={form.purchase_unit}
                                onChange={(e) => setForm(f => ({ ...f, purchase_unit: e.target.value }))}
                                options={[
                                    { value: '', label: 'Igual que consumo' },
                                    ...UNIT_OPTIONS,
                                    { value: 'bolsa', label: 'Bolsa' },
                                    { value: 'bidon', label: 'Bidón' },
                                    { value: 'rollo', label: 'Rollo' },
                                    { value: 'caja', label: 'Caja' },
                                ]}
                            />
                        </FormField>
                    </FormGrid>

                    <FormGrid cols={2}>
                        <FormField label={form.purchase_unit ? `Factor (1 ${form.purchase_unit} = X ${form.unit})` : 'Factor de conversión'}>
                            <Input
                                type="number"
                                value={form.conversion_factor}
                                onChange={(e) => setForm(f => ({ ...f, conversion_factor: Number(e.target.value) }))}
                                min={0.0001}
                                step="0.0001"
                                disabled={!form.purchase_unit}
                            />
                        </FormField>
                        <FormField label="Stock mínimo (alerta)">
                            <Input
                                type="number"
                                value={form.min_stock}
                                onChange={(e) => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))}
                                min={0}
                                step="0.01"
                            />
                        </FormField>
                    </FormGrid>

                    <FormGrid cols={2}>
                        <FormField label="Costo ref. (por consumo)">
                            <Input
                                type="number"
                                value={form.last_cost}
                                onChange={(e) => setForm(f => ({ ...f, last_cost: Number(e.target.value) }))}
                                min={0}
                                step="0.01"
                            />
                        </FormField>
                        {editItem && (
                            <FormField label="Estado">
                                <Select
                                    value={form.is_active ? 'true' : 'false'}
                                    onChange={(e) => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                                    options={[
                                        { value: 'true', label: 'Activo' },
                                        { value: 'false', label: 'Inactivo' },
                                    ]}
                                />
                            </FormField>
                        )}
                    </FormGrid>
                </FormSection>
            </Modal>
        </>
    );
}
