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
import { createPurchase, linkPurchaseSupplier } from './actions';

// -----------------------------------------------
// Types
// -----------------------------------------------

interface PurchaseItem {
    id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    item: { name: string; unit: string } | null;
}

interface Purchase {
    id: string;
    purchase_number: string;
    supplier_id: string | null;
    supplier_name: string;
    supplier: { id: string; name: string } | null;
    purchase_date: string;
    voucher_type: string;
    voucher_number: string;
    notes: string;
    total: number;
    status: string;
    payment_method_id: string | null;
    payment_method?: { id: string; name: string } | null;
    created_at: string;
    purchase_items: PurchaseItem[];
    linked_expense?: { id: string; status: string }[] | null;
}

interface Supplier {
    id: string;
    name: string;
}

interface InventoryItemLookup {
    id: string;
    name: string;
    unit: string;
    last_cost: number;
}

interface PaymentMethod {
    id: string;
    name: string;
}

interface Props {
    purchases: Purchase[];
    items: InventoryItemLookup[];
    suppliers: Supplier[];
    paymentMethods: PaymentMethod[];
}

interface LineItem {
    item_id: string;
    quantity: number;
    unit_price: number;
}

const VOUCHER_OPTIONS = [
    { value: '', label: 'Sin comprobante' },
    { value: 'Factura A', label: 'Factura A' },
    { value: 'Factura B', label: 'Factura B' },
    { value: 'Factura C', label: 'Factura C' },
    { value: 'Remito', label: 'Remito' },
    { value: 'Recibo', label: 'Recibo' },
    { value: 'Otro', label: 'Otro' },
];

function getSupplierLabel(p: Purchase): string {
    return p.supplier?.name ?? p.supplier_name ?? '—';
}

// -----------------------------------------------
// Component
// -----------------------------------------------

