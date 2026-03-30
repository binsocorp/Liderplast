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

    const descuento = Number(quotation.discount_amount || 0);
    const impuestos = Number(quotation.tax_amount_manual || 0);
    const total = Number(quotation.total_net || 0);

    const productos = (quotation.items || []).filter((i: any) => i.type === 'PRODUCTO');
    const servicios = (quotation.items || []).filter((i: any) => i.type === 'SERVICIO');

    const hasLogistics = quotation.freight_amount > 0 || quotation.installation_amount > 0 || quotation.travel_amount > 0 || quotation.other_amount > 0;
    const totalLines = productos.length + servicios.length + (hasLogistics ? 1 : 0);

    let tablePadding = "py-3";
    let textClass = "text-sm";

    if (totalLines > 10) {
        tablePadding = "py-1";
        textClass = "text-[10px]";
    } else if (totalLines > 6) {
        tablePadding = "py-1.5";
        textClass = "text-[11px]";
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white text-gray-900 flex flex-col items-center">

            {/* Header UI (no imprime) - OUTSIDE the A4 page container */}
            <div className="w-full max-w-4xl p-4 flex justify-between items-center bg-white border print:hidden shadow-sm rounded-xl mb-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Vista previa: Cotización</h2>
                    <p className="text-sm text-gray-500">Documento dinámico. Imprime exactamente en 1 página A4.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => window.history.back()} variant="secondary">Volver</Button>
                    <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-500 flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir / Guardar PDF
                    </Button>
                </div>
            </div>

            {/* Área imprimible A4 estricta */}
            <div className="w-full max-w-4xl min-h-[calc(100vh-10rem)] bg-white shadow-2xl print:shadow-none flex flex-col relative" id="printable-area">
                <div className="p-10 flex-1 flex flex-col text-sm h-full">

                    {/* ================= ENCABEZADO ================= */}
                    <div className="shrink-0">
                        <div className="flex justify-between items-start border-b-4 border-gray-900 pb-4">
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
                        <div className="grid grid-cols-2 gap-8 mt-6">
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
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic h-full">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest not-italic mb-2">Observaciones</h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">{quotation.notes || 'Sin observaciones adicionales.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= TABLA ================= */}
                    <div className="border-2 border-gray-900 rounded-xl overflow-hidden mt-6 flex-1 flex flex-col min-h-0">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-white font-black uppercase text-[10px] tracking-widest shrink-0">
                                <tr>
                                    <th className="px-5 py-2">Descripción del Producto / Servicio</th>
                                    <th className="px-5 py-2 text-center w-24">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Productos */}
                                {productos.map((item: any, idx: number) => (
                                    <tr key={`p-${idx}`} className="bg-white">
                                        <td className={`px-5 ${tablePadding}`}>
                                            <p className={`font-bold text-gray-900 ${textClass}`}>{item.description}</p>
                                        </td>
                                        <td className={`px-5 ${tablePadding} text-center font-bold ${textClass}`}>{item.quantity}</td>
                                    </tr>
                                ))}

                                {/* Servicios de ítems */}
                                {servicios.map((item: any, idx: number) => (
                                    <tr key={`s-${idx}`} className="bg-white">
                                        <td className={`px-5 ${tablePadding}`}>
                                            <p className={`font-bold text-gray-900 ${textClass}`}>{item.description}</p>
                                        </td>
                                        <td className={`px-5 ${tablePadding} text-center font-bold ${textClass}`}>{item.quantity}</td>
                                    </tr>
                                ))}

                                {/* Logística */}
                                {hasLogistics && (
                                    <tr className="bg-gray-50/50">
                                        <td className={`px-5 ${tablePadding}`}>
                                            <p className={`font-bold text-gray-900 ${textClass}`}>Servicios Logísticos e Instalación</p>
                                            <p className="text-[9px] text-gray-500 italic mt-0.5">Incluye flete, instalación, viáticos y otros</p>
                                        </td>
                                        <td className={`px-5 ${tablePadding} text-center font-bold ${textClass}`}>1</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ================= PIE DE PÁGINA (EMPUJADO AL FINAL) ================= */}
                    <div className="mt-4 shrink-0 pt-2">
                        <div className="flex justify-between items-end gap-10">
                            <div className="flex-1 text-[10px] text-gray-400 font-bold leading-relaxed max-w-sm">
                                <p>
                                    Esta cotización no es válida como factura ni constituye un compromiso de venta.
                                    {quotation.expires_at && (
                                        <> Los precios y condiciones son válidos hasta el <strong className="text-gray-600">{formatDateShort(quotation.expires_at)}</strong>.</>
                                    )}
                                </p>
                            </div>
                            <div className="w-56 space-y-1.5 bg-gray-50 p-4 rounded-2xl border-2 border-gray-900 shadow-sm">
                                {impuestos > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <span>Impuestos / Otros</span>
                                        <span>+{formatCurrency(impuestos)}</span>
                                    </div>
                                )}
                                {descuento > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-bold text-red-600 uppercase tracking-wider">
                                        <span>Descuento</span>
                                        <span>-{formatCurrency(descuento)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-950 uppercase tracking-widest">Total</span>
                                    <span className="text-xl font-black text-gray-950 tracking-tighter">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] text-center border-t border-dashed border-gray-200">
                            Gracias por confiar en Liderplast
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
                    /* Ocultamos cualquier componente ajeno al ticket */
                    aside, header, nav, .print\\:hidden {
                        display: none !important;
                    }
                    /* Forzar un layout dinámico confinado a la pantalla/impresora en lugar de tamaño mm rígido */
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
