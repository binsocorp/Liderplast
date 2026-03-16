'use client';

import React from 'react';

interface FilterOption {
    value: string;
    label: string;
}

interface DashboardFiltersProps {
    dateRange: {
        from: string;
        to: string;
    };
    onDateRangeChange: (range: { from: string; to: string }) => void;
    filters?: {
        label: string;
        value: string;
        options: FilterOption[];
        onChange: (value: string) => void;
    }[];
}

export function DashboardFilters({
    dateRange,
    onDateRangeChange,
    filters = []
}: DashboardFiltersProps) {
    return (
        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-4 mb-6 sticky top-0 z-30 flex flex-wrap items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                        className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 px-2 py-1"
                    />
                    <span className="text-gray-400 text-[10px] font-black mx-1">—</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                        className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 px-2 py-1"
                    />
                </div>
            </div>

            {filters.map((filter, idx) => (
                <div key={idx} className="flex flex-col">
                    <select
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="bg-gray-100 border-none rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary-500/10 min-w-[120px] px-3 py-2 cursor-pointer transition-all hover:bg-gray-200"
                    >
                        <option value="">{filter.label}: Todos</option>
                        {filter.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            ))}

            <button
                onClick={() => {
                    // Reset could be handled by parent
                }}
                className="ml-auto p-2 text-gray-400 hover:text-primary-600 transition-colors bg-gray-100/50 hover:bg-primary-50 rounded-xl"
                title="Limpiar filtros"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
    );
}