export function ComprasClient({ purchases, items, suppliers, paymentMethods }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Link supplier modal (for historical records without FK)
    const [linkModalPurchase, setLinkModalPurchase] = useState<Purchase | null>(null);
    const [linkSupplierId, setLinkSupplierId] = useState('');
    const [linkSaving, setLinkSaving] = useState(false);
    const [linkError, setLinkError] = useState('');

    // New purchase form
    const [form, setForm] = useState({
        supplier_id: '',
        supplier_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        voucher_type: '',
        voucher_number: '',
        notes: '',
        payment_method_id: '' as string,
    });
    const [lines, setLines] = useState<LineItem[]>([{ item_id: '', quantity: 1, unit_price: 0 }]);

    // Purchases without supplier_id (historical)
    const unlinked = purchases.filter(p => !p.supplier_id && p.status === 'CONFIRMADA');

    // Filter
    const filtered = purchases.filter((p) => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (dateFrom && p.purchase_date < dateFrom) return false;
        if (dateTo && p.purchase_date > dateTo) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                getSupplierLabel(p).toLowerCase().includes(q) ||
                p.purchase_number?.toLowerCase().includes(q) ||
                p.voucher_number?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Supplier summary (by FK name, then fallback to supplier_name)
    const supplierTotals = purchases
        .filter(p => p.status === 'CONFIRMADA')
        .reduce((acc, p) => {
            const name = getSupplierLabel(p);
            acc[name] = (acc[name] || 0) + Number(p.total);
            return acc;
        }, {} as Record<string, number>);

    const sortedSuppliers = Object.entries(supplierTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Line management
    function addLine() {
        setLines(prev => [...prev, { item_id: '', quantity: 1, unit_price: 0 }]);
    }

    function removeLine(index: number) {
        setLines(prev => prev.filter((_, i) => i !== index));
    }

    function updateLine(index: number, field: keyof LineItem, value: string | number) {
        setLines(prev => prev.map((line, i) => {
            if (i !== index) return line;
            const updated = { ...line, [field]: value };
            if (field === 'item_id') {
                const item = items.find(it => it.id === value);
                if (item && item.last_cost > 0) {
                    updated.unit_price = Number(item.last_cost);
                }
            }
            return updated;
        }));
    }

    const lineTotal = (line: LineItem) => line.quantity * line.unit_price;
    const grandTotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);

    function openNew() {
        setForm({
            supplier_id: '',
            supplier_name: '',
            purchase_date: new Date().toISOString().split('T')[0],
            voucher_type: '',
            voucher_number: '',
            notes: '',
            payment_method_id: '',
        });
        setLines([{ item_id: '', quantity: 1, unit_price: 0 }]);
        setError('');
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.supplier_id) {
            setError('Debe seleccionar un proveedor');
            return;
        }
        const validLines = lines.filter(l => l.item_id && l.quantity > 0);
        if (validLines.length === 0) {
            setError('Debe agregar al menos un ítem');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const result = await createPurchase({
                purchase: {
                    ...form,
                    payment_method_id: form.payment_method_id || null,
                } as any,
                items: validLines,
            });

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

    async function handleLinkSupplier() {
        if (!linkSupplierId || !linkModalPurchase) return;
        setLinkSaving(true);
        setLinkError('');
        try {
            const result = await linkPurchaseSupplier(linkModalPurchase.id, linkSupplierId);
            if (result.error) {
                setLinkError(result.error);
            } else {
                setLinkModalPurchase(null);
            }
        } catch {
            setLinkError('Error inesperado');
        } finally {
            setLinkSaving(false);
        }
    }

    // Columns
    const columns: Column<Purchase>[] = [
        {
            key: 'purchase_number',
            label: 'Número',
            render: (row) => (
                <span className="font-medium text-primary-700">{row.purchase_number}</span>
            ),
        },
        {
            key: 'purchase_date',
            label: 'Fecha',
            render: (row) => (
                <span className="tabular-nums text-gray-600">
                    {new Date(row.purchase_date + 'T12:00:00').toLocaleDateString('es-AR')}
                </span>
            ),
        },
        {
            key: 'supplier_name',
            label: 'Proveedor',
            render: (row) => (
                <span className="text-gray-900">
                    {getSupplierLabel(row)}
                    {!row.supplier_id && row.status === 'CONFIRMADA' && (
                        <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">sin FK</span>
                    )}
                </span>
            ),
        },
        {
            key: 'voucher',
            label: 'Comprobante',
            render: (row) => (
                <span className="text-gray-600 text-xs">
                    {row.voucher_type ? `${row.voucher_type} ${row.voucher_number}` : '—'}
                </span>
            ),
        },
        {
            key: 'items_count',
            label: 'Ítems',
            render: (row) => (
                <span className="text-gray-500">{row.purchase_items?.length || 0}</span>
            ),
        },
        {
            key: 'total',
            label: 'Total',
            render: (row) => (
                <span className="font-semibold tabular-nums text-gray-900">
                    ${Number(row.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: 'payment_method',
            label: 'Cuenta',
            render: (row) => {
                const pm = paymentMethods.find(p => p.id === row.payment_method_id);
                return <span className="text-gray-500 text-xs">{pm?.name ?? '—'}</span>;
            },
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => <Badge status={row.status} />,
        },
        {
            key: 'expense_status',
            label: 'Gasto',
            render: (row) => {
                const expense = Array.isArray(row.linked_expense) ? row.linked_expense[0] : row.linked_expense;
                if (!expense) return <span className="text-gray-400 text-xs">Sin registro</span>;
                const cfg: Record<string, { label: string; cls: string }> = {
                    PENDIENTE: { label: 'Pendiente', cls: 'bg-warning-50 text-warning-700' },
                    PAGADO: { label: 'Pagado', cls: 'bg-success-50 text-success-700' },
                    ANULADO: { label: 'Anulado', cls: 'bg-danger-50 text-danger-700' },
                };
                const c = cfg[expense.status] || { label: expense.status, cls: 'bg-gray-100 text-gray-600' };
                return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>{c.label}</span>;
            },
        },
    ];

    return (
        <>
            <PageHeader
                title="Compras"
                subtitle={`${purchases.length} compras registradas`}
                backHref="/inventario"
                actions={
                    <Button onClick={openNew} icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }>
                        Nueva Compra
                    </Button>
                }
            />

            {/* Alert: historical purchases without supplier FK */}
            {unlinked.length > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-amber-800">
                            {unlinked.length} compra{unlinked.length > 1 ? 's' : ''} sin proveedor vinculado
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Estas compras tienen nombre de proveedor pero no FK. Hacé click en una fila para vincular.
                        </p>
                    </div>
                </div>
            )}

            {/* Supplier summary */}
            {sortedSuppliers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                    {sortedSuppliers.map(([name, total]) => (
                        <div key={name} className="bg-white rounded-xl border border-gray-200 p-3">
                            <p className="text-xs text-gray-400 truncate">{name}</p>
                            <p className="text-lg font-bold text-gray-900 mt-0.5">
                                ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por proveedor, número..."
            >
                <SelectFilter
                    label="Estado"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'CONFIRMADA', label: 'Confirmada' },
                        { value: 'ANULADA', label: 'Anulada' },
                        { value: 'BORRADOR', label: 'Borrador' },
                    ]}
                    allLabel="Todos los estados"
                />
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        uiSize="sm"
                        className="w-auto"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        uiSize="sm"
                        className="w-auto"
                    />
                </div>
            </FilterBar>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filtered}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => setDetailPurchase(row)}
                emptyMessage="No hay compras registradas"
            />

            {/* Detail Modal */}
            <Modal
                open={!!detailPurchase}
                onClose={() => setDetailPurchase(null)}
                title={`Compra ${detailPurchase?.purchase_number || ''}`}
                size="lg"
            >
                {detailPurchase && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Proveedor:</span>{' '}
                                <span className="font-medium">{getSupplierLabel(detailPurchase)}</span>
                                {!detailPurchase.supplier_id && detailPurchase.status === 'CONFIRMADA' && (
                                    <button
                                        onClick={() => { setDetailPurchase(null); setLinkSupplierId(''); setLinkError(''); setLinkModalPurchase(detailPurchase); }}
                                        className="ml-2 text-xs text-amber-600 underline hover:text-amber-800"
                                    >
                                        Vincular proveedor
                                    </button>
                                )}
                            </div>
                            <div>
                                <span className="text-gray-400">Fecha:</span>{' '}
                                <span className="font-medium">{new Date(detailPurchase.purchase_date + 'T12:00:00').toLocaleDateString('es-AR')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Comprobante:</span>{' '}
                                <span className="font-medium">
                                    {detailPurchase.voucher_type ? `${detailPurchase.voucher_type} ${detailPurchase.voucher_number}` : '—'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Estado:</span>{' '}
                                <Badge status={detailPurchase.status} />
                            </div>
                            <div>
                                <span className="text-gray-400">Cuenta de pago:</span>{' '}
                                <span className="font-medium">
                                    {paymentMethods.find(p => p.id === detailPurchase.payment_method_id)?.name ?? '—'}
                                </span>
                            </div>
                        </div>

                        {detailPurchase.notes && (
                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                {detailPurchase.notes}
                            </div>
                        )}

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ítem</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">P. Unit.</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detailPurchase.purchase_items?.map((pi) => (
                                    <tr key={pi.id}>
                                        <td className="px-3 py-2 font-medium">{pi.item?.name || '—'}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{Number(pi.quantity).toLocaleString('es-AR')}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">${Number(pi.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-right tabular-nums font-semibold">${Number(pi.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-200">
                                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700">Total</td>
                                    <td className="px-3 py-2 text-right font-bold text-lg tabular-nums">
                                        ${Number(detailPurchase.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Modal>

            {/* Link Supplier Modal (historical records) */}
            <Modal
                open={!!linkModalPurchase}
                onClose={() => setLinkModalPurchase(null)}
                title={`Vincular proveedor — ${linkModalPurchase?.purchase_number || ''}`}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setLinkModalPurchase(null)}>Cancelar</Button>
                        <Button onClick={handleLinkSupplier} disabled={linkSaving || !linkSupplierId}>
                            {linkSaving ? 'Guardando...' : 'Vincular'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Nombre actual: <strong>{linkModalPurchase?.supplier_name || '—'}</strong>
                    </p>
                    {linkError && (
                        <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">{linkError}</div>
                    )}
                    <FormField label="Proveedor" required>
                        <Select
                            value={linkSupplierId}
                            onChange={(e) => setLinkSupplierId(e.target.value)}
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Seleccionar proveedor..."
                        />
                    </FormField>
                </div>
            </Modal>

            {/* New Purchase Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Compra"
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Registrar Compra'}
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Header */}
                    <FormSection title="Datos de la compra">
                        <FormGrid cols={2}>
                            <FormField label="Proveedor" required>
                                <Select
                                    value={form.supplier_id}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        const supplier = suppliers.find(s => s.id === id);
                                        setForm(f => ({ ...f, supplier_id: id, supplier_name: supplier?.name || '' }));
                                    }}
                                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                                    placeholder="Seleccionar proveedor..."
                                />
                            </FormField>
                            <FormField label="Fecha" required>
                                <Input
                                    type="date"
                                    value={form.purchase_date}
                                    onChange={(e) => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                                />
                            </FormField>
                        </FormGrid>
                        <FormGrid cols={2}>
                            <FormField label="Tipo de comprobante">
                                <Select
                                    value={form.voucher_type}
                                    onChange={(e) => setForm(f => ({ ...f, voucher_type: e.target.value }))}
                                    options={VOUCHER_OPTIONS}
                                />
                            </FormField>
                            <FormField label="Número de comprobante">
                                <Input
                                    value={form.voucher_number}
                                    onChange={(e) => setForm(f => ({ ...f, voucher_number: e.target.value }))}
                                    placeholder="Ej: 0001-00012345"
                                />
                            </FormField>
                        </FormGrid>
                        <FormGrid cols={2}>
                            <FormField label="Cuenta de pago">
                                <Select
                                    value={form.payment_method_id}
                                    onChange={(e) => setForm(f => ({ ...f, payment_method_id: e.target.value }))}
                                    options={paymentMethods.map(pm => ({ value: pm.id, label: pm.name }))}
                                    placeholder="Seleccionar cuenta..."
                                />
                            </FormField>
                            <FormField label="Observaciones">
                                <Textarea
                                    value={form.notes}
                                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Notas sobre la compra..."
                                    rows={2}
                                />
                            </FormField>
                        </FormGrid>
                    </FormSection>

                    {/* Line items */}
                    <FormSection title="Ítems comprados">
                        <div className="space-y-3">
                            {lines.map((line, idx) => (
                                <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Ítem</label>
                                        <Select
                                            value={line.item_id}
                                            onChange={(e) => updateLine(idx, 'item_id', e.target.value)}
                                            options={items.map(i => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                                            placeholder="Seleccionar..."
                                            uiSize="sm"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                                        <Input
                                            type="number"
                                            value={line.quantity || ''}
                                            onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                                            min={0.01}
                                            step="0.01"
                                            uiSize="sm"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">P. Unitario</label>
                                        <Input
                                            type="number"
                                            value={line.unit_price || ''}
                                            onChange={(e) => updateLine(idx, 'unit_price', Number(e.target.value))}
                                            min={0}
                                            step="0.01"
                                            uiSize="sm"
                                        />
                                    </div>
                                    <div className="w-28 text-right">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Subtotal</label>
                                        <p className="text-sm font-semibold tabular-nums py-1">
                                            ${lineTotal(line).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </p>
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

                        <div className="flex items-center justify-between mt-4">
                            <Button variant="ghost" size="sm" onClick={addLine} icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }>
                                Agregar línea
                            </Button>
                            <div className="text-right">
                                <span className="text-sm text-gray-500">Total: </span>
                                <span className="text-xl font-bold tabular-nums">
                                    ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </FormSection>
                </div>
            </Modal>
        </>
    );
}
