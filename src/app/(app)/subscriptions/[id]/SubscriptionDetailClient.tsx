'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { FormSection, FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select, Textarea } from '@/components/ui/FormInputs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { updateSubscription, deleteSubscription, addSubscriptionExpense, removeSubscriptionExpense } from '../actions';
import type { UserSubscription, SubscriptionExpense, BillingCycle, SubscriptionStatus } from '@/lib/types/database';

interface SubscriptionDetailClientProps {
    subscription: UserSubscription & { expenses: SubscriptionExpense[] };
}

export function SubscriptionDetailClient({ subscription }: SubscriptionDetailClientProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState(subscription.title);
    const [status, setStatus] = useState(subscription.status);
    const [billingCycle, setBillingCycle] = useState(subscription.billing_cycle);
    const [cost, setCost] = useState(String(subscription.cost));
    const [currency, setCurrency] = useState(subscription.currency);
    const [nextBillingDate, setNextBillingDate] = useState(subscription.next_billing_date || '');
    const [notes, setNotes] = useState(subscription.notes || '');

    // Expense modal
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseAmount, setExpenseAmount] = useState(String(subscription.cost));
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [expenseNotes, setExpenseNotes] = useState('');

    async function handleSave() {
        setSaving(true);
        setError(null);
        const result = await updateSubscription(subscription.id, {
            title,
            status,
            billing_cycle: billingCycle,
            cost: parseFloat(cost) || 0,
            currency,
            next_billing_date: nextBillingDate || null,
            notes,
        });
        if (result.error) setError(result.error);
        setSaving(false);
        router.refresh();
    }

    async function handleDelete() {
        if (!confirm('¿Eliminar esta suscripción permanentemente?')) return;
        const result = await deleteSubscription(subscription.id);
        if (!result.error) router.push('/subscriptions');
    }

    async function handleAddExpense() {
        await addSubscriptionExpense(subscription.id, parseFloat(expenseAmount) || 0, expenseDate, expenseNotes);
        setShowExpenseModal(false);
        router.refresh();
    }

    async function handleRemoveExpense(id: string) {
        if (!confirm('¿Eliminar este gasto?')) return;
        await removeSubscriptionExpense(id, subscription.id);
        router.refresh();
    }

    const columns: Column<SubscriptionExpense>[] = [
        {
            key: 'expense_date',
            label: 'Fecha',
            render: (row) => new Intl.DateTimeFormat('es-AR').format(new Date(row.expense_date)),
        },
        {
            key: 'amount',
            label: 'Monto',
            render: (row) => (
                <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: subscription.currency }).format(Number(row.amount))}
                </span>
            ),
        },
        { key: 'notes', label: 'Notas' },
        {
            key: '_actions',
            label: '',
            className: 'w-16 text-right',
            render: (row) => (
                <button
                    onClick={() => handleRemoveExpense(row.id)}
                    className="text-gray-400 hover:text-danger-500 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={subscription.title}
                backHref="/subscriptions"
                actions={
                    <div className="flex items-center gap-3">
                        <Badge status={subscription.status} />
                        <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                    </div>
                }
            />

            {error && <div className="mb-4 p-3 bg-danger-50 border border-danger-500/20 text-danger-700 rounded-lg text-sm">{error}</div>}

            <div className="space-y-6">
                <FormSection title="Detalles de la Suscripción">
                    <FormGrid>
                        <FormField label="Título" required>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </FormField>
                        <FormField label="Estado" required>
                            <Select value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)} options={[
                                { value: 'ACTIVE', label: 'Activo' },
                                { value: 'PAUSED', label: 'Pausado' },
                                { value: 'CANCELLED', label: 'Cancelado' }
                            ]} />
                        </FormField>
                        <FormField label="Costo" required>
                            <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
                        </FormField>
                        <FormField label="Moneda" required>
                            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} options={[
                                { value: 'ARS', label: 'ARS' },
                                { value: 'USD', label: 'USD' }
                            ]} />
                        </FormField>
                        <FormField label="Ciclo" required>
                            <Select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as BillingCycle)} options={[
                                { value: 'MONTHLY', label: 'Mensual' },
                                { value: 'YEARLY', label: 'Anual' },
                                { value: 'OTHER', label: 'Otro' }
                            ]} />
                        </FormField>
                        <FormField label="Próximo Cobro">
                            <Input type="date" value={nextBillingDate} onChange={(e) => setNextBillingDate(e.target.value)} />
                        </FormField>
                    </FormGrid>
                    <FormField label="Notas">
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </FormField>
                </FormSection>

                <FormSection title="Historial de Gastos">
                    <div className="mb-4">
                        <Button variant="secondary" size="sm" onClick={() => setShowExpenseModal(true)}>
                            + Registrar Pago
                        </Button>
                    </div>
                    <DataTable
                        columns={columns}
                        data={subscription.expenses}
                        keyExtractor={(row) => row.id}
                        emptyMessage="No hay pagos registrados para esta suscripción."
                    />
                </FormSection>
            </div>

            <Modal
                open={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                title="Registrar Pago"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
                        <Button onClick={handleAddExpense}>Registrar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <FormGrid>
                        <FormField label="Monto Pagado" required>
                            <Input type="number" step="0.01" min="0" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
                        </FormField>
                        <FormField label="Fecha de Pago" required>
                            <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                        </FormField>
                    </FormGrid>
                    <FormField label="Notas">
                        <Textarea value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} />
                    </FormField>
                </div>
            </Modal>
        </>
    );
}
