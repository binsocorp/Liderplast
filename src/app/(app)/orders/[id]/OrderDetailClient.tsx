'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/FormInputs';
import { Button } from '@/components/ui/Button';
import { updateOrder } from '../actions';
import { replaceOrderItems } from '../bulkActions';
import type { SalesChannel, OrderStatus } from '@/lib/types/database';
import { Badge } from '@/components/ui/Badge';

export function OrderDetailClient({
    order,
    items,
    provinces,
    clients,
    sellers,
    catalogItems,
    prices,
    trips,
    occupancy,
}: any) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helpers to init data
    const getItemQty = (name: string) => {
        const item = items.find((i: any) => i.description === name || i.catalog_item?.name === name);
        return item ? item.quantity : 0;
    };

    const hasItem = (name: string) => getItemQty(name) > 0;
    const findCasco = () => items.find((i: any) => i.catalog_item?.name.startsWith('P-'));

    // Header State
    const [sellerId, setSellerId] = useState(order.seller_id || '');
    const [provinceId, setProvinceId] = useState(order.province_id || '');
    const [clientId, setClientId] = useState(order.client_id || '');
    const [clientName, setClientName] = useState(order.client_name || '');
    const [document, setDocument] = useState(order.client_document || '');
    const [phone, setPhone] = useState(order.client_phone || '');
    const [city, setCity] = useState(order.city || '');
    const [address, setAddress] = useState(order.delivery_address || '');
    const [distance, setDistance] = useState(String(order.distance_km || 0));
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [tripId, setTripId] = useState(order.trip_id || '');

    // Products State
    const cascoObj = findCasco();
    const [cascoId, setCascoId] = useState(cascoObj ? cascoObj.catalog_item_id : '');
    const [color, setColor] = useState('Celeste'); // Could be parsed from description if formatted that way

    // Checkboxes & Qty
    const [casilla, setCasilla] = useState(hasItem('Casilla'));
    const [losetasL, setLosetasL] = useState(String(getItemQty('Loseta Atérmica L') || ''));
    const [losetasR, setLosetasR] = useState(String(getItemQty('Loseta Atérmica R') || ''));
    const [pastina, setPastina] = useState(String(getItemQty('Pastina') || getItemQty('Pastina (Kg)') || ''));
    const [kitFiltrado, setKitFiltrado] = useState(hasItem('Kit Filtrado'));
    const [accesoriosInst, setAccesoriosInst] = useState(hasItem('Accesorios Instalación'));
    const [luces, setLuces] = useState(hasItem('Luces'));
    const [prevClima, setPrevClima] = useState(hasItem('Prev. Climatización'));
    const [prevCascada, setPrevCascada] = useState(hasItem('Prev. Cascada'));
    const [cascada, setCascada] = useState(hasItem('Cascada'));
    const [kitLimpieza, setKitLimpieza] = useState(hasItem('Kit Limpieza'));

    // Services State
    const [flete, setFlete] = useState(String(order.freight_amount || 0));
    const [instalacion, setInstalacion] = useState(String(order.installation_amount || 0));
    const [viaticos, setViaticos] = useState(String(order.travel_amount || 0));
    const [impuestos, setImpuestos] = useState(String(order.tax_amount_manual || 0));
    const [otro, setOtro] = useState(String(order.other_amount || 0));
    const [descuento, setDescuento] = useState(String(order.discount_amount || 0));

    // Mapeo Rápido de Items Fijos
    const getItemId = (name: string) => catalogItems.find((c: any) => c.name === name)?.id || '';
    const cascos = catalogItems.filter((c: any) => c.name.startsWith('P-'));

    // Búsqueda de precio dinámico
    const getPrice = (itemId: string) => {
        if (!provinceId || !itemId) return 0;
        const p = prices.find((p: any) => p.province_id === provinceId && p.catalog_item_id === itemId);
        return p ? Number(p.unit_price_net) : 0;
    };

    function handleClientChange(id: string) {
        setClientId(id);
        const client = clients.find((c: any) => c.id === id);
        if (client) {
            setClientName(client.name);
            setDocument(client.document || '');
            setPhone(client.phone || '');
            setAddress(client.address);
            setCity(client.city);
            if (client.province_id) setProvinceId(client.province_id);
        }
    }

    // Cálculos de Totales en Vivo
    const subtotalProducto = useMemo(() => {
        let sum = 0;
        if (cascoId) sum += getPrice(cascoId);
        if (casilla) sum += getPrice(getItemId('Casilla'));
        if (Number(losetasL) > 0) sum += Number(losetasL) * getPrice(getItemId('Loseta Atérmica L'));
        if (Number(losetasR) > 0) sum += Number(losetasR) * getPrice(getItemId('Loseta Atérmica R'));
        if (Number(pastina) > 0) sum += Number(pastina) * getPrice(getItemId('Pastina (Kg)'));
        if (kitFiltrado) sum += getPrice(getItemId('Kit Filtrado'));
        if (accesoriosInst) sum += getPrice(getItemId('Accesorios Instalación'));
        if (luces) sum += getPrice(getItemId('Luces'));
        if (prevClima) sum += getPrice(getItemId('Prev. Climatización'));
        if (prevCascada) sum += getPrice(getItemId('Prev. Cascada'));
        if (cascada) sum += getPrice(getItemId('Cascada'));
        if (kitLimpieza) sum += getPrice(getItemId('Kit Limpieza'));
        return sum;
    }, [provinceId, cascoId, casilla, losetasL, losetasR, pastina, kitFiltrado, accesoriosInst, luces, prevClima, prevCascada, cascada, kitLimpieza]);

    const totalAPagar = useMemo(() => {
        return subtotalProducto
            + Number(flete) + Number(instalacion) + Number(viaticos)
            + Number(impuestos) + Number(otro) - Number(descuento);
    }, [subtotalProducto, flete, instalacion, viaticos, impuestos, otro, descuento]);


    async function handleSave() {
        setSaving(true);
        setError(null);

        // 1. Update Order
        const orderResult = await updateOrder(order.id, {
            client_id: clientId || null,
            client_name: clientName,
            client_document: document,
            client_phone: phone,
            delivery_address: address,
            city,
            distance_km: Number(distance) || 0,
            province_id: provinceId,
            seller_id: sellerId || null,
            status,
            trip_id: tripId || null,
            discount_amount: Number(descuento) || 0,
            freight_amount: Number(flete) || 0,
            installation_amount: Number(instalacion) || 0,
            travel_amount: Number(viaticos) || 0,
            other_amount: Number(otro) || 0,
            tax_amount_manual: Number(impuestos) || 0,
        });

        if (orderResult?.error) {
            setError(orderResult.error);
            setSaving(false);
            return;
        }

        // 2. Armar array de Items real state
        const bulkItems: any[] = [];
        const pushItem = (id: string, desc: string, qty: number, price: number) => {
            if (id && qty > 0) {
                bulkItems.push({ catalog_item_id: id, description: desc, quantity: qty, unit_price_net: price, type: 'PRODUCTO' });
            }
        };

        if (cascoId) pushItem(cascoId, `Casco ${catalogItems.find((c: any) => c.id === cascoId)?.name} (Color: ${color})`, 1, getPrice(cascoId));
        if (casilla) pushItem(getItemId('Casilla'), 'Casilla', 1, getPrice(getItemId('Casilla')));
        if (Number(losetasL) > 0) pushItem(getItemId('Loseta Atérmica L'), 'Loseta Atérmica L', Number(losetasL), getPrice(getItemId('Loseta Atérmica L')));
        if (Number(losetasR) > 0) pushItem(getItemId('Loseta Atérmica R'), 'Loseta Atérmica R', Number(losetasR), getPrice(getItemId('Loseta Atérmica R')));
        if (Number(pastina) > 0) pushItem(getItemId('Pastina (Kg)'), 'Pastina', Number(pastina), getPrice(getItemId('Pastina (Kg)')));
        if (kitFiltrado) pushItem(getItemId('Kit Filtrado'), 'Kit Filtrado', 1, getPrice(getItemId('Kit Filtrado')));
        if (accesoriosInst) pushItem(getItemId('Accesorios Instalación'), 'Accesorios Instalación', 1, getPrice(getItemId('Accesorios Instalación')));
        if (luces) pushItem(getItemId('Luces'), 'Luces', 1, getPrice(getItemId('Luces')));
        if (prevClima) pushItem(getItemId('Prev. Climatización'), 'Prev. Climatización', 1, getPrice(getItemId('Prev. Climatización')));
        if (prevCascada) pushItem(getItemId('Prev. Cascada'), 'Prev. Cascada', 1, getPrice(getItemId('Prev. Cascada')));
        if (cascada) pushItem(getItemId('Cascada'), 'Cascada', 1, getPrice(getItemId('Cascada')));
        if (kitLimpieza) pushItem(getItemId('Kit Limpieza'), 'Kit Limpieza', 1, getPrice(getItemId('Kit Limpieza')));

        await replaceOrderItems(order.id, bulkItems);

        setSaving(false);
        router.refresh();
    }

    const STATUS_FLOW: OrderStatus[] = [
        'BORRADOR', 'CONFIRMADO', 'EN_PRODUCCION', 'PRODUCIDO', 'VIAJE_ASIGNADO', 'ENTREGADO',
    ];

    return (
        <>
            <PageHeader
                title={`Cotización ${order.order_number}`}
                backHref="/orders"
                actions={
                    <div className="flex items-center gap-3">
                        <Select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as OrderStatus)}
                            options={STATUS_FLOW.map(s => ({ value: s, label: s.replace(/_/g, ' ') }))}
                            className="bg-white border-gray-300 text-sm h-9 font-semibold text-primary-700"
                        />
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                }
            />

            {error && (
                <div className="mb-4 p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700 text-sm">
                    {error}
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-0 text-sm border border-gray-300 rounded shadow-sm bg-white overflow-hidden mb-12">
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-5 py-4 border-b border-primary-900 flex items-center justify-between shadow-inner rounded-t text-white font-semibold">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-primary-700 rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary-200 shadow-md">Ip</div>
                        <div className="text-3xl tracking-tight drop-shadow-sm">Cotización Pileta Instalada</div>
                    </div>
                    <Badge status={status} />
                </div>

                {/* FIELDS GRID */}
                <div className="grid grid-cols-2 gap-x-0 bg-gray-50/50">
                    <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                        <label className="text-gray-600 font-medium">Vendedor</label>
                        <Select value={sellerId} onChange={e => setSellerId(e.target.value)} options={(sellers || []).map((s: any) => ({ value: s.id, label: s.name }))} className="h-8 text-sm" />
                    </div>
                    <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                        <label className="text-gray-600 font-medium">Provincia</label>
                        <Select value={provinceId} onChange={e => setProvinceId(e.target.value)} options={(provinces || []).map((p: any) => ({ value: p.id, label: p.name }))} required className="h-8 text-sm" />
                    </div>

                    <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                        <label className="text-gray-600 font-medium">Cliente</label>
                        <div className="flex gap-1">
                            <Select value={clientId} onChange={e => handleClientChange(e.target.value)} options={(clients || []).map((c: any) => ({ value: c.id, label: c.name }))} className="h-8 text-sm w-1/3" placeholder="Buscar..." />
                            <Input value={clientName} onChange={e => setClientName(e.target.value)} required className="h-8 text-sm w-2/3" placeholder="Nombre completo" />
                        </div>
                    </div>
                    <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                        <label className="text-gray-600 font-medium">Localidad</label>
                        <Input value={city} onChange={e => setCity(e.target.value)} required className="h-8 text-sm" />
                    </div>

                    <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                        <label className="text-gray-600 font-medium">DNI</label>
                        <Input value={document} onChange={e => setDocument(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                        <label className="text-gray-600 font-medium whitespace-nowrap">Dir. Entrega</label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} required className="h-8 text-sm" />
                    </div>

                    <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                        <label className="text-gray-600 font-medium">Teléfono</label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                        <label className="text-gray-600 font-medium">Distancia (Km)</label>
                        <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="h-8 text-sm" />
                    </div>
                </div>

                {/* PRODUCT SECTION */}
                <div className="bg-primary-600 text-white font-bold tracking-wide text-center py-2.5 border-y border-primary-700 shadow-sm uppercase text-xs">
                    Producto
                </div>

                <div className="grid grid-cols-[1fr_120px_150px] bg-primary-100/80 font-bold text-primary-900 border-b border-primary-200 text-center text-xs uppercase tracking-wider shadow-sm">
                    <div className="py-2.5 px-3 border-r border-primary-200 text-left">Descripción</div>
                    <div className="py-2.5 px-3 border-r border-primary-200">Cantidad</div>
                    <div className="py-2.5 px-3">Monto</div>
                </div>

                <div className="divide-y divide-gray-200">
                    <div className="grid grid-cols-[1fr_120px_150px] items-center">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Casco</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center">
                            <Select value={cascoId} onChange={e => setCascoId(e.target.value)} options={cascos.map((c: any) => ({ value: c.id, label: c.name }))} className="h-7 text-xs w-full" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(cascoId ? getPrice(cascoId) : 0)}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px_150px] items-center">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Color</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center">
                            <Select value={color} onChange={e => setColor(e.target.value)} options={['Celeste', 'Blanco', 'Arena'].map(c => ({ value: c, label: c }))} className="h-7 text-xs w-full" />
                        </div>
                        <div className="py-1.5 px-3 text-right"></div>
                    </div>

                    <CheckboxRow label="Casilla" checked={casilla} onChange={setCasilla} price={getPrice(getItemId('Casilla'))} />

                    <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Losetas L</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                            <Input type="number" min="0" value={losetasL} onChange={e => setLosetasL(e.target.value)} className="h-7 text-xs w-16 text-center shadow-inner" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(losetasL || 0) * getPrice(getItemId('Loseta Atérmica L')))}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Losetas R</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                            <Input type="number" min="0" value={losetasR} onChange={e => setLosetasR(e.target.value)} className="h-7 text-xs w-16 text-center shadow-inner" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(losetasR || 0) * getPrice(getItemId('Loseta Atérmica R')))}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Pastina (Kg)</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                            <Input type="number" min="0" value={pastina} onChange={e => setPastina(e.target.value)} className="h-7 text-xs w-16 text-center shadow-inner" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(pastina || 0) * getPrice(getItemId('Pastina (Kg)')))}</div>
                    </div>

                    <CheckboxRow label="Kit Filtrado" checked={kitFiltrado} onChange={setKitFiltrado} price={getPrice(getItemId('Kit Filtrado'))} />
                    <CheckboxRow label="Accesorios Instalación" checked={accesoriosInst} onChange={setAccesoriosInst} price={getPrice(getItemId('Accesorios Instalación'))} />
                    <CheckboxRow label="Luces" checked={luces} onChange={setLuces} price={getPrice(getItemId('Luces'))} />
                    <CheckboxRow label="Prev. Climatización" checked={prevClima} onChange={setPrevClima} price={getPrice(getItemId('Prev. Climatización'))} />
                    <CheckboxRow label="Prev. Cascada" checked={prevCascada} onChange={setPrevCascada} price={getPrice(getItemId('Prev. Cascada'))} />
                    <CheckboxRow label="Cascada" checked={cascada} onChange={setCascada} price={getPrice(getItemId('Cascada'))} />
                    <CheckboxRow label="Kit Limpieza" checked={kitLimpieza} onChange={setKitLimpieza} price={getPrice(getItemId('Kit Limpieza'))} />
                </div>

                <div className="grid grid-cols-[1fr_150px] bg-gray-200 font-bold border-y border-gray-400">
                    <div className="py-2 px-3 border-r border-gray-400">Sub Total Producto</div>
                    <div className="py-2 px-3 text-right">{formatCurrency(subtotalProducto)}</div>
                </div>

                {/* SERVICES SECTION */}
                <div className="bg-primary-100 text-primary-900 font-bold tracking-wide text-center py-2.5 border-y border-primary-200 shadow-sm uppercase text-xs">
                    Cargos de servicio
                </div>

                <div className="divide-y divide-gray-200 bg-white">
                    <InputRow label="Flete" value={flete} onChange={setFlete} />
                    <InputRow label="Instalacion" value={instalacion} onChange={setInstalacion} />
                    <InputRow label="Viaticos" value={viaticos} onChange={setViaticos} highlight />
                    <InputRow label="Impuestos" value={impuestos} onChange={setImpuestos} highlight />
                    <InputRow label="Otro" value={otro} onChange={setOtro} highlight />
                    <InputRow label="Descuento (Monto)" value={descuento} onChange={setDescuento} highlight className="text-danger-600" />
                </div>

                {/* LOGISTICS SECTION */}
                <div className="bg-primary-100 text-primary-900 font-bold tracking-wide text-center py-2.5 border-y border-primary-200 shadow-sm uppercase text-xs">
                    Logística (Flete)
                </div>
                <div className="bg-white p-3 divide-y divide-gray-200">
                    <div className="grid grid-cols-[1fr_2fr] items-center py-2 gap-4">
                        <div className="font-medium">Asignar Flete</div>
                        <div className="flex gap-2 items-center">
                            <Select
                                value={tripId}
                                onChange={e => setTripId(e.target.value)}
                                options={[
                                    { value: '', label: 'Sin flete asignado' },
                                    ...(trips || []).map((t: any) => {
                                        const count = (occupancy || []).filter((o: any) => o.trip_id === t.id).length;
                                        const capacity = t.truck_type?.capacity || 0;
                                        return {
                                            value: t.id,
                                            label: `${t.trip_code} - ${t.destination} [${count}/${capacity || '∞'}] - ${t.truck_type?.name || 'S/D'}`
                                        };
                                    })
                                ]}
                                className="h-8 text-sm flex-1"
                            />
                            {tripId && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => router.push(`/fletes/${tripId}`)}
                                >
                                    Ver Detalle
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_150px] bg-gray-800 text-white font-black text-xl border-t shadow-lg rounded-b">
                    <div className="py-4 px-4 border-r border-gray-700 text-right uppercase text-sm tracking-wider flex items-center justify-end">Total a pagar</div>
                    <div className="py-4 px-4 text-right text-success-400 drop-shadow-sm">{formatCurrency(totalAPagar)}</div>
                </div>
            </div>
        </>
    );
}

