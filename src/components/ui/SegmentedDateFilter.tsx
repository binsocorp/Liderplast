import { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

export type DateFilterPreset = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM' | 'ALL';

interface SegmentedDateFilterProps {
    dateFrom: string;
    dateTo: string;
    onChange: (from: string, to: string) => void;
}

export function SegmentedDateFilter({ dateFrom, dateTo, onChange }: SegmentedDateFilterProps) {
    const [preset, setPreset] = useState<DateFilterPreset>('ALL');

    useEffect(() => {
        // Si las fechas se limpian desde afuera, resetear a ALL
        if (!dateFrom && !dateTo && preset !== 'ALL') {
            setPreset('ALL');
        }
    }, [dateFrom, dateTo]);

    const handlePresetChange = (newPreset: DateFilterPreset) => {
        setPreset(newPreset);
        const today = new Date();
        const offset = today.getTimezoneOffset();
        today.setMinutes(today.getMinutes() - offset); // Local ISO string hack
        const todayStr = today.toISOString().split('T')[0];

        if (newPreset === 'ALL') {
            onChange('', '');
        } else if (newPreset === 'DAY') {
            onChange(todayStr, todayStr);
        } else if (newPreset === 'WEEK') {
            const first = new Date(today.getTime());
            first.setDate(first.getDate() - first.getDay() + 1); // Monday
            const last = new Date(first.getTime());
            last.setDate(first.getDate() + 6); // Sunday
            first.setMinutes(first.getMinutes() - offset);
            last.setMinutes(last.getMinutes() - offset);
            onChange(first.toISOString().split('T')[0], last.toISOString().split('T')[0]);
        } else if (newPreset === 'MONTH') {
            const first = new Date(today.getFullYear(), today.getMonth(), 1);
            const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            first.setMinutes(first.getMinutes() - offset);
            last.setMinutes(last.getMinutes() - offset);
            onChange(first.toISOString().split('T')[0], last.toISOString().split('T')[0]);
        } else if (newPreset === 'YEAR') {
            const first = new Date(today.getFullYear(), 0, 1);
            const last = new Date(today.getFullYear(), 11, 31);
            first.setMinutes(first.getMinutes() - offset);
            last.setMinutes(last.getMinutes() - offset);
            onChange(first.toISOString().split('T')[0], last.toISOString().split('T')[0]);
        } else if (newPreset === 'CUSTOM') {
            // Leave dates as they are, just let the user edit the inputs
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200 w-fit">
                {(['ALL', 'DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as DateFilterPreset[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handlePresetChange(tab)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${preset === tab
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab === 'ALL' ? 'Todo' :
                            tab === 'DAY' ? 'Día' :
                                tab === 'WEEK' ? 'Semana' :
                                    tab === 'MONTH' ? 'Mes' :
                                        tab === 'YEAR' ? 'Año' :
                                            'Rango'}
                    </button>
                ))}
            </div>

            {/* Custom Range Inputs */}
            {preset === 'CUSTOM' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 pl-2 border-l border-gray-100">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onChange(e.target.value, dateTo)}
                        className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onChange(dateFrom, e.target.value)}
                        className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => handlePresetChange('ALL')}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                            title="Limpiar rango"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
