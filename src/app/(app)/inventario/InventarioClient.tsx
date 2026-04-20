'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar } from '@/components/ui/FilterBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormSection, FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select } from '@/components/ui/FormInputs';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem, createInventoryAdjustments } from './actions';

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
    catalog_item_id: string | null;
    lead_time_days: number | null;
    created_at: string;
}

interface FinalProduct {
    id: string;
    name: string;
}

interface BomItem {
    id: string;
    product_id: string;
    material_id: string;
    quantity_per_unit: number;
}

interface Props {
    items: InventoryItem[];
    finalProducts: FinalProduct[];
    allBomItems: BomItem[];
}

const TYPE_OPTIONS = [
    { value: 'MATERIA_PRIMA', label: 'Materia Prima' },
    { value: 'INSUMO', label: 'Insumo' },
    { value: 'PRODUCTO_FINAL', label: 'Producto Final' },
];

const TABS = [
    { value: '', label: 'Todos' },
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

function AlcanceBar({ current, qtyPerUnit, max }: { current: number; qtyPerUnit: number; max: number }) {
    if (!qtyPerUnit || max === 0) return <span className="text-gray-300 text-xs">—</span>;
    const units = current / qtyPerUnit;
    const pct = Math.min((units / max) * 100, 100);
    const color = pct < 25 ? 'bg-red-400' : pct < 60 ? 'bg-yellow-400' : 'bg-emerald-400';
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-gray-600 w-12 text-right">
                {units < 1 ? units.toLocaleString('es-AR', { maximumFractionDigits: 1 }) : Math.floor(units).toLocaleString('es-AR')} u.
            </span>
        </div>
    );
}

