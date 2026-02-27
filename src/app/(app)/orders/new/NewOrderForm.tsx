'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/FormInputs';
import { Button } from '@/components/ui/Button';
import { createOrder } from '../actions';
import { addOrderItemsBulk } from '../bulkActions';
import type { SalesChannel } from '@/lib/types/database';

interface ItemState {
    catalogItemId: string;
    description: string;
    qty: number;
    price: number;
}

export function NewOrderForm({
    provinces,
    clients,
    sellers,
    catalogItems,
    prices,
}: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Header State
    const [sellerId, setSellerId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientName, setClientName] = useState('');
    const [document, setDocument] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [distance, setDistance] = useState('0');

    // Products State
    const [cascoId, setCascoId] = useState('');
    const [color, setColor] = useState('Celeste');

    // Checkboxes & Qty
    const [casilla, setCasilla] = useState(false);
    const [losetasL, setLosetasL] = useState('');
    const [losetasR, setLosetasR] = useState('');
    const [pastina, setPastina] = useState('');
    const [kitFiltrado, setKitFiltrado] = useState(false);
    const [accesoriosInst, setAccesoriosInst] = useState(false);
    const [luces, setLuces] = useState(false);
    const [prevClima, setPrevClima] = useState(false);
    const [prevCascada, setPrevCascada] = useState(false);
    const [cascada, setCascada] = useState(false);
    const [kitLimpieza, setKitLimpieza] = useState(false);

    // Services State
    const [flete, setFlete] = useState('0');
    const [instalacion, setInstalacion] = useState('0');
    const [viaticos, setViaticos] = useState('0');
    const [impuestos, setImpuestos] = useState('0');
    const [otro, setOtro] = useState('0');
    const [descuento, setDescuento] = useState('0');

    // Mapeo Rápido de Items Fijos
    const getItemId = (name: string) => catalogItems.find((c: any) => c.name === name)?.id || '';
    const cascos = catalogItems.filter((c: any) => c.name.startsWith('P-'));

    // Búsqueda de precio dinámico
    const getPrice = (itemId: string) => {
        if (!provinceId || !itemId) return 0;
        const p = prices.find((p: any) => p.province_id === provinceId && p.catalog_item_id === itemId);
        return p ? Number(p.unit_price_net) : 0;
    };

    // Auto-fill Services when Province changes
    useEffect(() => {
        if (provinceId) {
            setFlete(String(getPrice(getItemId('Flete Base'))));
            setInstalacion(String(getPrice(getItemId('Instalación Base'))));
        } else {
            setFlete('0');
            setInstalacion('0');
        }
    }, [provinceId]);

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

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log('Iniciando creación de pedido...');

            // 1. Crear el Pedido
            const orderResult = await createOrder({
                client_id: clientId || null,
                client_name: clientName,
                client_document: document,
                client_phone: phone,
                delivery_address: address,
                city,
                distance_km: Number(distance) || 0,
                province_id: provinceId,
                channel: 'INTERNO' as SalesChannel,
                seller_id: sellerId || null,
                // status removed
                discount_amount: Number(descuento) || 0,
                freight_amount: Number(flete) || 0,
                installation_amount: Number(instalacion) || 0,
                travel_amount: Number(viaticos) || 0,
                other_amount: Number(otro) || 0,
                tax_amount_manual: Number(impuestos) || 0,
                notes: '',
            });

            if (orderResult.error || !orderResult.data) {
                console.error('Error en createOrder:', orderResult.error);
                setError(orderResult.error || 'Error al crear pedido');
                setLoading(false);
                return;
            }

            const orderId = orderResult.data.id;
            console.log('Pedido creado con ID:', orderId);

            // 2. Armar el array de Items
            const bulkItems: any[] = [];
            const pushItem = (id: string, desc: string, qty: number, price: number) => {
                if (id && qty > 0) {
                    bulkItems.push({ catalog_item_id: id, description: desc, quantity: qty, unit_price_net: price, type: 'PRODUCTO' });
                }
            };

            if (cascoId) pushItem(cascoId, `Casco ${catalogItems.find((c: any) => c.id === cascoId)?.name || 'Desconocido'} (Color: ${color})`, 1, getPrice(cascoId));
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

            if (bulkItems.length > 0) {
                console.log('Insertando items bulk:', bulkItems.length);
                const itemsResult = await addOrderItemsBulk(orderId, bulkItems);
                if (itemsResult?.error) {
                    console.error('Error insertando items:', itemsResult.error);
                    setError('Pedido creado con éxito, pero hubo un error con los items: ' + itemsResult.error);
                    setLoading(false);
                    // No redireccionamos si hubo error en items para que el usuario vea el mensaje
                    return;
                }
            }

            console.log('Todo exitoso, redireccionando...');
            router.push(`/orders/${orderId}`);
        } catch (err: any) {
            console.error('Error fatal en handleSubmit:', err);
            setError('Error inesperado: ' + (err.message || String(err)));
            setLoading(false);
        }
    }

    return (
        <>
            <PageHeader title="Cotización Pileta Instalada" backHref="/orders" />

            {error && (
                <div className="mb-4 p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-0 text-sm border border-gray-300 rounded shadow-sm bg-white overflow-hidden">
                {/* HEADERS ROW */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-5 py-4 border-b border-primary-900 flex items-center gap-4 text-white font-semibold shadow-inner rounded-t">
                    <div className="w-12 h-12 bg-white text-primary-700 rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary-200 shadow-md">Ip</div>
                    <div className="text-3xl tracking-tight text-white drop-shadow-sm">Cotización Pileta Instalada</div>
                </div>

                {/* FIELDS GRID */}
                <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                    <label className="text-gray-600 font-medium">Vendedor</label>
                    <Select value={sellerId} onChange={e => setSellerId(e.target.value)} options={(sellers || []).map((s: any) => ({ value: s.id, label: s.name }))} uiSize="sm" className="h-9" />
                </div>
                <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                    <label className="text-gray-600 font-medium">Provincia</label>
                    <Select value={provinceId} onChange={e => setProvinceId(e.target.value)} options={(provinces || []).map((p: any) => ({ value: p.id, label: p.name }))} required uiSize="sm" className="h-9" />
                </div>

                <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                    <label className="text-gray-600 font-medium">Cliente</label>
                    <div className="flex gap-1">
                        <Select value={clientId} onChange={e => handleClientChange(e.target.value)} options={(clients || []).map((c: any) => ({ value: c.id, label: c.name }))} uiSize="sm" className="h-9 w-1/3" placeholder="Buscar..." />
                        <Input value={clientName} onChange={e => setClientName(e.target.value)} required uiSize="sm" className="h-9 w-2/3" placeholder="Nombre completo" />
                    </div>
                </div>
                <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                    <label className="text-gray-600 font-medium">Localidad</label>
                    <Input value={city} onChange={e => setCity(e.target.value)} required uiSize="sm" className="h-9" />
                </div>

                <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                    <label className="text-gray-600 font-medium">DNI</label>
                    <Input value={document} onChange={e => setDocument(e.target.value)} uiSize="sm" className="h-9" />
                </div>
                <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                    <label className="text-gray-600 font-medium whitespace-nowrap">Dir. Entrega</label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} required uiSize="sm" className="h-9" />
                </div>

                <div className="p-3 border-r border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center">
                    <label className="text-gray-600 font-medium">Teléfono</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} uiSize="sm" className="h-9" />
                </div>
                <div className="p-3 border-b border-gray-300 grid grid-cols-[100px_1fr] gap-2 items-center bg-yellow-50/30">
                    <label className="text-gray-600 font-medium">Distancia (Km)</label>
                    <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} uiSize="sm" className="h-9" />
                </div>

                {/* SECTION: PRODUCT TITLE */}
                <div className="bg-primary-600 text-white font-bold tracking-wide text-center py-2.5 border-y border-primary-700 shadow-sm uppercase text-xs">
                    Producto
                </div>

                {/* PRODUCT TABLE STRUCTURE */}
                <div className="grid grid-cols-[1fr_120px_150px] bg-primary-100/80 font-bold text-primary-900 border-b border-primary-200 text-center text-xs uppercase tracking-wider shadow-sm">
                    <div className="py-2.5 px-3 border-r border-primary-200 text-left">Descripción</div>
                    <div className="py-2.5 px-3 border-r border-primary-200">Cantidad</div>
                    <div className="py-2.5 px-3">Monto</div>
                </div>

                <div className="divide-y divide-gray-200">
                    <div className="grid grid-cols-[1fr_120px_150px] items-center">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Casco</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center">
                            <Select value={cascoId} onChange={e => setCascoId(e.target.value)} options={cascos.map((c: any) => ({ value: c.id, label: c.name }))} uiSize="sm" className="h-8 w-full" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(cascoId ? getPrice(cascoId) : 0)}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px_150px] items-center">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Color</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center">
                            <Select value={color} onChange={e => setColor(e.target.value)} options={['Celeste', 'Blanco', 'Arena'].map(c => ({ value: c, label: c }))} uiSize="sm" className="h-8 w-full" />
                        </div>
                        <div className="py-1.5 px-3 text-right"></div>
                    </div>

                    <CheckboxRow label="Casilla" checked={casilla} onChange={setCasilla} price={getPrice(getItemId('Casilla'))} />

                    <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Losetas L</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                            <Input type="number" min="0" value={losetasL} onChange={e => setLosetasL(e.target.value)} uiSize="sm" className="h-8 w-16 text-center shadow-inner" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(losetasL || 0) * getPrice(getItemId('Loseta Atérmica L')))}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Losetas R</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                            <Input type="number" min="0" value={losetasR} onChange={e => setLosetasR(e.target.value)} uiSize="sm" className="h-8 w-16 text-center shadow-inner" />
                        </div>
                        <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(losetasR || 0) * getPrice(getItemId('Loseta Atérmica R')))}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_120px_150px] items-center hover:bg-gray-50">
                        <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Pastina (Kg)</div>
                        <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                            <Input type="number" min="0" value={pastina} onChange={e => setPastina(e.target.value)} uiSize="sm" className="h-8 w-16 text-center shadow-inner" />
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

                {/* SUBTOTAL PRODUCT */}
                <div className="grid grid-cols-[1fr_150px] bg-gray-200 font-bold border-y border-gray-400">
                    <div className="py-2 px-3 border-r border-gray-400">Sub Total Producto</div>
                    <div className="py-2 px-3 text-right">{formatCurrency(subtotalProducto)}</div>
                </div>

                {/* SECTION: CARGOS SERVICIO TITLE */}
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

                {/* GRAND TOTAL */}
                <div className="grid grid-cols-[1fr_150px] bg-gray-800 text-white font-black text-xl border-t shadow-lg rounded-b">
                    <div className="py-4 px-4 border-r border-gray-700 text-right uppercase text-sm tracking-wider flex items-center justify-end">Total a pagar</div>
                    <div className="py-4 px-4 text-right text-success-400 drop-shadow-sm">{formatCurrency(totalAPagar)}</div>
                </div>

                {/* Acciones */}
                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-300">
                    <Button type="button" variant="secondary" onClick={() => router.push('/orders')}>Cancelar</Button>
                    <Button type="submit" disabled={loading} className="px-8 font-bold text-lg">{loading ? 'Procesando...' : 'Crear Cotización'}</Button>
                </div>
            </form>
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
                        uiSize="sm"
                        className={`h-8 text-right shadow-inner ${className || ''}`}
                    />
                </div>
            </div>
        </div>
    );
}

const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
