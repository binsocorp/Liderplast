'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createIncome, updateIncome } from './actions';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    orders: any[];
    paymentMethods: any[];
    /** Cuando se pasa, el modal trabaja en modo edición */
    editingIncome?: any;
}

const INCOME_TYPES = [
    { value: 'VENTA', label: 'Ingreso por Venta' },
    { value: 'EXTRAORDINARIO', label: 'Ingreso Extraordinario' },
    { value: 'REINTEGRO_RECUPERO', label: 'Reintegro / Recupero' },
    { value: 'OTRO', label: 'Otro Ingreso' }
];

const INVOICE_TYPES = [
    { value: '', label: 'Sin comprobante' },
    { value: 'FACTURA_A', label: 'Factura A' },
    { value: 'FACTURA_B', label: 'Factura B' },
    { value: 'FACTURA_C', label: 'Factura C' },
    { value: 'RECIBO', label: 'Recibo' },
];

export function NewIncomeModal({ open, onClose, orders, paymentMethods, editingIncome }: ModalProps) {
    const isEdit = !!editingIncome;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [incomeType, setIncomeType] = useState('VENTA');
    const [orderId, setOrderId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [invoiceType, setInvoiceType] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');

    const [orderSearch, setOrderSearch] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (editingIncome) {
            setIssueDate(editingIncome.issue_date || new Date().toISOString().split('T')[0]);
            setIncomeType(editingIncome.income_type || 'VENTA');
            setOrderId(editingIncome.order_id || '');
            setAmount(String(editingIncome.amount || ''));
            setPaymentMethodId(editingIncome.payment_method_id || '');
            setInvoiceType(editingIncome.invoice_type || '');
            setDescription(editingIncome.description || '');
            setNotes(editingIncome.notes || '');
        } else {
            setIssueDate(new Date().toISOString().split('T')[0]);
            setIncomeType('VENTA');
            setOrderId('');
            setAmount('');
            setPaymentMethodId('');
            setInvoiceType('');
            setDescription('');
            setNotes('');
        }
        setError('');
        setOrderSearch('');
    }, [editingIncome, open]);

    const selectedOrder = orders.find(o => o.id === orderId);
    const pendingAmount = selectedOrder
        ? Math.max(0, (Number(selectedOrder.total_net) || 0) - (Number(selectedOrder.paid_amount) || 0))
        : 0;

    const filteredOrders = orders.filter(o => {
        if (o.status === 'CANCELLED' || o.payment_status === 'COBRADA') return false;

        // In edit mode, always include the currently linked order
        if (isEdit && o.id === orderId) return true;

        const pendingValue = Math.max(0, (Number(o.total_net) || 0) - (Number(o.paid_amount) || 0));
        if (pendingValue <= 0) return false;

        if (!orderSearch) return true;
        const q = orderSearch.toLowerCase();
        return o.client_name?.toLowerCase().includes(q) || String(o.order_number).includes(q);
    });

    // Reset order when changing type
    useEffect(() => {
        if (incomeType !== 'VENTA') {
            setOrderId('');
        }
    }, [incomeType]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!amount || Number(amount) <= 0) {
            setError('El monto debe ser mayor a 0');
            return;
        }

        if (incomeType === 'VENTA' && !orderId) {
            setError('Debes seleccionar una venta');
            return;
        }

        const formData = {
            issue_date: issueDate,
            income_type: incomeType,
            order_id: orderId,
            amount,
            payment_method_id: paymentMethodId,
            invoice_type: invoiceType,
            description,
            notes
        };

        setSubmitting(true);
        const res = isEdit
            ? await updateIncome(editingIncome.id, formData)
            : await createIncome(formData);
        setSubmitting(false);

        if (res.error) {
            setError(res.error);
        } else {
            onClose();
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Editar Ingreso' : 'Registrar Ingreso'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="income-form" onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Fecha de Emisión <span className="text-danger-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={issueDate}
                                    onChange={e => setIssueDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Tipo de Ingreso <span className="text-danger-500">*</span></label>
                                <select
                                    required
                                    value={incomeType}
                                    onChange={e => setIncomeType(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                                >
                                    {INCOME_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {incomeType === 'VENTA' && (
                            <div className="space-y-3 bg-primary-50/50 p-4 rounded-xl border border-primary-100">
                                <label className="text-sm font-semibold text-primary-900">Venta Asociada <span className="text-danger-500">*</span></label>

                                {!selectedOrder ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por cliente o número..."
                                                value={orderSearch}
                                                onChange={e => setOrderSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                            />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {filteredOrders.length === 0 ? (
                                                <p className="text-xs text-gray-500 py-2 text-center">No hay ventas pendientes que coincidan.</p>
                                            ) : (
                                                filteredOrders.map(o => (
                                                    <div
                                                        key={o.id}
                                                        onClick={() => setOrderId(o.id)}
                                                        className="p-2 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-primary-200 transition-colors flex justify-between items-center text-sm group"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-gray-900">#{o.order_number}</span>
                                                            <span className="ml-2 text-gray-600">{o.client_name}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-gray-900">${(Number(o.total_net) || 0).toLocaleString('es-AR')}</div>
                                                            <div className="text-xs text-warning-600 font-medium whitespace-nowrap">
                                                                Falta: ${(Math.max(0, (Number(o.total_net) || 0) - (Number(o.paid_amount) || 0)).toLocaleString('es-AR'))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-primary-200">
                                        <div>
                                            <div className="font-bold text-gray-900">Venta #{selectedOrder.order_number} - {selectedOrder.client_name}</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Total Venta: ${(Number(selectedOrder.total_net) || 0).toLocaleString('es-AR')}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-sm font-bold text-warning-600 bg-warning-50 px-2 py-1 rounded-lg">
                                                Saldo Pendiente: ${pendingAmount.toLocaleString('es-AR')}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setOrderId('')}
                                                className="text-xs text-primary-600 hover:text-primary-800 font-medium mt-2"
                                            >
                                                Cambiar venta
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 relative">
                                <label className="text-sm font-semibold text-gray-700">Monto Cobrado <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className={`w-full pl-7 pr-${selectedOrder ? '24' : '3'} py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold`}
                                    />
                                    {selectedOrder && (
                                        <button
                                            type="button"
                                            onClick={() => setAmount(pendingAmount.toString())}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-primary-100 hover:bg-primary-200 text-primary-700 font-bold px-2 py-1 rounded"
                                        >
                                            COMPLETO
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Medio de Pago</label>
                                <select
                                    value={paymentMethodId}
                                    onChange={e => setPaymentMethodId(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                                >
                                    <option value="">Seleccionar...</option>
                                    {paymentMethods.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Tipo de Comprobante</label>
                            <select
                                value={invoiceType}
                                onChange={e => setInvoiceType(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                            >
                                {INVOICE_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Descripción</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ej: Pago parcial, Transferencia honorarios..."
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Notas / Observaciones</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium resize-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
                    <Button form="income-form" type="submit" disabled={submitting}>
                        {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Guardar Ingreso'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
