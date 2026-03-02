'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { updateOrder } from './actions';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types/database';

interface OrderRow extends Order {
    province?: { id: string; name: string } | null;
    seller?: { id: string; name: string } | null;
    trip?: { id: string; trip_code: string; driver?: { name: string } } | null;
    installer?: { id: string; name: string } | null;
    reseller?: { id: string; name: string } | null;
    order_items?: any[];
    _driver_name?: string;
    _trip_code?: string;
}

interface OrderDrawerProps {
    order: OrderRow | null;
    onClose: () => void;
    lookups: {
        sellers: any[];
        provinces: any[];
        installers: any[];
        trips: any[];
        resellers: any[];
    };
}

export function OrderDrawer({ order, onClose, lookups }: OrderDrawerProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('');
    const [installerId, setInstallerId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (order) {
            setNotes(order.notes || '');
            setStatus(order.status || 'PENDIENTE');
            setInstallerId(order.installer_id || '');
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [order]);

    if (!order) return null;

    const formatMoney = (val: number) =>
        `$${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOrder(order.id, {
                notes,
                status: status as any,
                installer_id: installerId || null
            });
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    // Cálculos de Desglose
    const subtotalItems = order.order_items?.reduce((acc, item) => acc + (Number(item.unit_price_net || 0) * (item.quantity || 0)), 0) || 0;
    const totalServicios = Number(order.freight_amount || 0) + Number(order.installation_amount || 0) + Number(order.travel_amount || 0);
    const totalImpuestos = Number(order.tax_amount_manual || 0) + Number(order.other_amount || 0);

    return (
        <>
            <div
                ref={overlayRef}
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Detalle del Pedido</h2>
                        <p className="text-sm text-gray-400 font-bold">#{order.order_number?.split('-')[1] || order.order_number}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
                    {/* Status & Editing Section */}
                    <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 space-y-4 shadow-inner">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado del Pedido</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                                >
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="CONFIRMADO">Confirmado</option>
                                    <option value="EN_VIAJE">En Viaje</option>
                                    <option value="ESPERANDO_INSTALACION">Esperando Instalación</option>
                                    <option value="COMPLETADO">Completado</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instalador Asignado</label>
                                <select
                                    value={installerId}
                                    onChange={(e) => setInstallerId(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                                >
                                    <option value="">Sin Asignar</option>
                                    {lookups.installers.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Resumen Financiero
                        </h3>
                        <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50 space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                                <span>Subtotal Productos</span>
                                <span>{formatMoney(subtotalItems)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                                <span>Total Servicios (Flete/Inst.)</span>
                                <span>{formatMoney(totalServicios)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                                <span>Impuestos y Gastos</span>
                                <span>{formatMoney(totalImpuestos)}</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between items-center text-sm font-bold text-red-600">
                                    <span>Descuento Aplicado</span>
                                    <span>-{formatMoney(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-indigo-100 flex justify-between items-center">
                                <span className="text-xs font-black text-indigo-900 uppercase">Total Neto Final</span>
                                <span className="text-xl font-black text-indigo-950 tracking-tight">{formatMoney(order.total_net)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            Composición del Pedido
                        </h3>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-4 py-2">Producto</th>
                                        <th className="px-4 py-2 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.order_items?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-700 leading-tight">{item.description || item.catalog_item?.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">CANTIDAD: {item.quantity}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-gray-900">{formatMoney(Number(item.unit_price_net) * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Shipping & Freight Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                            Logística y Envío
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: 'Canal', value: order.channel === 'REVENDEDOR' ? 'REVENDEDOR' : 'CLIENTE FINAL' },
                                order.channel === 'REVENDEDOR' && { label: 'Revendedor', value: order.reseller?.name || '—' },
                                { label: 'Localidad / Prov', value: `${order.city || ''}, ${order.province?.name || ''}` },
                                { label: 'Dirección', value: order.delivery_address },
                                { label: 'ID Flete (Viaje)', value: order._trip_code || <span className="text-gray-300">Pendiente</span> },
                                { label: 'Conductor', value: order._driver_name || <span className="text-gray-300">Sin asignar</span> },
                            ].filter(Boolean).map((f: any, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">{f.label}</span>
                                    <span className="text-sm font-bold text-gray-800 text-right">{f.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Notas Adicionales</h3>
                        <textarea
                            className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500/10 outline-none transition-all shadow-inner"
                            placeholder="Notas del pedido..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50/50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-indigo-950 text-white text-[13px] font-black rounded-2xl hover:bg-black transition-all shadow-md active:scale-95 uppercase tracking-wider disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Actualizar Pedido'}
                    </button>
                    <a
                        href={`/orders/${order.id}`}
                        className="w-12 h-12 flex items-center justify-center bg-white text-gray-400 border border-gray-200 rounded-2xl hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
                        title="Edición Completa"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </a>
                </div>
            </div>
        </>
    );
}
