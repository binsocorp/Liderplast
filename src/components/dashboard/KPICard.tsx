'use client';

import React from 'react';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    };
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
    description?: string;
}

export function KPICard({
    title,
    value,
    trend,
    icon,
    color = 'primary',
    className = '',
    description
}: KPICardProps) {
    const colorClasses = {
        primary: 'bg-primary-500/10 text-primary-600',
        success: 'bg-green-500/10 text-green-600',
        warning: 'bg-warning-500/10 text-warning-600',
        danger: 'bg-danger-500/10 text-danger-600',
        info: 'bg-blue-500/10 text-blue-600',
    };

    return (
        <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        {title}
                    </h3>
                    <div className="text-2xl font-black text-gray-900 leading-tight">
                        {value}
                    </div>
                </div>
                {icon && (
                    <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
                        {icon}
                    </div>
                )}
            </div>

            {(trend || description) && (
                <div className="mt-4 flex items-center gap-2">
                    {trend && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-bold ${trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-danger-50 text-danger-600'
                            }`}>
                            <svg
                                className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            {trend.value}%
                        </div>
                    )}
                    {(trend?.label || description) && (
                        <span className="text-[11px] font-medium text-gray-400">
                            {trend?.label || description}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export function KPIContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {children}
        </div>
    );
}
