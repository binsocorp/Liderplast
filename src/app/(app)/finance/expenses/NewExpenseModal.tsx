'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, Checkbox } from '@/components/ui/FormInputs';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { createExpense, updateExpense } from './actions';
import { useRouter } from 'next/navigation';

export function NewExpenseModal({
    open,
    onClose,
    expense,
    categories,
    subcategories,
    paymentMethods,
    vendors
}: any) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [issueDate, setIssueDate] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [description, setDescription] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [vendorId, setVendorId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (open) {
            if (expense) {
                setIssueDate(expense.issue_date);
                setAmount(String(expense.amount));
                setCategoryId(expense.category_id);
                setSubcategoryId(expense.subcategory_id || '');
                setPaymentMethodId(expense.payment_method_id);
                setDescription(expense.description);
                setIsPending(expense.status === 'PENDIENTE');
                setVendorId(expense.vendor_id || '');
                setNotes(expense.notes || '');
            } else {
                setIssueDate(new Date().toISOString().split('T')[0]);
                setAmount('');
                setCategoryId('');
                setSubcategoryId('');
                setPaymentMethodId('');
                setDescription('');
                setIsPending(false);
                setVendorId('');
                setNotes('');
            }
            setError(null);
        }
    }, [open, expense]);

    const filteredSubcategories = useMemo(() => {
        if (!categoryId) return [];
        return subcategories.filter((s: any) => s.category_id === categoryId);
    }, [categoryId, subcategories]);

    // Auto-select first subcategory if only one exists or reset if category changes
    useEffect(() => {
        if (categoryId && !expense) {
            if (filteredSubcategories.length === 0) setSubcategoryId('');
        }
    }, [categoryId, filteredSubcategories, expense]);

    async function handleSave() {
        if (!issueDate || !amount || !categoryId || !paymentMethodId || !description) {
            setError('Por favor complete todos los campos obligatorios.');
            return;
        }

        if (Number(amount) <= 0) {
            setError('El monto debe ser mayor a cero.');
            return;
        }

        setSaving(true);
        const data = {
            issue_date: issueDate,
            amount: Number(amount),
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
            payment_method_id: paymentMethodId,
            description,
            status: isPending ? 'PENDIENTE' : 'PAGADO',
            vendor_id: vendorId || null,
            notes,
        };

        const result = expense
            ? await updateExpense(expense.id, data)
            : await createExpense(data);

        if (result.error) {
            setError(result.error);
        } else {
            onClose();
            router.refresh();
        }
        setSaving(false);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={expense ? 'Editar Egreso' : 'Nuevo Egreso'}
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : expense ? 'Guardar Cambios' : 'Crear Egreso'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700 text-sm">
                        {error}
                    </div>
                )}

                <FormGrid>
                    <FormField label="Fecha de Emisión" required>
                        <Input
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                        />
                    </FormField>

                    <FormField label="Monto" required>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                            <Input
                                type="number"
                                className="pl-7"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </FormField>

                    <FormField label="Categoría" required>
                        <Select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
                            placeholder="Seleccionar categoría"
                        />
                    </FormField>

                    <FormField label="Subcategoría" required={filteredSubcategories.length > 0}>
                        <Select
                            value={subcategoryId}
                            onChange={(e) => setSubcategoryId(e.target.value)}
                            options={filteredSubcategories.map((s: any) => ({ value: s.id, label: s.name }))}
                            placeholder={categoryId ? "Seleccionar subcategoría" : "Primero seleccione categoría"}
                            disabled={!categoryId || filteredSubcategories.length === 0}
                        />
                    </FormField>

                    <FormField label="Medio de Pago" required>
                        <Select
                            value={paymentMethodId}
                            onChange={(e) => setPaymentMethodId(e.target.value)}
                            options={paymentMethods.map((p: any) => ({ value: p.id, label: p.name }))}
                            placeholder="Seleccionar medio"
                        />
                    </FormField>

                    <FormField label="Descripción" required>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Pago de flete a Juan"
                        />
                    </FormField>
                </FormGrid>

                <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                    <Checkbox
                        label="Marcar como pendiente de pago"
                        checked={isPending}
                        onChange={(e) => setIsPending(e.target.checked)}
                    />

                    <FormGrid>
                        <FormField label="Proveedor (Opcional)">
                            <Select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                options={vendors.map((v: any) => ({ value: v.id, label: v.name }))}
                                placeholder="Seleccionar proveedor"
                            />
                        </FormField>
                        <FormField label="Notas / Comentarios">
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Información adicional..."
                                rows={2}
                            />
                        </FormField>
                    </FormGrid>
                </div>
            </div>
        </Modal>
    );
}
