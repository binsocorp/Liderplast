import { ReactNode } from 'react';
import Link from 'next/link';

// -----------------------------------------------
// Page Header
// -----------------------------------------------

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    backHref?: string;
}

export function PageHeader({ title, subtitle, actions, backHref }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                {backHref && (
                    <Link
                        href={backHref}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
