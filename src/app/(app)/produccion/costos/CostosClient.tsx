'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';

interface CostRow {
    id: string;
    production_number: string;
    production_date: string;
    product_id: string;
    product_name: string;
    quantity: number;
    bom_cost: number;
    real_cost: number;
    cost_per_unit: number;
}

interface Props {
    rows: CostRow[];
    products: Array<{ id: string; name: string }>;
}

function fmtARS(n: number) {
    return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CostosClient({ rows, products }: Props) {
    const [productFilter, setProductFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');

    // Meses disponibles
    const months = useMemo(() => {
        const set = new Set(rows.map(r => r.production_date.slice(0, 7)));
        return [...set].sort().reverse().map(m => ({
            value: m,
            label: new Date(m + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
        }));
    }, [rows]);

    const filtered = useMemo(() => rows.filter(r => {
        if (productFilter && r.product_id !== productFilter) return false;
        if (monthFilter && !r.production_date.startsWith(monthFilter)) return false;
        return true;
    }), [rows, productFilter, monthFilter]);

    // Totales
    const totals = useMemo(() => ({
        bom: filtered.reduce((s, r) => s + r.bom_cost, 0),
        real: filtered.reduce((s, r) => s + r.real_cost, 0),
        units: filtered.reduce((s, r) => s + r.quantity, 0),
    }), [filtered]);

    const columns: Column<CostRow>[] = [
        {
            key: 'production_number',
            label: 'Orden',
            render: (row) => (
                <span className="font-mono text-xs font-semibold text-primary-700">{row.production_number}</span>
            ),
        },
        {
            key: 'production_date',
            label: 'Fecha',
            render: (row) => (
                <span className="text-gray-600">
                    {new Date(row.production_date + 'T00:00:00').toLocaleDateString('es-AR')}
                </span>
            ),
        },
        {
            key: 'product_name',
            label: 'Modelo',
            render: (row) => <span className="font-medium text-gray-900">{row.product_name}</span>,
        },
        {
            key: 'quantity',
            label: 'Unidades',
            render: (row) => (
                <span className="tabular-nums font-semibold">{row.quantity.toLocaleString('es-AR')}</span>
            ),
        },
        {
            key: 'bom_cost',
            label: 'Costo BOM est.',
            render: (row) => (
                <span className="tabular-nums text-gray-600">{fmtARS(row.bom_cost)}</span>
            ),
        },
        {
            key: 'real_cost',
            label: 'Costo real',
            render: (row) => (
                <span className="tabular-nums font-semibold text-gray-900">{fmtARS(row.real_cost)}</span>
            ),
        },
        {
            key: 'variance',
            label: 'Varianza',
            render: (row) => {
                const diff = row.real_cost - row.bom_cost;
                const pct = row.bom_cost > 0 ? (diff / row.bom_cost) * 100 : 0;
                if (Math.abs(diff) < 1) return <span className="text-gray-400">—</span>;
                return (
                    <span className={`tabular-nums text-xs font-semibold ${diff > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                        {diff > 0 ? '+' : ''}{fmtARS(diff)}
                        <span className="ml-1 opacity-70">({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
                    </span>
                );
            },
        },
        {
            key: 'cost_per_unit',
            label: 'Costo / ud.',
            render: (row) => (
                <span className="tabular-nums text-gray-700">{fmtARS(row.cost_per_unit)}</span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Costos de Producción"
                subtitle="Costo real vs. estimado BOM por orden de producción"
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Órdenes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{filtered.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unidades producidas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totals.units.toLocaleString('es-AR')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Costo real total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{fmtARS(totals.real)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Varianza total</p>
                    <p className={`text-2xl font-bold mt-1 ${totals.real - totals.bom > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                        {fmtARS(totals.real - totals.bom)}
                    </p>
                </div>
            </div>

            <FilterBar searchValue="" onSearchChange={() => {}} searchPlaceholder="">
                <SelectFilter
                    label="Modelo"
                    value={productFilter}
                    onChange={setProductFilter}
                    options={products.map(p => ({ value: p.id, label: p.name }))}
                    allLabel="Todos los modelos"
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
                data={filtered}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay órdenes de producción confirmadas"
            />
        </>
    );
}