export function InventarioClient({ items, finalProducts, allBomItems }: Props) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Alcance reference products — default to items with "700300" in name
    const defaultPileta = finalProducts.find(p => p.name.includes('700300'))?.id ?? finalProducts[0]?.id ?? '';
    const defaultLoseta = finalProducts.find(p => p.name.toLowerCase().includes('loseta'))?.id ?? finalProducts[1]?.id ?? '';
    const [piletaProductId, setPiletaProductId] = useState(defaultPileta);
    const [losetaProductId, setLosetaProductId] = useState(defaultLoseta);

    // Toma de Inventario
    const [tomaOpen, setTomaOpen] = useState(false);
    const [tomaMotivo, setTomaMotivo] = useState('Conteo físico');
    const [tomaCounts, setTomaCounts] = useState<Record<string, number>>({});
    const [tomaSaving, setTomaSaving] = useState(false);
    const [tomaError, setTomaError] = useState('');

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
        catalog_item_id: null as string | null,
        lead_time_days: null as number | null,
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
            is_active: true,
            catalog_item_id: null,
            lead_time_days: null,
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
            catalog_item_id: item.catalog_item_id || null,
            lead_time_days: item.lead_time_days ?? null,
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

    function openToma() {
        const initial: Record<string, number> = {};
        items.filter(i => i.is_active).forEach(i => { initial[i.id] = Number(i.current_stock); });
        setTomaCounts(initial);
        setTomaMotivo('Conteo físico');
        setTomaError('');
        setTomaOpen(true);
    }

    async function handleToma() {
        if (!tomaMotivo.trim()) { setTomaError('Ingresá un motivo'); return; }
        const activeItems = items.filter(i => i.is_active);
        const adjustments = activeItems
            .filter(i => tomaCounts[i.id] !== undefined && Number(tomaCounts[i.id]) !== Number(i.current_stock))
            .map(i => ({ item_id: i.id, current_stock: Number(i.current_stock), quantity: Number(tomaCounts[i.id]) }));

        if (!adjustments.length) { setTomaError('No hay diferencias entre el conteo y el stock actual'); return; }

        setTomaSaving(true);
        setTomaError('');
        const result = await createInventoryAdjustments(adjustments, tomaMotivo);
        if ('error' in result && result.error) {
            setTomaError(result.error);
        } else {
            setTomaOpen(false);
        }
        setTomaSaving(false);
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
                if (row.min_stock > 0) {
                    if (row.current_stock < row.min_stock) return <Badge status="STOCK_BAJO" />;
                    if (row.current_stock < row.min_stock * 1.5) return <Badge status="STOCK_ALERTA" />;
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

    // BOM grouping for MATERIA_PRIMA tab (must be after `columns`)
    const piletaBom = allBomItems.filter(b => b.product_id === piletaProductId);
    const losetaBom = allBomItems.filter(b => b.product_id === losetaProductId);
    const piletaIds = new Set(piletaBom.map(b => b.material_id));
    const losetaIds = new Set(losetaBom.map(b => b.material_id));

    const materiasPrimas = filtered.filter(i => i.type === 'MATERIA_PRIMA');
    const piletaMaterials = materiasPrimas.filter(i => piletaIds.has(i.id));
    const losetaMaterials = materiasPrimas.filter(i => losetaIds.has(i.id) && !piletaIds.has(i.id));
    const otrosMaterials = materiasPrimas.filter(i => !piletaIds.has(i.id) && !losetaIds.has(i.id));

    function calcMaxUnits(materials: InventoryItem[], bom: BomItem[]) {
        const values = materials.map(m => {
            const entry = bom.find(b => b.material_id === m.id);
            return entry ? m.current_stock / entry.quantity_per_unit : 0;
        });
        return Math.max(...values, 1);
    }

    const maxPileta = calcMaxUnits(piletaMaterials, piletaBom);
    const maxLoseta = calcMaxUnits(losetaMaterials, losetaBom);

    const columnsMp: Column<InventoryItem>[] = [
        ...columns.filter(c => c.key !== 'type'),
        {
            key: 'lead_time_days' as any,
            label: 'Demora pedido',
            render: (row) => row.lead_time_days != null
                ? <span className="tabular-nums text-gray-600">{row.lead_time_days} d.</span>
                : <span className="text-gray-300">—</span>,
        },
    ];

    function makeColumnsWithAlcance(bom: BomItem[], max: number): Column<InventoryItem>[] {
        return [
            ...columnsMp,
            {
                key: 'alcance' as any,
                label: (
                    <span className="group relative inline-flex items-center gap-1">
                        Alcance
                        <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="absolute bottom-full left-0 mb-2 px-2 py-1.5 text-xs text-white bg-gray-800 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                            Unidades del producto de referencia<br />que se pueden fabricar con el stock actual
                        </span>
                    </span>
                ),
                render: (row) => {
                    const entry = bom.find(b => b.material_id === row.id);
                    return <AlcanceBar current={row.current_stock} qtyPerUnit={entry?.quantity_per_unit ?? 0} max={max} />;
                },
            },
        ];
    }

    return (
        <>
            <PageHeader
                title="Inventario"
                subtitle={`${activeItems.length} ítems · ${lowStockCount > 0 ? `⚠ ${lowStockCount} con stock bajo` : 'Stock OK'}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={openToma} icon={<ClipboardList className="w-4 h-4" />}>
                            Toma de Inventario
                        </Button>
                        <Link href="/master/catalog?new=1">
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Nuevo Ítem
                            </Button>
                        </Link>
                    </div>
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

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setTypeFilter(tab.value)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            typeFilter === tab.value
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                            typeFilter === tab.value ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                            {tab.value === ''
                                ? items.filter(i => showInactive || i.is_active).length
                                : items.filter(i => i.type === tab.value && (showInactive || i.is_active)).length
                            }
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre..."
            >
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
            {typeFilter === 'MATERIA_PRIMA' ? (
                <div className="space-y-6">
                    {/* Reference product selectors */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Referencia de alcance</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Piletas</span>
                            <select
                                value={piletaProductId}
                                onChange={(e) => setPiletaProductId(e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                                <option value="">— Sin referencia —</option>
                                {finalProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Losetas</span>
                            <select
                                value={losetaProductId}
                                onChange={(e) => setLosetaProductId(e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                                <option value="">— Sin referencia —</option>
                                {finalProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {piletaMaterials.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Para Piletas</h3>
                                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">{piletaMaterials.length}</span>
                            </div>
                            <DataTable
                                columns={makeColumnsWithAlcance(piletaBom, maxPileta)}
                                data={piletaMaterials}
                                keyExtractor={(row) => row.id}
                                onRowClick={openEdit}
                                emptyMessage=""
                                getRowClassName={(row) =>
                                    row.is_active && row.min_stock > 0 && row.current_stock < row.min_stock
                                        ? 'bg-red-50 hover:bg-red-100' : ''
                                }
                            />
                        </div>
                    )}

                    {losetaMaterials.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Para Losetas</h3>
                                <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">{losetaMaterials.length}</span>
                            </div>
                            <DataTable
                                columns={makeColumnsWithAlcance(losetaBom, maxLoseta)}
                                data={losetaMaterials}
                                keyExtractor={(row) => row.id}
                                onRowClick={openEdit}
                                emptyMessage=""
                                getRowClassName={(row) =>
                                    row.is_active && row.min_stock > 0 && row.current_stock < row.min_stock
                                        ? 'bg-red-50 hover:bg-red-100' : ''
                                }
                            />
                        </div>
                    )}

                    {otrosMaterials.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sin categoría</h3>
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{otrosMaterials.length}</span>
                            </div>
                            <DataTable
                                columns={columnsMp}
                                data={otrosMaterials}
                                keyExtractor={(row) => row.id}
                                onRowClick={openEdit}
                                emptyMessage=""
                                getRowClassName={(row) =>
                                    row.is_active && row.min_stock > 0 && row.current_stock < row.min_stock
                                        ? 'bg-red-50 hover:bg-red-100' : ''
                                }
                            />
                        </div>
                    )}
                </div>
            ) : (
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
            )}

            {/* Modal Toma de Inventario */}
            <Modal
                open={tomaOpen}
                onClose={() => setTomaOpen(false)}
                title="Toma de Inventario"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setTomaOpen(false)}>Cancelar</Button>
                        <Button onClick={handleToma} disabled={tomaSaving}>
                            {tomaSaving ? 'Ajustando...' : 'Confirmar ajustes'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        Ingresá el stock físico contado para cada ítem. Solo se ajustarán los que tengan diferencias.
                    </div>

                    {tomaError && (
                        <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                            {tomaError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del conteo</label>
                        <input
                            type="text"
                            value={tomaMotivo}
                            onChange={(e) => setTomaMotivo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ej: Conteo fin de mes, inventario anual..."
                        />
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Ítem</th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600">Stock sistema</th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600">Conteo real</th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.filter(i => i.is_active).map(item => {
                                    const counted = tomaCounts[item.id] ?? Number(item.current_stock);
                                    const diff = counted - Number(item.current_stock);
                                    return (
                                        <tr key={item.id} className={diff !== 0 ? 'bg-amber-50' : ''}>
                                            <td className="px-4 py-2">
                                                <span className="font-medium text-gray-900">{item.name}</span>
                                                <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right tabular-nums text-gray-500">
                                                {Number(item.current_stock).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={counted}
                                                    onChange={(e) => setTomaCounts(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </td>
                                            <td className={`px-4 py-2 text-right tabular-nums font-semibold ${diff > 0 ? 'text-success-600' : diff < 0 ? 'text-danger-600' : 'text-gray-400'}`}>
                                                {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* Modal Ítem */}
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
                        <FormField label="Nombre">
                            <p className="px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl">
                                {form.name || '—'}
                            </p>
                        </FormField>
                        <FormField label="Tipo">
                            <p className="px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl">
                                {TYPE_OPTIONS.find(o => o.value === form.type)?.label || form.type}
                            </p>
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

                    {(form.type === 'MATERIA_PRIMA' || form.type === 'INSUMO') && (
                        <FormGrid cols={2}>
                            <FormField label="Demora de pedido (días)">
                                <Input
                                    type="number"
                                    value={form.lead_time_days ?? ''}
                                    onChange={(e) => setForm(f => ({ ...f, lead_time_days: e.target.value !== '' ? Number(e.target.value) : null }))}
                                    min={0}
                                    step="1"
                                    placeholder="Ej: 7"
                                />
                            </FormField>
                        </FormGrid>
                    )}

                </FormSection>
            </Modal>
        </>
    );
}
