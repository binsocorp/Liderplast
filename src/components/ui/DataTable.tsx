'use client';

import { ReactNode } from 'react';

// -----------------------------------------------
// Column definition
// -----------------------------------------------

export interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    className?: string;
    sortable?: boolean;
}

// -----------------------------------------------
// DataTable component
// -----------------------------------------------

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    emptyMessage = 'No hay datos para mostrar',
}: DataTableProps<T>) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center text-sm text-gray-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    onClick={() => onRowClick?.(row)}
                                    className={`transition-colors ${onRowClick
                                            ? 'cursor-pointer hover:bg-gray-50'
                                            : ''
                                        }`}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-4 py-3.5 text-sm text-gray-700 ${col.className || ''}`}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
