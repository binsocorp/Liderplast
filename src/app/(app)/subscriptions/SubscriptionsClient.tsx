'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select, Textarea } from '@/components/ui/FormInputs';
import { createSubscription } from './actions';
import type { UserSubscription, BillingCycle, SubscriptionStatus } from '@/lib/types/database';

interface SubscriptionRow extends UserSubscription {
    expenses: { amount: number }[];
}

interface SubscriptionsClientProps {
    subscriptions: SubscriptionRow[];
}

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
    const [cost, setCost] = useState('0');
    const [currency, setCurrency] = useState('ARS');
    const [nextBillingDate, setNextBillingDate] = useState('');
    const [notes, setNotes] = useState('');

    async function handleCreate() {
        setError(null);
        const result = await createSubscription({
            title,
            status: 'ACTIVE',
            billing_cycle: billingCycle,
            cost: parseFloat(cost) || 0,
            currency,
            next_billing_date: nextBillingDate || null,
            notes,
        });

        if (result.error) {
            setError(result.error);
        } else {
            setShowModal(false);
            router.refresh();
            if (result.data) {
                router.push(`/subscriptions/${result.data.id}`);
            }
        }
    }

    const columns: Column<SubscriptionRow>[] = [
        {
            key: 'title',
            label: 'Suscripción',
            render: (row) => <span className="font-semibold text-gray-900">{row.title}</span>,
        },
        {
            key: 'status',
            label: 'Estado',
            render: (row) => <Badge status={row.status} />,
        },
        {
            key: 'cost',
            label: 'Costo',
            render: (row) => (
                <span className="font-medium text-gray-700">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: row.currency }).format(Number(row.cost))}
                </span>
            ),
        },
        {
            key: 'billing_cycle',
            label: 'Ciclo',
            render: (row) => (
                <span className="text-sm">
                    {row.billing_cycle === 'MONTHLY' ? 'Mensual' : row.billing_cycle === 'YEARLY' ? 'Anual' : 'Otro'}
                </span>
            ),
        },
        {
            key: 'next_billing_date',
            label: 'Próx. Cobro',
            render: (row) => row.next_billing_date ? new Intl.DateTimeFormat('es-AR').format(new Date(row.next_billing_date)) : '-',
        },
        {
            key: 'total_spent',
            label: 'Histórico Gastado',
            render: (row) => {
                const total = row.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
                return (
                    <span className="text-sm font-medium text-gray-500">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: row.currency }).format(total)}
                    </span>
                );
            },
        }
    ];

    return (
        <>
            <PageHeader
                title="Mis Suscripciones"
                subtitle="Control de gastos recurrentes"
                actions={
                    <Button onClick={() => setShowModal(true)}>
                        + Nueva Suscripción
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={subscriptions}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => router.push(`/subscriptions/${row.id}`)}
                emptyMessage="No tienes suscripciones registradas."
            />

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title="Nueva Suscripción"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button onClick={handleCreate}>Guardar</Button>
                    </>
                }
            >
                {error && <div className="mb-4 text-sm text-danger-500">{error}</div>}
                <div className="space-y-4">
                    <FormField label="Título" required>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Netflix, Servidor, Spotify..." />
                    </FormField>
                    <FormGrid>
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
                </div>
            </Modal>
        </>
    );
}
