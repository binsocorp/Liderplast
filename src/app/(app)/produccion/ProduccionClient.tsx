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
import { createProductionRecords, deleteProductionRecord } from './actions';

interface ProductionRecord {
    id: string;
    production_number: string;
    product_id: string;
    quantity: number;
    production_date: string;
    notes: string;
    status: string;
    created_at: string;
    product: { name: string; unit: string } | null;
}

interface Product {
    id: string;
    name: string;
    unit: string;
}

interface Shortage {
    product?: string;
    material: string;
    required: number;
    available: number;
    unit: string;
    missing: number;
}

interface ProductionLine {
    product_id: string;
    quantity: number;
}

interface Props {
    productions: ProductionRecord[];
    products: Product[];
}

export function ProduccionClient({ productions, products }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [shortages, setShortages] = useState<Shortage[]>([]);

    const [lines, setLines] = useState<ProductionLine[]>([{ product_id: '', quantity: 0 }]);
    const [shared, setShared] = useState({
        production_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const filtered = productions.filter((p) => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (dateFrom && p.production_date < dateFrom) return false;
        if (dateTo && p.production_date > dateTo) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                p.product?.name?.toLowerCase().includes(q) ||
                p.production_number?.toLowerCase().includes(q) ||
                p.notes?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    function openNew() {
        setLines([{ product_id: '', quantity: 0 }]);
        setShared({ production_date: new Date().toISOString().split('T')[0], notes: '' });
        setError('');
        setShortages([]);
        setModalOpen(true);
    }

    function addLine() {
        setLines(prev => [...prev, { product_id: '', quantity: 0 }]);
    }

    function removeLine(idx: number) {
        setLines(prev => prev.filter((_, i) => i !== idx));
    }

    function updateLine(idx: number, field: keyof ProductionLine, value: string | number) {
        setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
    }

    async function handleSave() {
        const validLines = lines.filter(l => l.product_id && l.quantity > 0);
        if (validLines.length === 0) {
            setError('Complete al menos un producto con cantidad válida');
            return;
        }

        setSaving(true);
        setError('');
        setShortages([]);

        const result = await createProductionRecords(validLines, shared);

        if ('error' in result && result.error) {
            setError(result.error);
            if ('shortages' in result && Array.isArray(result.shortages)) {
                setShortages(result.shortages as Shortage[]);
            }
        } else {
            setModalOpen(false);
        }
        setSaving(false);
    }

    async function handleAnular(id: string) {
        if (!confirm('¿Desea anular este registro de producción? Nota: Esta acción es administrativa y no revertirá el stock automáticamente si ya fue procesada, debe hacerse un ajuste manual si corresponde.')) return;

        const result = await deleteProductionRecord(id);
        if ('error' in result && result.error) {
            alert(result.error);
        }
    }

    const columns: Column<ProductionRecord>[] = [
        {
            key: 'production_number',
            label: 'Número',
            render: (row) => <span className="font-semibold text-primary-700">{row.production_number}</span>
        },
        {
            key: 'production_date',
            label: 'Fecha',
            render: (row) => (
                <span className="tabular-nums text-gray-600">
                    {new Date(row.production_date + 'T12:00:00').toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            key: 'product',
            label: 'Producto',
            render: (row) => <span className="font-medium text-gray-900">{row.product?.name || '—'}</span>
        },
        {
            key: 'quantity',
            label: 'Cantidad',
            render: (row) => (
                <span className="font-semibold tabular-nums">
                    {Number(row.quantity).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {row.product?.unit}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => <Badge status={row.status === 'CONFIRMADA' ? 'CONFIRMADA' : 'ANULADA'} />
        },
        {
            key: 'actions',
            label: '',
            render: (row) => row.status === 'CONFIRMADA' && (
                <div className="flex justify-end">
                    <button
                        onClick={() => handleAnular(row.id)}
                        className="text-gray-400 hover:text-danger-500 p-1 rounded-lg hover:bg-danger-50 transition-colors"
                        title="Anular"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <PageHeader
                title="Producción Diaria"
                subtitle="Registre la producción realizada para actualizar stock automáticamente"
                actions={
                    <Button onClick={openNew} icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Registrar Producción
                    </Button>
                }
            />

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por producto, número..."
            >
                <SelectFilter
                    label="Estado"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'CONFIRMADA', label: 'Confirmada' },
                        { value: 'ANULADA', label: 'Anulada' },
                    ]}
                    allLabel="Todos los estados"
                />
                <div className="flex items-center gap-2">
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} uiSize="sm" className="w-auto" />
                    <span className="text-gray-400 text-sm">—</span>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} uiSize="sm" className="w-auto" />
                </div>
            </FilterBar>

            <DataTable
                columns={columns}
                data={filtered}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay registros de producción"
            />

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Registrar Producción"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Procesando...' : 'Confirmar Producción'}
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {error}
                        {shortages.length > 0 && (
                            <div className="mt-3 overflow-hidden border border-danger-100 rounded-md">
                                <table className="w-full text-xs bg-white">
                                    <thead className="bg-danger-50">
                                        <tr>
                                            <th className="px-2 py-1 text-left">Producto</th>
                                            <th className="px-2 py-1 text-left">Material</th>
                                            <th className="px-2 py-1 text-right">Nec.</th>
                                            <th className="px-2 py-1 text-right">Disp.</th>
                                            <th className="px-2 py-1 text-right text-danger-600">Falta</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {shortages.map((s, i) => (
                                            <tr key={i}>
                                                <td className="px-2 py-1 text-gray-500">{s.product ?? '—'}</td>
                                                <td className="px-2 py-1 font-medium">{s.material}</td>
                                                <td className="px-2 py-1 text-right">{s.required.toFixed(2)}</td>
                                                <td className="px-2 py-1 text-right">{s.available.toFixed(2)}</td>
                                                <td className="px-2 py-1 text-right font-bold text-danger-600">-{s.missing.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <FormSection title="Fecha y observaciones">
                    <FormGrid cols={2}>
                        <FormField label="Fecha de producción" required>
                            <Input
                                type="date"
                                value={shared.production_date}
                                onChange={(e) => setShared(s => ({ ...s, production_date: e.target.value }))}
                            />
                        </FormField>
                        <FormField label="Notas / Observaciones (opcional)">
                            <Input
                                value={shared.notes}
                                onChange={(e) => setShared(s => ({ ...s, notes: e.target.value }))}
                                placeholder="Turno, lote, incidencias..."
                            />
                        </FormField>
                    </FormGrid>
                </FormSection>

                <FormSection title="Productos fabricados">
                    <div className="space-y-2">
                        {lines.map((line, idx) => (
                            <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Producto Final</label>
                                    <Select
                                        value={line.product_id}
                                        onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                                        options={products.map(p => ({ value: p.id, label: p.name }))}
                                        placeholder="Seleccionar producto..."
                                        uiSize="sm"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                                    <Input
                                        type="number"
                                        value={line.quantity || ''}
                                        onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                                        min={0.01}
                                        step="0.01"
                                        placeholder="0"
                                        uiSize="sm"
                                    />
                                </div>
                                {lines.length > 1 && (
                                    <button
                                        onClick={() => removeLine(idx)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-500 transition-colors mb-0.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button variant="ghost" size="sm" onClick={addLine} icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Agregar otro producto
                    </Button>

                    <div className="p-3 bg-primary-50 rounded-lg text-xs text-primary-700 flex items-start gap-2 mt-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Al confirmar, se actualizará el stock de cada producto y se descontarán automáticamente los materiales de su BOM.</p>
                    </div>
                </FormSection>
            </Modal>
        </>
    );
}
