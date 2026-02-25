'use client';

import { ReactNode } from 'react';

// -----------------------------------------------
// Filter Chip
// -----------------------------------------------

interface FilterChipProps {
    label: string;
    active?: boolean;
    onRemove?: () => void;
    onClick?: () => void;
}

function FilterChip({ label, active = true, onRemove, onClick }: FilterChipProps) {
    return (
        <button
            onClick={onClick || onRemove}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
        >
            {label}
            {onRemove && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
        </button>
    );
}

// -----------------------------------------------
// FilterBar
// -----------------------------------------------

interface FilterBarProps {
    children?: ReactNode;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
}

export function FilterBar({
    children,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
}: FilterBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2 flex-1">
                {children}
            </div>
            {onSearchChange && (
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64 transition-colors"
                    />
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------
// Select filter
// -----------------------------------------------

interface SelectFilterProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    allLabel?: string;
}

export function SelectFilter({
    label,
    value,
    onChange,
    options,
    allLabel = 'Todos',
}: SelectFilterProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            aria-label={label}
        >
            <option value="">{allLabel}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export { FilterChip };
