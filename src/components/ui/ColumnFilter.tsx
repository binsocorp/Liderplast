'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface ColumnFilterOption {
    value: string;
    label: string;
}

interface ColumnFilterProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: ColumnFilterOption[];
    allLabel?: string;
}

export function ColumnFilter({ label, value, onChange, options, allLabel = 'Todos' }: ColumnFilterProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const selectedLabel = value
        ? options.find(o => o.value === value)?.label || value
        : null;

    const filteredOptions = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`
                    flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider
                    px-2 py-1.5 rounded-lg transition-all cursor-pointer select-none
                    ${value
                        ? 'text-primary-700 bg-primary-50 border border-primary-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                `}
            >
                <span>{label}</span>
                {selectedLabel && (
                    <span className="text-primary-600 font-black text-[10px] max-w-[80px] truncate">
                        ({selectedLabel})
                    </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                {value && (
                    <span
                        onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-primary-200 text-primary-500 hover:text-primary-700 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[220px] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl shadow-gray-900/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search */}
                    <div className="p-2.5 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={label}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all placeholder:text-gray-400"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-52 overflow-y-auto p-1.5">
                        {/* "All" option */}
                        <button
                            onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                            className={`
                                w-full text-left px-3 py-2 text-sm rounded-xl transition-all
                                ${!value
                                    ? 'bg-primary-50 text-primary-700 font-bold'
                                    : 'text-gray-600 hover:bg-gray-50 font-medium'
                                }
                            `}
                        >
                            {allLabel}
                        </button>

                        {filteredOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                                className={`
                                    w-full text-left px-3 py-2 text-sm rounded-xl transition-all
                                    ${value === opt.value
                                        ? 'bg-primary-50 text-primary-700 font-bold'
                                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}

                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-gray-400 font-medium">
                                Sin resultados
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
