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
    resellers,
    catalogItems,
    prices,
    resellerLists,
    resellerPrices
}: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Header State
    const [channel, setChannel] = useState<SalesChannel>('INTERNO');
    const [sellerId, setSellerId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [resellerId, setResellerId] = useState('');
    const [priceListId, setPriceListId] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientName, setClientName] = useState('');
    const [document, setDocument] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [distance, setDistance] = useState('0');
    const [notes, setNotes] = useState('');

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
        if (!itemId) return 0;

        if (channel === 'REVENDEDOR') {
            if (!priceListId) return 0;
            const p = resellerPrices.find((p: any) => p.price_list_id === priceListId && p.catalog_item_id === itemId);
            return p ? Number(p.unit_price_net) : 0;
        } else {
            if (!provinceId) return 0;
            const p = prices.find((p: any) => p.province_id === provinceId && p.catalog_item_id === itemId);
            return p ? Number(p.unit_price_net) : 0;
        }
    };

    const colorExtra = useMemo(() => {
        if (!cascoId) return 0;
        return color !== 'Celeste' ? 200000 : 0;
    }, [color, cascoId]);

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
        if (cascada) sum += getPrice(getItemId('Cascada'));
        if (kitLimpieza) sum += getPrice(getItemId('Kit Limpieza'));
        sum += colorExtra;
        return sum;
    }, [provinceId, channel, priceListId, cascoId, colorExtra, casilla, losetasL, losetasR, pastina, kitFiltrado, accesoriosInst, luces, prevClima, prevCascada, cascada, kitLimpieza]);

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
                channel: channel,
                seller_id: sellerId || null,
                reseller_id: channel === 'REVENDEDOR' ? (resellerId || null) : null,
                installer_id: channel === 'REVENDEDOR' ? null : null, // Default null for now
                status: 'PENDIENTE' as any,
                discount_amount: Number(descuento) || 0,
                freight_amount: Number(flete) || 0,
                installation_amount: Number(instalacion) || 0,
                travel_amount: Number(viaticos) || 0,
                other_amount: Number(otro) || 0,
                tax_amount_manual: Number(impuestos) || 0,
                notes: notes,
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

            if (colorExtra > 0) {
                const colorItemId = getItemId('Adicional por Color') || catalogItems.find((c: any) => c.name.toLowerCase().includes('adicional'))?.id;
                pushItem(colorItemId, `Adicional por Color (${color})`, 1, colorExtra);
            }

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
            <PageHeader title="Registrar Venta" backHref="/orders" />

            {error && (
                <div className="mb-4 p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 p-6 pb-20 text-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* HEADERS ROW */}
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-2">
                    <div className="w-14 h-14 bg-primary-50 text-primary-700 rounded-2xl flex items-center justify-center font-black text-2xl border border-primary-100 shadow-sm rotate-3">Rv</div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Registrar Venta</h1>
                        <p className="text-gray-400 font-medium mt-1">Cotización y registro de pedido de pileta</p>
                    </div>
                </div>

                {/* FIELDS GRID: ROW 1 (Canales y Vendedores) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Canal de Venta</label>
                        <Select
                            value={channel}
                            onChange={e => setChannel(e.target.value as SalesChannel)}
                            options={[
                                { value: 'INTERNO', label: 'Cliente Final' },
                                { value: 'REVENDEDOR', label: 'Revendedor' }
                            ]}
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-gray-700"
                        />
                    </div>

                    {channel === 'INTERNO' ? (
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Vendedor</label>
                            <Select
                                value={sellerId}
                                onChange={e => setSellerId(e.target.value)}
                                options={(sellers || []).map((s: any) => ({ value: s.id, label: s.name }))}
                                placeholder="Seleccionar vendedor..."
                                className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-gray-700"
                            />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Revendedor</label>
                            <Select
                                value={resellerId}
                                onChange={e => setResellerId(e.target.value)}
                                options={(resellers || []).map((r: any) => ({ value: r.id, label: r.name }))}
                                placeholder="Seleccionar revendedor..."
                                className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-gray-700"
                            />
                        </div>
                    )}

                    {channel === 'REVENDEDOR' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1 text-primary-600">Lista de Precios</label>
                            <Select
                                value={priceListId}
                                onChange={e => setPriceListId(e.target.value)}
                                options={(resellerLists || []).map((l: any) => ({ value: l.id, label: l.name }))}
                                required
                                className="h-11 rounded-xl border border-primary-200 bg-primary-50/10 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-primary-700"
                            />
                        </div>
                    )}
                </div>

                {/* FIELDS GRID: ROW 2 (Geografía y Cliente) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Provincia</label>
                        <Select
                            value={provinceId}
                            onChange={e => setProvinceId(e.target.value)}
                            options={(provinces || []).map((p: any) => ({ value: p.id, label: p.name }))}
                            required
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Localidad</label>
                        <Input
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            required
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all"
                            placeholder="Ej: Córdoba"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Buscador Clientes (Opcional)</label>
                        <Select
                            value={clientId}
                            onChange={e => handleClientChange(e.target.value)}
                            options={(clients || []).map((c: any) => ({ value: c.id, label: c.name }))}
                            placeholder="Buscar cliente registrado..."
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all italic font-medium"
                        />
                    </div>
                </div>

                {/* FIELDS GRID: ROW 3 (Datos de Contacto) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5 col-span-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Nombre Completo Cliente</label>
                        <Input
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            required
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                            placeholder="Nombre del titular"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">DNI / CUIT</label>
                        <Input
                            value={document}
                            onChange={e => setDocument(e.target.value)}
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all"
                            placeholder="Cédula o ID"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Teléfono</label>
                        <Input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all"
                            placeholder="Celular de contacto"
                        />
                    </div>
                </div>

                {/* FIELDS GRID: ROW 4 (Dirección y Envío) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1.5 col-span-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Dirección de Entrega</label>
                        <Input
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            required
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 bg-white"
                            placeholder="Calle, Altura, Referencias"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Distancia (Km)</label>
                        <Input
                            type="number"
                            value={distance}
                            onChange={e => setDistance(e.target.value)}
                            className="h-11 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 bg-white text-center font-bold"
                        />
                    </div>
                </div>

                {/* SECTION: PRODUCT TITLE */}
                <div className="bg-gray-950 px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg">
                    <h2 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0m-4 5v2m-8-5v2m-8-5v2" /></svg>
                        Detalle de Productos
                    </h2>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Cálculo dinámico activado</span>
                </div>

                {/* PRODUCT TABLE STRUCTURE */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-[1fr_300px_150px] bg-gray-50/80 font-black text-gray-500 border-b border-gray-100 text-center text-[10px] uppercase tracking-widest shadow-inner">
                        <div className="py-3 px-4 text-left">Ítem / Descripción</div>
                        <div className="py-3 px-4">Cantidad / Selección</div>
                        <div className="py-3 px-4 text-right">Subtotal</div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        <div className="grid grid-cols-[1fr_300px_150px] items-center">
                            <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Casco</div>
                            <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center">
                                <Select value={cascoId} onChange={e => setCascoId(e.target.value)} options={cascos.map((c: any) => ({ value: c.id, label: c.name }))} uiSize="sm" className="h-8 w-full" />
                            </div>
                            <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(cascoId ? getPrice(cascoId) : 0)}</div>
                        </div>

                        <div className="grid grid-cols-[1fr_300px_150px] items-center">
                            <div className="py-1.5 px-3 border-r border-gray-200 font-medium flex items-center justify-between">
                                <span>Color</span>
                                {colorExtra > 0 && <span className="text-primary-600 text-[10px] font-bold bg-primary-50 px-1.5 rounded">+ {formatCurrency(colorExtra)}</span>}
                            </div>
                            <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center">
                                <Select value={color} onChange={e => setColor(e.target.value)} options={['Celeste', 'Blanco', 'Arena'].map(c => ({ value: c, label: c }))} uiSize="sm" className="h-8 w-full" />
                            </div>
                            <div className="py-1.5 px-3 text-right font-medium">{colorExtra > 0 ? formatCurrency(colorExtra) : '-'}</div>
                        </div>

                        <CheckboxRow label="Casilla" checked={casilla} onChange={setCasilla} price={getPrice(getItemId('Casilla'))} />

                        <div className="grid grid-cols-[1fr_300px_150px] items-center hover:bg-gray-50">
                            <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Losetas L</div>
                            <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                                <Input type="number" min="0" value={losetasL} onChange={e => setLosetasL(e.target.value)} uiSize="sm" className="h-8 w-16 text-center shadow-inner" />
                            </div>
                            <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(losetasL || 0) * getPrice(getItemId('Loseta Atérmica L')))}</div>
                        </div>

                        <div className="grid grid-cols-[1fr_300px_150px] items-center hover:bg-gray-50">
                            <div className="py-1.5 px-3 border-r border-gray-200 font-medium">Losetas R</div>
                            <div className="py-1.5 px-3 border-r border-gray-200 flex justify-center bg-yellow-50/30">
                                <Input type="number" min="0" value={losetasR} onChange={e => setLosetasR(e.target.value)} uiSize="sm" className="h-8 w-16 text-center shadow-inner" />
                            </div>
                            <div className="py-1.5 px-3 text-right font-medium">{formatCurrency(Number(losetasR || 0) * getPrice(getItemId('Loseta Atérmica R')))}</div>
                        </div>

                        <div className="grid grid-cols-[1fr_300px_150px] items-center hover:bg-gray-50">
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
                </div>

                {/* SECTION: CARGOS SERVICIO TITLE */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Cargos Adicionales y Ajustes</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <SmallInput label="Flete" value={flete} onChange={setFlete} />
                            <SmallInput label="Instalación" value={instalacion} onChange={setInstalacion} />
                            <SmallInput label="Viáticos" value={viaticos} onChange={setViaticos} />
                            <SmallInput label="Impuestos" value={impuestos} onChange={setImpuestos} />
                            <SmallInput label="Otro" value={otro} onChange={setOtro} />
                            <SmallInput label="Descuento" value={descuento} onChange={setDescuento} className="text-red-500 font-bold" />
                        </div>
                    </div>

                    <div className="w-full md:w-80 space-y-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Resumen de Totales</label>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-tight">Subtotal Productos</span>
                                <span className="text-gray-900 font-bold">{formatCurrency(subtotalProducto)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-tight">Cargos Extra</span>
                                <span className="text-gray-600 font-bold">{formatCurrency((Number(flete) + Number(instalacion) + Number(viaticos) + Number(impuestos) + Number(otro)))}</span>
                            </div>
                            {Number(descuento) > 0 && (
                                <div className="flex justify-between items-baseline">
                                    <span className="text-red-400 text-xs font-bold uppercase tracking-tight">Bonificaciones</span>
                                    <span className="text-red-600 font-bold">-{formatCurrency(Number(descuento))}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-gray-900 font-black uppercase text-[10px] tracking-widest">Total Final</span>
                                <span className="text-2xl font-black text-primary-700 tracking-tighter">{formatCurrency(totalAPagar)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRAND TOTAL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gray-900 p-6 rounded-3xl shadow-2xl border border-gray-700">
                    <div className="space-y-1">
                        <h3 className="text-success-400 font-black text-2xl tracking-tighter uppercase">{formatCurrency(totalAPagar)}</h3>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Neto a Cobrar</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.push('/orders')}
                            className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/20 font-black uppercase text-xs tracking-widest transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-10 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-primary-900/40 active:scale-95"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Venta'}
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}

// Helper para inputs de cargos adicionales (layout compacto)
function SmallInput({ label, value, onChange, className }: { label: string, value: string, onChange: (v: string) => void, className?: string }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</span>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <Input
                    type="number"
                    min="0"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`h-10 pl-7 pr-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-primary-500/10 text-right font-bold transition-all shadow-sm ${className || ''}`}
                />
            </div>
        </div>
    );
}

// Helper para filas de checkbox
function CheckboxRow({ label, checked, onChange, price }: { label: string, checked: boolean, onChange: (v: boolean) => void, price: number }) {
    return (
        <div className="grid grid-cols-[1fr_300px_150px] items-center hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => onChange(!checked)}>
            <div className="py-2.5 px-4 border-r border-gray-100 font-bold text-gray-700 select-none text-xs uppercase tracking-tight">{label}</div>
            <div className="py-2.5 px-4 border-r border-gray-100 flex justify-center">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${checked ? 'bg-primary-600 border-primary-600 shadow-sm shadow-primary-200' : 'border-gray-200 bg-white'}`}>
                    {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                </div>
            </div>
            <div className={`py-2.5 px-4 text-right font-black tracking-tighter ${checked ? 'text-gray-900' : 'text-gray-300'}`}>{formatCurrency(price)}</div>
        </div>
    );
}

const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
