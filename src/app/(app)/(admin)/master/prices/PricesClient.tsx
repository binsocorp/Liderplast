'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormInputs';
import { upsertPrices } from '../actions';

interface PriceRow {
    id?: string;
    catalog_item_id: string;
    province_id: string;
    unit_price_net: number;
    is_active: boolean;
    catalog_item: { name: string };
    province: { name: string };
}

interface PricesClientProps {
    prices: PriceRow[];
    provinces: { id: string; name: string }[];
    catalogItems: { id: string; name: string }[];
}

export function PricesClient({ prices, provinces, catalogItems }: PricesClientProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Actives items/provinces
    const activeProvinces = useMemo(() => {
        return [...provinces].sort((a, b) => a.name.localeCompare(b.name));
    }, [provinces]);

    // Let's categorize catalog items (Cascos vs Services/Optionals)
    const sortedItems = useMemo(() => {
        const cascos = catalogItems.filter(c => c.name.startsWith('P-')).sort((a, b) => a.name.localeCompare(b.name));
        const others = catalogItems.filter(c => !c.name.startsWith('P-')).sort((a, b) => a.name.localeCompare(b.name));
        return [...cascos, ...others];
    }, [catalogItems]);

    // Local State for Matrix Values
    // Key: `${province_id}_${catalog_item_id}` -> unit_price_net
    const [localPrices, setLocalPrices] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        prices.forEach(p => {
            initialState[`${p.province_id}_${p.catalog_item_id}`] = String(p.unit_price_net);
        });
        return initialState;
    });

    // Store original to track dirty cells
    const [originalPrices] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        prices.forEach(p => {
            initialState[`${p.province_id}_${p.catalog_item_id}`] = String(p.unit_price_net);
        });
        return initialState;
    });

    const isDirty = (provId: string, itemId: string) => {
        const key = `${provId}_${itemId}`;
        const curr = localPrices[key] || '';
        const orig = originalPrices[key] || '';
        // Treat null, undefined and '' as '0' for comparison if orig is missing
        const parseCurr = curr === '' ? '0' : curr;
        const parseOrig = orig === '' ? '0' : orig;
        return parseCurr !== parseOrig;
    };

    const handlePriceChange = (provId: string, itemId: string, val: string) => {
        setLocalPrices(prev => ({
            ...prev,
            [`${provId}_${itemId}`]: val,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            // Find modified values
            const updates: { catalog_item_id: string; province_id: string; unit_price_net: number; is_active: boolean }[] = [];

            for (const prov of activeProvinces) {
                for (const item of sortedItems) {
                    const key = `${prov.id}_${item.id}`;
                    if (isDirty(prov.id, item.id)) {
                        const val = localPrices[key];
                        // Only add if we have a valid number or it changed
                        updates.push({
                            catalog_item_id: item.id,
                            province_id: prov.id,
                            unit_price_net: Number(val) || 0,
                            is_active: true,
                        });
                    }
                }
            }

            if (updates.length > 0) {
                const res = await upsertPrices(updates);
                if (res.error) {
                    setError(res.error);
                } else {
                    // Update original map so dirtiness resets
                    // Although a router.refresh() from actions should reload the page
                    window.location.reload();
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = activeProvinces.some(p => sortedItems.some(i => isDirty(p.id, i.id)));

    return (
        <div className="flex flex-col h-full space-y-4">
            <PageHeader
                title="Matriz de Precios Fijos"
                backHref="/master"
                actions={
                    <Button onClick={handleSave} disabled={!hasChanges || saving} className="shadow-sm">
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                }
            />

            {error && (
                <div className="p-3 bg-danger-50 text-danger-700 border border-danger-500/20 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white border text-sm border-gray-200 shadow-sm rounded-lg flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <p className="text-gray-600">
                        Se muestra la configuración de precios unificados (Filas = Provincias, Columnas = Ítems del Catálogo).
                        Los cambios no guardados se marcan en <span className="text-primary-600 font-bold">azul</span>.
                    </p>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse border-spacing-0 whitespace-nowrap">
                        <thead className="bg-gray-100 z-10 sticky top-0 shadow-sm">
                            <tr>
                                <th className="py-3 px-4 font-semibold text-gray-900 border-b border-r border-gray-300 bg-gray-100 sticky left-0 z-20 shadow-sm">
                                    Provincia
                                </th>
                                {sortedItems.map(item => (
                                    <th key={item.id} className="py-3 px-3 font-semibold text-gray-900 border-b border-r border-gray-300 text-center min-w-[120px]">
                                        {item.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {activeProvinces.map((prov, i) => (
                                <tr key={prov.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className={`py-2 px-4 font-medium text-gray-900 border-r border-gray-300 sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} shadow-sm`}>
                                        {prov.name}
                                    </td>
                                    {sortedItems.map(item => {
                                        const dirty = isDirty(prov.id, item.id);
                                        const val = localPrices[`${prov.id}_${item.id}`] ?? '';

                                        return (
                                            <td key={item.id} className={`py-1 px-2 border-r border-gray-200 text-center ${dirty ? 'bg-primary-50' : ''}`}>
                                                <div className="flex items-center justify-center">
                                                    <span className="text-gray-400 mr-1 text-xs">$</span>
                                                    <Input
                                                        type="number"
                                                        value={val}
                                                        onChange={(e) => handlePriceChange(prov.id, item.id, e.target.value)}
                                                        className={`h-7 w-24 text-right text-xs bg-white ${dirty ? 'border-primary-500 font-bold text-primary-700' : 'border-gray-200'}`}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
