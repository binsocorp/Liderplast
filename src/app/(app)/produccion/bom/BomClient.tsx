'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FormSection, FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select, Textarea } from '@/components/ui/FormInputs';
import { saveBomItem, deleteBomItem, getBomItems } from './actions';

interface BomItem {
    id: string;
    product_id: string;
    material_id: string;
    quantity_per_unit: number;
    notes: string;
    material: { name: string; unit: string; average_cost?: number; last_cost?: number };
}

interface Product {
    id: string;
    name: string;
}

interface Material {
    id: string;
    name: string;
    unit: string;
    average_cost: number;
    last_cost: number;
}

interface Props {
    products: Product[];
    materials: Material[];
}

export function BomClient({ products, materials }: Props) {
    const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? '');
    const [bomItems, setBomItems] = useState<BomItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        material_id: '',
        quantity_per_unit: 0,
        notes: '',
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ quantity_per_unit: 0, notes: '' });
    const [editSaving, setEditSaving] = useState(false);
    const quantityRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedProductId) {
            loadBom();
        } else {
            setBomItems([]);
        }
    }, [selectedProductId]);

    async function loadBom() {
        setLoading(true);
        setError('');
        const result = await getBomItems(selectedProductId);
        if ('error' in result) {
            setError(`Error al cargar BOM: ${result.error}`);
            setBomItems([]);
        } else {
            setBomItems(result.data ?? []);
        }
        setLoading(false);
    }

    async function handleSave() {
        if (!selectedProductId || !form.material_id || form.quantity_per_unit <= 0) {
            setError('Complete todos los campos requeridos');
            return;
        }

        setSaving(true);
        setError('');

        const result = await saveBomItem({
            product_id: selectedProductId,
            ...form
        });

        if ('error' in result && result.error) {
            setError(result.error);
        } else {
            setModalOpen(false);
            setForm({ material_id: '', quantity_per_unit: 0, notes: '' });
            loadBom();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Quitar este material de la BOM?')) return;

        const result = await deleteBomItem(id);
        if ('error' in result && result.error) {
            alert(result.error);
        } else {
            loadBom();
        }
    }

    function startEdit(row: BomItem) {
        setEditingId(row.id);
        setEditForm({ quantity_per_unit: row.quantity_per_unit, notes: row.notes || '' });
        setTimeout(() => quantityRef.current?.focus(), 0);
    }

    function cancelEdit() {
        setEditingId(null);
    }

    async function saveEdit(row: BomItem) {
        if (editForm.quantity_per_unit <= 0) return;
        setEditSaving(true);
        const result = await saveBomItem({
            product_id: row.product_id,
            material_id: row.material_id,
            quantity_per_unit: editForm.quantity_per_unit,
            notes: editForm.notes,
        });
        setEditSaving(false);
        if ('error' in result && result.error) {
            alert(result.error);
        } else {
            setEditingId(null);
            loadBom();
        }
    }

    const columns: Column<BomItem>[] = [
        {
            key: 'material',
            label: 'Material / Insumo',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{row.material.name}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{row.material.unit}</span>
                </div>
            )
        },
        {
            key: 'quantity_per_unit',
            label: 'Cant. por unidad prod.',
            render: (row) => {
                if (editingId === row.id) {
                    return (
                        <input
                            ref={quantityRef}
                            type="number"
                            value={editForm.quantity_per_unit || ''}
                            onChange={(e) => setEditForm(f => ({ ...f, quantity_per_unit: Number(e.target.value) }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(row);
                                if (e.key === 'Escape') cancelEdit();
                            }}
                            min={0.0001}
                            step="0.0001"
                            className="w-28 border border-primary-400 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    );
                }
                return (
                    <span className="font-semibold tabular-nums">
                        {Number(row.quantity_per_unit).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                    </span>
                );
            }
        },
        {
            key: 'cost',
            label: 'Costo est. / ud.',
            render: (row) => {
                const qty = editingId === row.id ? editForm.quantity_per_unit : row.quantity_per_unit;
                const unitCost = row.material.average_cost || row.material.last_cost || 0;
                const lineCost = unitCost * qty;
                return (
                    <span className="tabular-nums text-gray-700">
                        ${lineCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                );
            }
        },
        {
            key: 'notes',
            label: 'Notas',
            render: (row) => {
                if (editingId === row.id) {
                    return (
                        <input
                            type="text"
                            value={editForm.notes}
                            onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(row);
                                if (e.key === 'Escape') cancelEdit();
                            }}
                            placeholder="Notas opcionales..."
                            className="w-full border border-primary-400 rounded-lg px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    );
                }
                return <span className="text-gray-500 text-sm">{row.notes || '—'}</span>;
            }
        },
        {
            key: 'actions',
            label: '',
            render: (row) => {
                if (editingId === row.id) {
                    return (
                        <div className="flex justify-end gap-1">
                            <button
                                onClick={() => saveEdit(row)}
                                disabled={editSaving}
                                className="text-success-600 hover:text-success-800 p-1 rounded-lg hover:bg-success-50 transition-colors"
                                title="Guardar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Cancelar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                }
                return (
                    <div className="flex justify-end gap-1">
                        <button
                            onClick={() => startEdit(row)}
                            className="text-gray-400 hover:text-primary-600 p-1 rounded-lg hover:bg-primary-50 transition-colors"
                            title="Editar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="text-danger-500 hover:text-danger-700 p-1 rounded-lg hover:bg-danger-50 transition-colors"
                            title="Quitar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <PageHeader
                title="BOM (Lista de Materiales)"
                subtitle="Defina los materiales necesarios para fabricar cada producto final"
                actions={
                    <Button
                        onClick={() => setModalOpen(true)}
                        disabled={!selectedProductId}
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Agregar Material
                    </Button>
                }
            />

            <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
                {products.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedProductId(p.id)}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            selectedProductId === p.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {error && !modalOpen && (
                <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                    {error}
                </div>
            )}

            {selectedProductId ? (
                <>
                    <DataTable
                        columns={columns}
                        data={bomItems}
                        keyExtractor={(row) => row.id}
                        emptyMessage={loading ? 'Cargando BOM...' : 'Este producto aún no tiene materiales definidos en su BOM'}
                    />
                    {bomItems.length > 0 && (() => {
                        const totalCost = bomItems.reduce((sum, row) => {
                            const unitCost = row.material.average_cost || row.material.last_cost || 0;
                            return sum + unitCost * row.quantity_per_unit;
                        }, 0);
                        return (
                            <div className="mt-3 flex justify-end">
                                <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-500">Costo estimado por unidad producida</span>
                                    <span className="text-xl font-bold text-gray-900 tabular-nums">
                                        ${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
                </>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-500 font-medium text-lg">No hay productos finales definidos</p>
                    <p className="text-gray-400 text-sm mt-1">Agregue productos de tipo PRODUCTO_FINAL en el módulo de Inventario</p>
                </div>
            )}

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Agregar Material a la BOM"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Agregar'}
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {error}
                    </div>
                )}

                <FormSection title="Detalle del material">
                    <FormField label="Material / Insumo" required>
                        <Select
                            value={form.material_id}
                            onChange={(e) => setForm(f => ({ ...f, material_id: e.target.value }))}
                            options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))}
                            placeholder="Seleccione un material..."
                        />
                    </FormField>
                    <FormGrid cols={1}>
                        <FormField label="Cantidad consumida (por 1 unidad prod.)" required>
                            <Input
                                type="number"
                                value={form.quantity_per_unit || ''}
                                onChange={(e) => setForm(f => ({ ...f, quantity_per_unit: Number(e.target.value) }))}
                                min={0.0001}
                                step="0.0001"
                                placeholder="0.0000"
                            />
                        </FormField>
                    </FormGrid>
                    <FormField label="Notas (opcional)">
                        <Textarea
                            value={form.notes}
                            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Instrucciones específicas, desperdicio estimado, etc."
                            rows={2}
                        />
                    </FormField>
                </FormSection>
            </Modal>
        </>
    );
}
