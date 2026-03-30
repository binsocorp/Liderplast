'use client';

import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(dateStr));
};

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-AR').format(new Date(dateStr + 'T12:00:00'));
};

export function HojaRutaClient({
    trip,
    orders,
    incomesByOrder = {},
}: {
    trip: any;
    orders: any[];
    incomesByOrder?: Record<string, any[]>;
}) {

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white text-gray-900 flex flex-col items-center">

            {/* Print button (hidden from print media) */}
            <div className="w-full max-w-4xl p-4 flex justify-between items-center bg-white border print:hidden shadow-sm rounded-xl mb-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Vista previa: Hoja de Ruta</h2>
                    <p className="text-sm text-gray-500">Documento dinámico. Imprime exactamente en 1 página A4.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => window.history.back()} variant="secondary">Volver</Button>
                    <Button onClick={handlePrint} className="bg-primary-600 flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir / Guardar PDF
                    </Button>
                </div>
            </div>

            {/* Printable A4 Area */}
            <div className="w-full max-w-4xl min-h-[calc(100vh-10rem)] bg-white shadow-2xl print:shadow-none flex flex-col relative" id="printable-area">
                <div className="p-10 flex-1 flex flex-col text-sm h-full">

                    <div className="shrink-0 space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-widest text-gray-900">Hoja de Ruta</h1>
                                <p className="text-sm font-bold text-gray-500 uppercase mt-1">Documento de Expedición Logística</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase font-bold text-gray-400">ID Viaje / Código</p>
                                <p className="text-xl font-black text-indigo-950">{trip.trip_code}</p>
                                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{formatDate(trip.trip_date)}</p>
                            </div>
                        </div>

                        {/* Trip / Driver Details */}
                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Información de Ruta</p>
                                <p className="font-bold text-sm text-gray-900">Destino Principal: <span className="font-normal">{trip.province?.name || 'N/A'}</span></p>
                                <p className="font-bold text-sm text-gray-900 mt-1">Total Pedidos: <span className="font-normal">{orders.length}</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Detalles de Logística</p>
                                <p className="font-bold text-sm text-gray-900">Vehículo: <span className="font-normal">{trip.vehicle?.name || 'N/A'}</span></p>
                                <p className="font-bold text-sm text-gray-900 mt-1">Conductor: <span className="font-normal">{trip.driver?.name || 'N/A'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Itinerary List */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-6 mb-2">
                        <h3 className="text-lg font-black text-gray-900 border-b pb-2 mb-2 uppercase tracking-wider flex justify-between items-end shrink-0">
                            Itinerario de Entregas
                            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Orden de reparto</span>
                        </h3>

                        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                            {orders.map((order, index) => {
                                const totalNet = Number(order.total_net || 0);
                                const paidAmount = Number(order.paid_amount || 0);
                                const pendingBalance = totalNet - paidAmount;
                                const isPaid = pendingBalance <= 0;
                                const incomes = incomesByOrder[order.id] || [];

                                return (
                                    <div key={order.id} className="border border-gray-300 rounded-xl overflow-hidden shadow-sm flex flex-col shrink-0">
                                        {/* Order Header */}
                                        <div className="bg-gray-100 flex justify-between items-center px-4 py-2 border-b border-gray-200 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-950 text-white font-black w-6 h-6 rounded-sm flex items-center justify-center text-xs shadow-inner">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-sm text-gray-900">{order.client_name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Ref: #{order.order_number}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-600">Doc: <span className="font-normal">{order.client_document || '-'}</span></p>
                                                <p className="text-[10px] font-bold text-gray-600 mt-0.5">Te: <span className="font-normal font-mono">{order.client_phone || '-'}</span></p>
                                            </div>
                                        </div>

                                        <div className="p-3 flex flex-col gap-2 flex-1 min-h-0">
                                            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                                                {/* Left Col: Location */}
                                                <div className="flex flex-col min-h-0 overflow-hidden">
                                                    <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
                                                        <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        <p className="font-black text-[9px] uppercase text-primary-700 tracking-widest">Ubicación de Entrega</p>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-900 truncate">{order.delivery_address || 'Sin especificar'}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5 truncate">{order.city || '-'}, {order.province?.name || '-'}</p>

                                                    {order.notes && (
                                                        <div className="mt-1.5 bg-yellow-50 p-1.5 border border-yellow-200 text-[9px] text-yellow-800 rounded truncate">
                                                            <span className="font-black uppercase mr-1 inline-block">Nota: </span>
                                                            <span className="opacity-90">{order.notes}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Col: Items */}
                                                <div className="flex flex-col min-h-0 overflow-hidden">
                                                    <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
                                                        <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                        <p className="font-black text-[9px] uppercase text-primary-700 tracking-widest">Contenido / Bultos</p>
                                                    </div>
                                                    <ul className="text-[10px] space-y-0.5 text-gray-700 overflow-hidden">
                                                        {order.items?.slice(0, 3).map((item: any, i: number) => (
                                                            <li key={i} className="flex gap-2 items-start truncate">
                                                                <span className="font-bold text-gray-900 min-w-4 text-right">{item.quantity}x</span>
                                                                <span className="leading-tight shrink truncate">{item.description}</span>
                                                            </li>
                                                        ))}
                                                        {(order.items?.length || 0) > 3 && (
                                                            <li className="italic text-xs text-gray-500">+ {(order.items?.length || 0) - 3} ítems más...</li>
                                                        )}
                                                        {(!order.items || order.items.length === 0) && <li className="italic text-gray-400">Sin detalle</li>}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* ── Sección de Pagos ── */}
                                            {totalNet > 0 && (
                                                <div className="border-t border-gray-200 pt-2 mt-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Estado de pago */}
                                                        <div className="shrink-0">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado de Pago</p>
                                                            {isPaid ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                                    ✓ Pagado
                                                                </span>
                                                            ) : (
                                                                <div>
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                                        Saldo pendiente
                                                                    </span>
                                                                    <p className="text-[11px] font-black text-red-700 mt-0.5">
                                                                        {formatCurrency(pendingBalance)}
                                                                    </p>
                                                                    {paidAmount > 0 && (
                                                                        <p className="text-[9px] text-gray-500 mt-0.5">
                                                                            Pagado: {formatCurrency(paidAmount)} / Total: {formatCurrency(totalNet)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Ingresos registrados */}
                                                        {incomes.length > 0 && (
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pagos Registrados</p>
                                                                <div className="space-y-0.5">
                                                                    {incomes.map((inc: any, i: number) => (
                                                                        <div key={i} className="flex items-center gap-2 text-[10px] text-gray-700">
                                                                            <span className="text-gray-400">•</span>
                                                                            <span className="font-bold text-gray-900">{formatCurrency(Number(inc.amount))}</span>
                                                                            <span className="text-gray-500">{formatDateShort(inc.issue_date)}</span>
                                                                            {inc.payment_method?.name && (
                                                                                <span className="text-gray-500">— {inc.payment_method.name}</span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {incomes.length === 0 && !isPaid && (
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pagos Registrados</p>
                                                                <p className="text-[10px] text-gray-400 italic">Sin ingresos registrados</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tracking / Signature Area */}
                                        <div className="bg-gray-50 border-t border-gray-200 grid grid-cols-7 divide-x divide-gray-200 uppercase shrink-0">
                                            <div className="col-span-2 p-2 flex flex-col justify-center items-start gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-gray-400 rounded-sm"></div>
                                                    <span className="text-[9px] font-black text-gray-600 tracking-wider">Entregado</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-gray-400 rounded-sm"></div>
                                                    <span className="text-[9px] font-black text-gray-400 tracking-wider">Pendiente</span>
                                                </div>
                                            </div>
                                            <div className="col-span-3 p-2 flex flex-col justify-end min-h-[40px]">
                                                <div className="w-full border-b border-dashed border-gray-300 mb-1"></div>
                                                <p className="text-[8px] text-gray-400 tracking-widest font-black uppercase text-center block">Observaciones</p>
                                            </div>
                                            <div className="col-span-2 p-2 flex flex-col justify-end min-h-[40px]">
                                                <div className="w-full border-b border-gray-400 mb-1"></div>
                                                <p className="text-[8px] text-gray-500 tracking-widest font-black uppercase text-center block">Firma y Aclaración</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {orders.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Viaje sin pedidos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto shrink-0 flex justify-between items-center border-t-2 border-gray-900 pt-4 mt-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Generado el {new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-950"></div>
                            <p className="text-[11px] font-black text-gray-800 tracking-widest uppercase">Liderplast Logística</p>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body, html, main {
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white !important;
                        box-sizing: border-box;
                        height: 100vh !important;
                        max-height: 100vh !important;
                        overflow: hidden !important;
                    }
                    aside, header, nav, .print\\:hidden {
                        display: none !important;
                    }
                    #printable-area {
                        width: 100vw !important;
                        height: 100vh !important;
                        max-height: 100vh !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        display: flex !important;
                        flex-direction: column !important;
                        overflow: hidden !important;
                        border: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
