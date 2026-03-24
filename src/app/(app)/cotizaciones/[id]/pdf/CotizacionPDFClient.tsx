'use client';

import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';

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

const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR');
};

export function CotizacionPDFClient({ quotation }: { quotation: any }) {
    const handlePrint = () => window.print();

    // Subtotales para el bloque de resumen
    const subtotalProductos = Number(quotation.subtotal_products || 0);
    const subtotalServicios = Number(quotation.freight_amount || 0)
        + Number(quotation.installation_amount || 0)
        + Number(quotation.travel_amount || 0)
        + Number(quotation.other_amount || 0)
        + Number(quotation.subtotal_services || 0);
    const descuento = Number(quotation.discount_amount || 0);
    const impuestos = Number(quotation.tax_amount_manual || 0);
    const total = Number(quotation.total_net || 0);

    const productos = (quotation.items || []).filter((i: any) => i.type === 'PRODUCTO');
    const servicios = (quotation.items || []).filter((i: any) => i.type === 'SERVICIO');

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white text-gray-900">
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:w-[210mm]">

                {/* Header UI (no imprime) */}
                <div className="p-4 flex justify-between items-center border-b print:hidden bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Vista previa: Cotización</h2>
                        <p className="text-sm text-gray-500">Documento para el cliente. Tamaño A4. Los precios unitarios no se muestran.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => window.history.back()} variant="secondary">Volver</Button>
                        <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-500 flex items-center gap-2">
                            <Printer className="w-4 h-4" />
                            Imprimir / Guardar PDF
                        </Button>
                    </div>
                </div>

                {/* Área imprimible */}
                <div className="p-8 pb-10 space-y-6 text-sm" id="printable-area">

                    {/* Encabezado */}
                    <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-2 border-2 border-gray-100 shadow-sm">
                                <img
                                    src="/logo-institutional.png"
                                    alt="Liderplast"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg'; }}
                                />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Liderplast</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fábrica de Piletas & Logística</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-black uppercase text-gray-900 leading-tight">Cotización</h2>
                            <p className="text-xl font-bold text-gray-500">Nº {quotation.quotation_number}</p>
                            <p className="text-xs font-medium text-gray-400 mt-1">Emitida: {formatDate(quotation.created_at)}</p>
                            {quotation.expires_at && (
                                <p className="text-xs font-bold text-amber-600 mt-0.5">
                                    Válida hasta: {formatDateShort(quotation.expires_at)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Datos del cliente */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Datos del Cliente</h3>
                                <p className="text-lg font-black text-gray-900 leading-tight">{quotation.client_name}</p>
                                {quotation.client_document && (
                                    <p className="text-xs font-medium text-gray-500">DNI/CUIT: {quotation.client_document}</p>
                                )}
                                {quotation.client_phone && (
                                    <p className="text-xs font-medium text-gray-500">Tel: {quotation.client_phone}</p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lugar de Entrega</h3>
                                <p className="text-sm font-bold text-gray-800">{quotation.delivery_address}</p>
                                <p className="text-xs font-medium text-gray-600 uppercase">
                                    {quotation.city}{quotation.province?.name ? `, ${quotation.province.name}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest not-italic mb-2">Observaciones</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">{quotation.notes || 'Sin observaciones adicionales.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de ítems — SIN precio unitario ni subtotal por ítem */}
                    <div className="mt-4 border-2 border-gray-900 rounded-xl overflow-hidden min-h-[300px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-5 py-3">Descripción del Producto / Servicio</th>
                                    <th className="px-5 py-3 text-center w-24">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Productos */}
                                {productos.map((item: any, idx: number) => (
                                    <tr key={`p-${idx}`} className="bg-white">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900 text-sm">{item.description}</p>
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold">{item.quantity}</td>
                                    </tr>
                                ))}

                                {/* Servicios de ítems (si los hay) */}
                                {servicios.map((item: any, idx: number) => (
                                    <tr key={`s-${idx}`} className="bg-white">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900 text-sm">{item.description}</p>
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold">{item.quantity}</td>
                                    </tr>
                                ))}

                                {/* Fila de servicios logísticos (flete, instalación, etc.) si existen */}
                                {(quotation.freight_amount > 0 || quotation.installation_amount > 0 || quotation.travel_amount > 0 || quotation.other_amount > 0) && (
                                    <tr className="bg-gray-50/50">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900 text-sm">Servicios Logísticos e Instalación</p>
                                            <p className="text-[9px] text-gray-500 italic">Incluye flete, instalación, viáticos y otros</p>
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold">1</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bloque de totales */}
                    <div className="flex justify-between items-end gap-10">
                        <div className="flex-1 text-[10px] text-gray-400 font-bold leading-relaxed max-w-sm">
                            <p>
                                Esta cotización no es válida como factura ni constituye un compromiso de venta.
                                {quotation.expires_at && (
                                    <> Los precios y condiciones son válidos hasta el <strong>{formatDateShort(quotation.expires_at)}</strong>.</>
                                )}
                            </p>
                        </div>
                        <div className="w-72 space-y-2 bg-gray-50 p-5 rounded-2xl border-2 border-gray-900 shadow-sm mt-4">
                            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <span>Subtotal Productos</span>
                                <span>{formatCurrency(subtotalProductos)}</span>
                            </div>
                            {subtotalServicios > 0 && (
                                <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <span>Subtotal Servicios</span>
                                    <span>{formatCurrency(subtotalServicios)}</span>
                                </div>
                            )}
                            {impuestos > 0 && (
                                <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <span>Impuestos / Otros</span>
                                    <span>+{formatCurrency(impuestos)}</span>
                                </div>
                            )}
                            {descuento > 0 && (
                                <div className="flex justify-between items-center text-[11px] font-bold text-red-600 uppercase tracking-wider">
                                    <span>Descuento</span>
                                    <span>-{formatCurrency(descuento)}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-300 flex justify-between items-center">
                                <span className="text-xs font-black text-gray-950 uppercase tracking-widest">Total</span>
                                <span className="text-xl font-black text-gray-950 tracking-tighter">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
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
