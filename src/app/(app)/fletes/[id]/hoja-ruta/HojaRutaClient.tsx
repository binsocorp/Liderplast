'use client';

import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';

// Utility to format date
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(dateStr));
};

export function HojaRutaClient({ trip, orders }: { trip: any; orders: any[] }) {

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white text-gray-900">
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:w-[210mm]">
                {/* Print button (hidden from print media) */}
                <div className="p-4 flex justify-between items-center border-b print:hidden bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Vista previa: Hoja de Ruta</h2>
                        <p className="text-sm text-gray-500">Configure en "Tamaño: A4" al imprimir o guardar como PDF.</p>
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
                <div className="p-8 pb-12 text-sm text-gray-800 space-y-8" id="printable-area">
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

                    {/* Itinerary List */}
                    <div>
                        <h3 className="text-lg font-black text-gray-900 border-b pb-2 mb-4 uppercase tracking-wider flex justify-between items-end">
                            Itinerario de Entregas
                            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Orden de reparto</span>
                        </h3>

                        <div className="space-y-6">
                            {orders.map((order, index) => (
                                <div key={order.id} className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm print:shadow-none break-inside-avoid">
                                    {/* Order Header */}
                                    <div className="bg-gray-100 flex justify-between items-center px-4 py-3 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-950 text-white font-black w-7 h-7 rounded-sm flex items-center justify-center text-sm shadow-inner">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-sm text-gray-900">{order.client_name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Ref: #{order.order_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold text-gray-600">Doc: <span className="font-normal">{order.client_document || '-'}</span></p>
                                            <p className="text-[11px] font-bold text-gray-600 mt-0.5">Te: <span className="font-normal font-mono">{order.client_phone || '-'}</span></p>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Left Col: Location */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    <p className="font-black text-[10px] uppercase text-primary-700 tracking-widest">Ubicación de Entrega</p>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">{order.delivery_address || 'Sin especificar'}</p>
                                                <p className="text-[11px] text-gray-500 font-medium uppercase mt-0.5">{order.city || '-'}, {order.province?.name || '-'}</p>

                                                {order.notes && (
                                                    <div className="mt-2.5 bg-yellow-50 p-2 border border-yellow-200 text-[10px] text-yellow-800 rounded">
                                                        <span className="font-black uppercase mr-1 inline-block">Nota: </span>
                                                        <span className="opacity-90">{order.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Right Col: Items */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                    <p className="font-black text-[10px] uppercase text-primary-700 tracking-widest">Contenido / Bultos</p>
                                                </div>
                                                <ul className="text-[11px] space-y-1 text-gray-700">
                                                    {order.items?.map((item: any, i: number) => (
                                                        <li key={i} className="flex gap-2 items-start">
                                                            <span className="font-bold text-gray-900 min-w-4 text-right">{item.quantity}x</span>
                                                            <span className="leading-tight shrink">{item.description}</span>
                                                        </li>
                                                    ))}
                                                    {(!order.items || order.items.length === 0) && <li className="italic text-gray-400">Sin detalle de productos</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking / Signature Area */}
                                    <div className="bg-gray-50 border-t border-gray-200 grid grid-cols-7 divide-x divide-gray-200 uppercase">
                                        <div className="col-span-2 p-3 flex flex-col justify-center items-start gap-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3.5 h-3.5 border-2 border-gray-400 rounded-sm"></div>
                                                <span className="text-[10px] font-black text-gray-600 tracking-wider">Entregado</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3.5 h-3.5 border-2 border-gray-400 rounded-sm"></div>
                                                <span className="text-[10px] font-black text-gray-400 tracking-wider">Pendiente</span>
                                            </div>
                                        </div>
                                        <div className="col-span-3 p-3 flex flex-col justify-end min-h-[60px]">
                                            <div className="w-full border-b border-dashed border-gray-300 mb-1.5"></div>
                                            <p className="text-[9px] text-gray-400 tracking-widest font-black uppercase text-center block">Observaciones Conductor</p>
                                        </div>
                                        <div className="col-span-2 p-3 flex flex-col justify-end min-h-[60px]">
                                            <div className="w-full border-b border-gray-400 mb-1.5"></div>
                                            <p className="text-[9px] text-gray-500 tracking-widest font-black uppercase text-center block">Firma y Aclaración</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Viaje sin pedidos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="flex justify-between items-center border-t-2 border-gray-900 pt-3 mt-8">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Generado el {new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-950"></div>
                            <p className="text-[10px] font-black text-gray-800 tracking-widest uppercase">Liderplast Logística</p>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }

                    /* Hide Next.js layout components */
                    aside, header {
                        display: none !important;
                    }

                    /* Override Layout structural limits for multi-page */
                    html, body, main, .h-screen, .overflow-hidden, .overflow-y-auto {
                        height: auto !important;
                        min-height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    /* Remove layout paddings/backgrounds */
                    main {
                        padding: 0 !important;
                        background-color: white !important;
                    }

                    /* Ensure printable area is pristine */
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: white !important;
                    }
                    
                    #printable-area {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Page break fixes for cards */
                    .break-inside-avoid {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
