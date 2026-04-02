'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';

interface PrdRow {
    id: string;
    production_number: string;
    production_date: string;
    product_id: string;
    product_name: string;
    quantity: number;
    cost_per_unit: number;
    operario_id: string;
    operario: string;
}

interface Props {
    rows: PrdRow[];
    products: Array<{ id: string; name: string }>;
    operarios: Array<{ id: string; name: string }>;
}

type GroupMode = 'orden' | 'modelo' | 'mes';

interface GroupedRow {
    key: string;
    label: string;
    sub?: string;
    total_units: number;
    orders_count: number;
    avg_cost_per_unit: number;
    total_cost: number;
}

function fmtARS(n: number) {
    return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RendimientoClient({ rows, products, operarios }: Props) {
    const [productFilter, setProductFilter] = useState('');
    const [operarioFilter, setOperarioFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [groupMode, setGroupMode] = useState<GroupMode>('orden');

    const months = useMemo(() => {
        const set = new Set(rows.map(r => r.production_date.slice(0, 7)));
        return [...set].sort().reverse().map(m => ({
            value: m,
            label: new Date(m + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
        }));
    }, [rows]);

    const filtered = useMemo(() => rows.filter(r => {
        if (productFilter && r.product_id !== productFilter) return false;
        if (operarioFilter && r.operario_id !== operarioFilter) return false;
        if (monthFilter && !r.production_date.startsWith(monthFilter)) return false;
        return true;
    }), [rows, productFilter, operarioFilter, monthFilter]);

    const totals = useMemo(() => ({
        units: filtered.reduce((s, r) => s + r.quantity, 0),
        orders: filtered.length,
        totalCost: filtered.reduce((s, r) => s + r.cost_per_unit * r.quantity, 0),
    }), [filtered]);

    // Agrupación
    const grouped = useMemo((): GroupedRow[] => {
        if (groupMode === 'orden') {
            return filtered.map(r => ({
                key: r.id,
                label: r.production_number,
                sub: r.product_name,
                total_units: r.quantity,
                orders_count: 1,
                avg_cost_per_unit: r.cost_per_unit,
                total_cost: r.cost_per_unit * r.quantity,
            }));
        }

        const groupKey = (r: PrdRow) =>
            groupMode === 'modelo' ? r.product_id : r.production_date.slice(0, 7);
        const groupLabel = (r: PrdRow) =>
            groupMode === 'modelo' ? r.product_name :
            new Date(r.production_date.slice(0, 7) + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

        const map = new Map<string, { label: string; rows: PrdRow[] }>();
        for (const r of filtered) {
            const k = groupKey(r);
            if (!map.has(k)) map.set(k, { label: groupLabel(r), rows: [] });
            map.get(k)!.rows.push(r);
        }

        return [...map.entries()].map(([key, { label, rows: grpRows }]) => {
            const total_units = grpRows.reduce((s, r) => s + r.quantity, 0);
            const total_cost = grpRows.reduce((s, r) => s + r.cost_per_unit * r.quantity, 0);
            return {
                key,
                label,
                total_units,
                orders_count: grpRows.length,
                avg_cost_per_unit: total_units > 0 ? total_cost / total_units : 0,
                total_cost,
            };
        });
    }, [filtered, groupMode]);

    const columns: Column<GroupedRow>[] = [
        {
            key: 'label',
            label: groupMode === 'orden' ? 'Orden' : groupMode === 'modelo' ? 'Modelo' : 'Período',
            render: (row) => (
                <div>
                    <span className={`font-medium text-gray-900 ${groupMode === 'orden' ? 'font-mono text-xs text-primary-700' : ''}`}>
                        {row.label}
                    </span>
                    {row.sub && <div className="text-xs text-gray-500 mt-0.5">{row.sub}</div>}
                </div>
            ),
        },
        {
            key: 'orders_count',
            label: 'Órdenes',
            render: (row) => (
                <span className="tabular-nums text-gray-600">{row.orders_count}</span>
            ),
        },
        {
            key: 'total_units',
            label: 'Unidades prod.',
            render: (row) => (
                <span className="tabular-nums font-semibold text-gray-900">
                    {row.total_units.toLocaleString('es-AR')}
                </span>
            ),
        },
        {
            key: 'avg_cost_per_unit',
            label: 'Costo prom. / ud.',
            render: (row) => (
                <span className="tabular-nums text-gray-700">{fmtARS(row.avg_cost_per_unit)}</span>
            ),
        },
        {
            key: 'total_cost',
            label: 'Costo total',
            render: (row) => (
                <span className="tabular-nums font-semibold text-gray-900">{fmtARS(row.total_cost)}</span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Rendimiento de Producción"
                subtitle="Unidades producidas por modelo y período"
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Órdenes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totals.orders}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unidades producidas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totals.units.toLocaleString('es-AR')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Costo total estimado</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{fmtARS(totals.totalCost)}</p>
                </div>
            </div>

            <FilterBar searchValue="" onSearchChange={() => {}} searchPlaceholder="">
                {/* Agrupación */}
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 gap-0.5">
                    {(['orden', 'modelo', 'mes'] as GroupMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setGroupMode(mode)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${groupMode === mode ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {mode === 'orden' ? 'Por orden' : mode === 'modelo' ? 'Por modelo' : 'Por mes'}
                        </button>
                    ))}
                </div>
                <SelectFilter
                    label="Modelo"
                    value={productFilter}
                    onChange={setProductFilter}
                    options={products.map(p => ({ value: p.id, label: p.name }))}
                    allLabel="Todos los modelos"
                />
                <SelectFilter
                    label="Operario"
                    value={operarioFilter}
                    onChange={setOperarioFilter}
                    options={operarios.map(o => ({ value: o.id, label: o.name }))}
                    allLabel="Todos"
                />
                <SelectFilter
                    label="Mes"
                    value={monthFilter}
                    onChange={setMonthFilter}
                    options={months}
                    allLabel="Todos los meses"
                />
            </FilterBar>

            <DataTable
                columns={columns}
                data={grouped}
                keyExtractor={(row) => row.key}
                emptyMessage="No hay órdenes de producción para los filtros seleccionados"
            />
        </>
    );
}
