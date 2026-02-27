'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Badge } from '@/components/ui/Badge';
import { NewExpenseModal } from './NewExpenseModal';
import { toggleExpenseStatus, deleteExpense } from './actions';
import { useRouter } from 'next/navigation';

export function ExpensesClient({
    expenses,
    categories,
    subcategories,
    paymentMethods,
    vendors
}: any) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);

    const filteredExpenses = useMemo(() => {
        return expenses.filter((e: any) => {
            if (statusFilter && e.status !== statusFilter) return false;
            if (categoryFilter && e.category_id !== categoryFilter) return false;
            if (paymentMethodFilter && e.payment_method_id !== paymentMethodFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return e.description?.toLowerCase().includes(q) || e.vendor?.name?.toLowerCase().includes(q);
            }
            return true;
        });
    }, [expenses, search, statusFilter, categoryFilter, paymentMethodFilter]);

    async function handleToggleStatus(id: string, current: string) {
        await toggleExpenseStatus(id, current);
        router.refresh();
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este egreso?')) return;
        await deleteExpense(id);
        router.refresh();
    }

    const columns: Column<any>[] = [
        {
            key: 'status',
            label: 'Estado',
            render: (r) => (
                <div onClick={(e) => { e.stopPropagation(); handleToggleStatus(r.id, r.status); }} className="cursor-pointer">
                    <Badge status={r.status} />
                </div>
            )
        },
        { key: 'issue_date', label: 'Emisión', render: (r) => new Intl.DateTimeFormat('es-AR').format(new Date(r.issue_date)) },
        { key: 'category', label: 'Categoría', render: (r) => r.category?.name || '-' },
        { key: 'description', label: 'Descripción' },
        { key: 'payment_method', label: 'Medio Pago', render: (r) => r.payment_method?.name || '-' },
        {
            key: 'amount',
            label: 'Monto',
            className: 'text-right font-bold',
            render: (r) => `$${Number(r.amount).toLocaleString('es-AR')}`
        },
        {
            key: '_actions',
            label: '',
            render: (r) => (
                <div className="flex justify-end gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingExpense(r); setShowModal(true); }} className="text-gray-400 hover:text-primary-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-gray-400 hover:text-danger-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <PageHeader
                title="Egresos"
                subtitle={`${filteredExpenses.length} comprobantes`}
                actions={
                    <Button onClick={() => { setEditingExpense(null); setShowModal(true); }}>+ Nuevo Egreso</Button>
                }
            />

            <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar por descripción o proveedor...">
                <SelectFilter
                    label="Estado"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[{ value: 'PAGADO', label: 'Pagado' }, { value: 'PENDIENTE', label: 'Pendiente' }]}
                    allLabel="Todos los estados"
                />
                <SelectFilter
                    label="Categoría"
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
                    allLabel="Todas las categorías"
                />
                <SelectFilter
                    label="Medio de Pago"
                    value={paymentMethodFilter}
                    onChange={setPaymentMethodFilter}
                    options={paymentMethods.map((p: any) => ({ value: p.id, label: p.name }))}
                    allLabel="Todos los medios"
                />
            </FilterBar>

            <DataTable
                columns={columns}
                data={filteredExpenses}
                keyExtractor={(r) => r.id}
                onRowClick={(r) => { setEditingExpense(r); setShowModal(true); }}
            />

            <NewExpenseModal
                open={showModal}
                onClose={() => setShowModal(false)}
                expense={editingExpense}
                categories={categories}
                subcategories={subcategories}
                paymentMethods={paymentMethods}
                vendors={vendors}
            />
        </>
    );
}
