import { ReactNode } from 'react';

interface CardContainerProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        label?: string;
    };
}

export function CardContainer({ title, value, subtitle, icon, trend }: CardContainerProps) {
    const isPositive = trend && trend.value >= 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                    )}
                </div>
                {icon && (
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                        {icon}
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-3 flex items-center gap-1">
                    <span
                        className={`text-xs font-medium ${isPositive ? 'text-success-500' : 'text-danger-500'
                            }`}
                    >
                        {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                    {trend.label && (
                        <span className="text-xs text-gray-400">{trend.label}</span>
                    )}
                </div>
            )}
        </div>
    );
}

// Stats cards row
export function StatsRow({ children }: { children: ReactNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {children}
        </div>
    );
}
