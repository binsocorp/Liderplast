'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ExternalLink, CheckCircle, XCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { acceptQuotation, cancelQuotation, deleteQuotation } from '../actions';
import type { QuotationWithRelations } from '@/lib/types/database';
import { isQuotationExpired } from '@/lib/types/database';
import { useToast } from '@/components/ui/Toast';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR');
};

function StatusBadge({ quotation }: { quotation: QuotationWithRelations }) {
    const expired = isQuotationExpired(quotation);
    if (quotation.status === 'ACEPTADA') {
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-black uppercase tracking-wider">Aceptada</span>;
    }
    if (quotation.status === 'RECHAZADA') {
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-black uppercase tracking-wider">Rechazada</span>;
    }
    if (expired) {
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">Vencida</span>;
    }
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-black uppercase tracking-wider">Activa</span>;
}

interface Props {
    quotation: QuotationWithRelations;
    convertedOrderNumber: string | null;
}

export function CotizacionDetailClient({ quotation, convertedOrderNumber }: Props) {
    const router = useRouter();
    const { addToast } = useToast();
    const [loadingAccept, setLoadingAccept] = useState(false);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isEditable = quotation.status === 'COTIZACION';
    const expired = isQuotationExpired(quotation);

    const subtotalServicios = quotation.freight_amount + quotation.installation_amount +
        quotation.travel_amount + quotation.other_amount + quotation.subtotal_services;

    async function handleAccept() {
        setLoadingAccept(true);
        setError(null);
        const result = await acceptQuotation(quotation.id);
        if (result.error) {
            setError(result.error);
            addToast({
                type: 'error',
                title: 'Error al aceptar cotización',
                message: result.error,
            });
            setLoadingAccept(false);
            return;
        }
        addToast({
            type: 'success',
            title: `Pedido ${result.data!.orderNumber || ''} creado exitosamente`,
            message: `La cotización ${quotation.quotation_number} fue aceptada.`,
            action: {
                label: `Ver pedido ${result.data!.orderNumber || ''}`,
                href: `/orders/${result.data!.orderId}`,
            },
            duration: 8000,
        });
        router.refresh();
        setLoadingAccept(false);
    }

    async function handleCancel() {
        setLoadingCancel(true);
        setError(null);
        const result = await cancelQuotation(quotation.id);
        if (result.error) {
            setError(result.error);
            setLoadingCancel(false);
            return;
        }
        setShowCancelConfirm(false);
        router.refresh();
    }

    async function handleDelete() {
        setLoadingDelete(true);
        setError(null);
        const result = await deleteQuotation(quotation.id);
        if ('error' in result) {
            setError(result.error);
            setLoadingDelete(false);
            setShowDeleteConfirm(false);
            return;
        }
        router.push('/cotizaciones');
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/cotizaciones" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{quotation.quotation_number}</h1>
                            <StatusBadge quotation={quotation} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Emitida el {new Date(quotation.created_at).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={`/api/cotizaciones/${quotation.id}/pdf`}
                        download={`COT-${quotation.quotation_number}.pdf`}
                        className="inline-flex items-center gap-2 h-9 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Descargar PDF
                    </a>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Datos del cliente */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Datos del Cliente</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Nombre</span>
                                <span className="font-bold text-gray-900">{quotation.client_name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Teléfono</span>
                                <span className="text-gray-700">{quotation.client_phone || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">DNI / CUIT</span>
                                <span className="text-gray-700">{quotation.client_document || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Canal</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${quotation.channel === 'REVENDEDOR' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {quotation.channel === 'REVENDEDOR' ? quotation.reseller?.name ?? 'Revendedor' : 'Cliente Final'}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Dirección de entrega</span>
                                <span className="text-gray-700">{quotation.delivery_address} — {quotation.city}{quotation.province ? `, ${quotation.province.name}` : ''}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de ítems */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detalle de Ítems</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="py-2 px-4 text-left">Descripción</th>
                                    <th className="py-2 px-4 text-center">Tipo</th>
                                    <th className="py-2 px-4 text-center">Cant.</th>
                                    <th className="py-2 px-4 text-right">Precio Unit.</th>
                                    <th className="py-2 px-4 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(quotation.items ?? []).length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-xs">Sin ítems</td></tr>
                                ) : (
                                    (quotation.items ?? []).map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="py-2.5 px-4 font-medium text-gray-800">{item.description}</td>
                                            <td className="py-2.5 px-4 text-center">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === 'PRODUCTO' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {item.type === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-center font-bold">{item.quantity}</td>
                                            <td className="py-2.5 px-4 text-right text-gray-600">{formatCurrency(item.unit_price_net)}</td>
                                            <td className="py-2.5 px-4 text-right font-bold text-gray-900">{formatCurrency(item.subtotal_net)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Notas */}
                    {quotation.notes && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notas</h2>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.notes}</p>
                        </div>
                    )}
                </div>

                {/* Panel derecho */}
                <div className="space-y-4">
                    {/* Acciones */}
                    {isEditable && !expired && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Acciones</h2>
                            <button
                                onClick={handleAccept}
                                disabled={loadingAccept}
                                className="w-full h-10 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                {loadingAccept ? 'Procesando...' : 'Aceptar Cotización'}
                            </button>
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="w-full h-10 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100"
                            >
                                <XCircle className="w-4 h-4" />
                                Rechazar Cotización
                            </button>
                        </div>
                    )}

                    {/* Confirmación de cancelación */}
                    {showCancelConfirm && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                            <p className="text-sm font-bold text-red-700">¿Confirmar cancelación?</p>
                            <p className="text-xs text-red-600">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancel}
                                    disabled={loadingCancel}
                                    className="flex-1 h-9 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    {loadingCancel ? 'Cancelando...' : 'Confirmar'}
                                </button>
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="flex-1 h-9 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Volver
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Eliminar cotización (solo si no tiene pedido vinculado) */}
                    {!quotation.converted_order_id && (
                        showDeleteConfirm ? (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                                <p className="text-sm font-bold text-red-700">¿Eliminar cotización?</p>
                                <p className="text-xs text-red-600">Esta acción no se puede deshacer.</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        disabled={loadingDelete}
                                        className="flex-1 h-9 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                                    >
                                        {loadingDelete ? 'Eliminando...' : 'Confirmar'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 h-9 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full h-10 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Cotización
                            </button>
                        )
                    )}

                    {/* Pedido generado (si ACEPTADA) */}
                    {quotation.status === 'ACEPTADA' && quotation.converted_order_id && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                            <h2 className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Pedido Generado</h2>
                            <Link
                                href={`/orders/${quotation.converted_order_id}`}
                                className="inline-flex items-center gap-2 text-sm font-black text-green-700 hover:text-green-900 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {convertedOrderNumber ?? 'Ver Pedido'}
                            </Link>
                        </div>
                    )}

                    {/* Resumen financiero */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Resumen Financiero</h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal Productos</span>
                                <span className="font-bold text-gray-800">{formatCurrency(quotation.subtotal_products)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal Servicios</span>
                                <span className="font-bold text-gray-800">{formatCurrency(subtotalServicios)}</span>
                            </div>
                            {quotation.discount_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-red-500">Descuento</span>
                                    <span className="font-bold text-red-600">-{formatCurrency(quotation.discount_amount)}</span>
                                </div>
                            )}
                            {quotation.tax_amount_manual > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Impuestos / Otros</span>
                                    <span className="font-bold text-gray-800">+{formatCurrency(quotation.tax_amount_manual)}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                <span className="font-black text-gray-900 uppercase text-[11px] tracking-widest">TOTAL</span>
                                <span className="text-xl font-black text-gray-900">{formatCurrency(quotation.total_net)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Validez */}
                    <div className={`rounded-2xl border p-5 ${expired && isEditable ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Validez</h2>
                        {quotation.expires_at ? (
                            <div>
                                <p className={`font-bold text-sm ${expired ? 'text-amber-700' : 'text-gray-800'}`}>
                                    {formatDate(quotation.expires_at)}
                                </p>
                                {expired && isEditable && (
                                    <p className="text-xs text-amber-600 mt-1 font-medium">⚠ Esta cotización ha vencido</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Sin fecha de vencimiento</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
