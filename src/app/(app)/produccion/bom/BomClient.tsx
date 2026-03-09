'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
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
    material: { name: string; unit: string };
}

interface Product {
    id: string;
    name: string;
}

interface Material {
    id: string;
    name: string;
    unit: string;
}

interface Props {
    products: Product[];
    materials: Material[];
}

export function BomClient({ products, materials }: Props) {
    const [selectedProductId, setSelectedProductId] = useState<string>('');
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

    useEffect(() => {
        if (selectedProductId) {
            loadBom();
        } else {
            setBomItems([]);
        }
    }, [selectedProductId]);

    async function loadBom() {
        setLoading(true);
        const result = await getBomItems(selectedProductId);
        if ('data' in result && result.data) {
            setBomItems(result.data);
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
            render: (row) => (
                <span className="font-semibold tabular-nums">
                    {Number(row.quantity_per_unit).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                </span>
            )
        },
        {
            key: 'notes',
            label: 'Notas',
            render: (row) => <span className="text-gray-500 text-sm">{row.notes || '—'}</span>
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="flex justify-end">
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
            )
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

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="max-w-md">
                    <FormField label="Seleccionar Producto Final" required>
                        <Select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            options={products.map(p => ({ value: p.id, label: p.name }))}
                            placeholder="Seleccione un producto para ver/editar su BOM..."
                        />
                    </FormField>
                </div>
            </div>

            {selectedProductId ? (
                <DataTable
                    columns={columns}
                    data={bomItems}
                    keyExtractor={(row) => row.id}
                    emptyMessage={loading ? 'Cargando BOM...' : 'Este producto aún no tiene materiales definidos en su BOM'}
                />
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-500 font-medium text-lg">Seleccione un producto para comenzar</p>
                    <p className="text-gray-400 text-sm mt-1">Podrá definir qué materiales y en qué cantidades se consumen por unidad producida</p>
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
