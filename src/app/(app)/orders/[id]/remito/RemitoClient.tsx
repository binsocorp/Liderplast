'use client';

import { Button } from '@/components/ui/Button';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(dateStr));
};

export function RemitoClient({ order }: { order: any }) {
    const handlePrint = () => {
        window.print();
    };

    // Cálculos de Totales
    const subtotalItems = order.items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price_net || 0) * (item.quantity || 0)), 0) || 0;
    const totalServicios = Number(order.freight_amount || 0) + Number(order.installation_amount || 0) + Number(order.travel_amount || 0);
    const totalImpuestos = Number(order.tax_amount_manual || 0) + Number(order.other_amount || 0);

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white text-gray-900">
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:w-[210mm]">
                {/* Header (UI Only) */}
                <div className="p-4 flex justify-between items-center border-b print:hidden bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Vista previa: Remito de Venta</h2>
                        <p className="text-sm text-gray-500">Documento para el cliente. Tamaño A4.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => window.history.back()} variant="secondary">Volver</Button>
                        <Button onClick={handlePrint} className="bg-primary-600">Imprimir / Guardar PDF</Button>
                    </div>
                </div>

                {/* Printable Area */}
                <div className="p-8 pb-10 space-y-6 text-sm" id="printable-area">
                    {/* Top Header */}
                    <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 border-2 border-gray-100 shadow-sm">
                                <img
                                    src="/logo-institutional.png"
                                    alt="Liderplast"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/logo.svg';
                                    }}
                                />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Liderplast</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fábrica de Piletas & Logística</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black uppercase text-gray-900 leading-tight">Remito</h2>
                            <p className="text-xl font-bold text-gray-500">Nº {order.order_number}</p>
                            <p className="text-xs font-medium text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                        </div>
                    </div>

                    {/* Client & Shipping Details */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Datos del Cliente</h3>
                                <p className="text-lg font-black text-gray-900 leading-tight">{order.client_name}</p>
                                <p className="text-xs font-medium text-gray-500">DNI/CUIT: {order.client_document || '—'}</p>
                                <p className="text-xs font-medium text-gray-500">Tel: {order.client_phone || '—'}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lugar de Entrega</h3>
                                <p className="text-sm font-bold text-gray-800">{order.delivery_address}</p>
                                <p className="text-xs font-medium text-gray-600 uppercase">{order.city}, {order.province?.name}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest not-italic mb-2">Notas del Pedido</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">{order.notes || 'Sin observaciones adicionales.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mt-4 border-2 border-gray-900 rounded-xl overflow-hidden min-h-[350px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-5 py-3">Descripción del Producto / Servicio</th>
                                    <th className="px-5 py-3 text-center w-20">Cant.</th>
                                    <th className="px-5 py-3 text-right">Unitario</th>
                                    <th className="px-5 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="bg-white">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900 text-sm">{item.description}</p>
                                            {item.catalog_item && <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">SKU: {item.catalog_item.name}</p>}
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold">{item.quantity}</td>
                                        <td className="px-5 py-3 text-right text-gray-600 text-xs">{formatCurrency(item.unit_price_net)}</td>
                                        <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(item.unit_price_net * item.quantity)}</td>
                                    </tr>
                                ))}

                                {/* Services Row if any */}
                                {totalServicios > 0 && (
                                    <tr className="bg-gray-50/50 text-xs">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900">Servicios Logísticos e Instalación</p>
                                            <p className="text-[9px] text-gray-500 italic">Incluye flete, instalación y viáticos</p>
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold text-sm">1</td>
                                        <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(totalServicios)}</td>
                                        <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(totalServicios)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Totals */}
                    <div className="flex justify-between items-end gap-10">
                        <div className="flex-1 text-[10px] text-gray-400 font-bold leading-relaxed max-w-sm">
                            <p>Este remito no es válido como factura. <br />La mercadería se entrega en las condiciones especificadas y el cliente manifiesta su conformidad con la recepción.</p>
                        </div>
                        <div className="w-72 space-y-2 bg-gray-50 p-5 rounded-2xl border-2 border-gray-900 shadow-sm mt-4">
                            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotalItems + totalServicios)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <span>Impuestos / Otros</span>
                                <span>{formatCurrency(totalImpuestos)}</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between items-center text-[11px] font-bold text-red-600 uppercase tracking-wider">
                                    <span>Descuento</span>
                                    <span>-{formatCurrency(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-300 flex justify-between items-center">
                                <span className="text-xs font-black text-gray-950 uppercase tracking-widest">Total Final</span>
                                <span className="text-xl font-black text-gray-950 tracking-tighter">{formatCurrency(order.total_net)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="pt-8 text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] text-center border-t border-dashed border-gray-200">
                        Gracias por confiar en Liderplast
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }

                    aside, header {
                        display: none !important;
                    }

                    html, body, main, .h-screen, .overflow-hidden, .overflow-y-auto {
                        height: auto !important;
                        min-height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    main {
                        padding: 0 !important;
                        background-color: white !important;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    
                    #printable-area {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 15mm !important;
                        border: none !important;
                    }

                    .bg-gray-900 {
                        background-color: #111827 !important;
                        color: white !important;
                    }
                    .text-white { color: white !important; }
                }
            `}</style>
        </div>
    );
}