// Helper para filas de checkbox
function CheckboxRow({ label, checked, onChange, price }: { label: string, checked: boolean, onChange: (v: boolean) => void, price: number }) {
    return (
        <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50 cursor-pointer" onClick={() => onChange(!checked)}>
            <div className="py-1.5 px-3 border-r border-gray-200 font-medium select-none">{label}</div>
            <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/20">
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${checked ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white'}`}>
                    {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
            </div>
            <div className={`py-1.5 px-3 text-right font-medium ${checked ? 'text-gray-900' : 'text-transparent'}`}>{formatCurrency(price)}</div>
        </div>
    );
}

// Helper para filas de inputs monetarios
function InputRow({ label, value, onChange, highlight, className }: { label: string, value: string, onChange: (v: string) => void, highlight?: boolean, className?: string }) {
    return (
        <div className="grid grid-cols-[1fr_150px] items-center hover:bg-gray-50">
            <div className="py-1.5 px-3 border-r border-gray-200 font-medium">{label}</div>
            <div className={`py-1 px-3 ${highlight ? 'bg-yellow-50/30' : ''}`}>
                <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-medium">$</span>
                    <Input
                        type="number"
                        min="0"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className={`h-7 text-xs text-right shadow-inner ${className || ''}`}
                    />
                </div>
            </div>
        </div>
    );
}

const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
