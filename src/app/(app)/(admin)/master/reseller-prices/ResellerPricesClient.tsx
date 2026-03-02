'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormInputs';
import { upsertResellerPrices } from '../actions';

interface ResellerPricesClientProps {
    lists: { id: string; name: string }[];
    items: { id: string; name: string }[];
    initialPrices: { price_list_id: string; catalog_item_id: string; unit_price_net: number }[];
    cordobaPrices: { catalog_item_id: string; unit_price_net: number }[];
}

export function ResellerPricesClient({ lists, items, initialPrices, cordobaPrices }: ResellerPricesClientProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeLists, setActiveLists] = useState(lists);
    const [addingList, setAddingList] = useState(false);
    const [newListName, setNewListName] = useState('');

    const sortedItems = useMemo(() => {
        const cascos = items.filter(c => c.name.startsWith('P-')).sort((a, b) => a.name.localeCompare(b.name));
        const others = items.filter(c => !c.name.startsWith('P-')).sort((a, b) => a.name.localeCompare(b.name));
        return [...cascos, ...others];
    }, [items]);

    const sortedLists = useMemo(() => {
        return [...activeLists].sort((a, b) => a.name.localeCompare(b.name));
    }, [activeLists]);

    const [localPrices, setLocalPrices] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        initialPrices.forEach(p => {
            initialState[`${p.price_list_id}_${p.catalog_item_id}`] = String(p.unit_price_net);
        });
        return initialState;
    });

    const [originalPrices] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        initialPrices.forEach(p => {
            initialState[`${p.price_list_id}_${p.catalog_item_id}`] = String(p.unit_price_net);
        });
        return initialState;
    });

    const isDirty = (listId: string, itemId: string) => {
        const key = `${listId}_${itemId}`;
        const curr = localPrices[key] || '';
        const orig = originalPrices[key] || '';
        const parseCurr = curr === '' ? '0' : curr;
        const parseOrig = orig === '' ? '0' : orig;
        return parseCurr !== parseOrig;
    };

    const handlePriceChange = (listId: string, itemId: string, val: string) => {
        setLocalPrices(prev => ({
            ...prev,
            [`${listId}_${itemId}`]: val,
        }));
    };

    const handleAddList = async () => {
        if (!newListName.trim()) return;
        setSaving(true);
        const { createEntity } = await import('../actions');
        const res = await createEntity('reseller_price_lists', { name: newListName, is_active: true });
        if (res.error) {
            setError(res.error);
        } else {
            setActiveLists(prev => [...prev, res.data]);
            setAddingList(false);
            setNewListName('');
        }
        setSaving(false);
    };

    const applyCalculatedPrices = (listId: string, multiplier: number) => {
        const newPrices = { ...localPrices };
        items.forEach(item => {
            const cordobaPrice = cordobaPrices.find(p => p.catalog_item_id === item.id)?.unit_price_net || 0;
            if (cordobaPrice > 0) {
                newPrices[`${listId}_${item.id}`] = (cordobaPrice * multiplier).toFixed(0);
            }
        });
        setLocalPrices(newPrices);
    };

    const handleKeyDown = (e: React.KeyboardEvent, listIdx: number, itemIdx: number) => {
        const inputs = document.querySelectorAll('input[data-px-cell]');
        let nextIdx = -1;

        if (e.key === 'ArrowDown') nextIdx = (listIdx + 1) * sortedItems.length + itemIdx;
        if (e.key === 'ArrowUp') nextIdx = (listIdx - 1) * sortedItems.length + itemIdx;
        if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
            nextIdx = listIdx * sortedItems.length + (itemIdx + 1);
        }
        if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
            nextIdx = listIdx * sortedItems.length + (itemIdx - 1);
        }

        if (nextIdx >= 0 && nextIdx < inputs.length) {
            e.preventDefault();
            (inputs[nextIdx] as HTMLInputElement).focus();
            (inputs[nextIdx] as HTMLInputElement).select();
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const updates: { price_list_id: string; catalog_item_id: string; unit_price_net: number }[] = [];

            for (const list of sortedLists) {
                for (const item of sortedItems) {
                    if (isDirty(list.id, item.id)) {
                        const key = `${list.id}_${item.id}`;
                        updates.push({
                            price_list_id: list.id,
                            catalog_item_id: item.id,
                            unit_price_net: Number(localPrices[key]) || 0,
                        });
                    }
                }
            }

            if (updates.length > 0) {
                const res = await upsertResellerPrices(updates);
                if (res.error) {
                    setError(res.error);
                } else {
                    window.location.reload();
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = sortedLists.some(l => sortedItems.some(i => isDirty(l.id, i.id)));

    return (
        <div className="flex flex-col h-full space-y-4">
            <PageHeader
                title="Precios para Revendedores"
                backHref="/master"
                actions={
                    <Button onClick={handleSave} disabled={!hasChanges || saving}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                }
            />

            {error && (
                <div className="p-3 bg-danger-50 text-danger-700 border border-danger-500/20 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white border text-sm border-gray-200 shadow-xl rounded-2xl flex-1 overflow-hidden flex flex-col mb-8">
                <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Matriz de Precios</h3>
                        <p className="text-gray-400 text-xs font-medium">Edición directa estilo planilla. Teclas de flecha para navegar.</p>
                    </div>
                    <div className="flex gap-2">
                        {addingList ? (
                            <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                                <Input
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                    placeholder="Nombre de la lista..."
                                    className="h-10 w-48 rounded-xl"
                                    autoFocus
                                />
                                <Button size="sm" onClick={handleAddList} disabled={saving}>Crear</Button>
                                <Button size="sm" variant="secondary" onClick={() => setAddingList(false)}>X</Button>
                            </div>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setAddingList(true)}
                                className="bg-primary-50 text-primary-700 border-primary-100 hover:bg-primary-100 font-bold px-4"
                            >
                                + Nueva Lista de Precios
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-50/30">
                    <table className="w-full text-left border-collapse border-spacing-0 whitespace-nowrap">
                        <thead className="bg-white z-10 sticky top-0 shadow-sm">
                            <tr>
                                <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-r border-gray-100 bg-white sticky left-0 z-20 w-80">
                                    Lista / Herramientas
                                </th>
                                {sortedItems.map(item => (
                                    <th key={item.id} className="py-4 px-4 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-r border-gray-100 text-center min-w-[140px]">
                                        {item.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedLists.map((list, lIdx) => (
                                <tr key={list.id} className="group hover:bg-white transition-colors bg-white/40">
                                    <td className="py-3 px-6 border-r border-gray-100 sticky left-0 z-10 bg-inherit shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-gray-800 text-sm">{list.name}</span>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => applyCalculatedPrices(list.id, 0.85)}
                                                    className="text-[9px] font-black uppercase tracking-tighter text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"
                                                >
                                                    -15% Cba
                                                </button>
                                                <button
                                                    onClick={() => applyCalculatedPrices(list.id, 1.15)}
                                                    className="text-[9px] font-black uppercase tracking-tighter text-purple-600 hover:text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100"
                                                >
                                                    +15% Cba
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    {sortedItems.map((item, iIdx) => {
                                        const dirty = isDirty(list.id, item.id);
                                        const val = localPrices[`${list.id}_${item.id}`] ?? '';

                                        return (
                                            <td key={item.id} className={`p-0 border-r border-gray-100 text-center transition-colors ${dirty ? 'bg-primary-50/50' : ''}`}>
                                                <input
                                                    type="number"
                                                    value={val}
                                                    data-px-cell
                                                    onChange={(e) => handlePriceChange(list.id, item.id, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, lIdx, iIdx)}
                                                    className={`w-full h-12 px-3 text-right bg-transparent border-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-medium text-gray-700 outline-none ${dirty ? 'text-primary-700 font-black' : ''}`}
                                                />
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
