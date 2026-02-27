'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isAdmin: boolean;
}

const NAV_ITEMS = [
    {
        label: 'Pedidos',
        href: '/orders',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        adminOnly: false,
    },
    {
        label: 'Fletes',
        href: '/fletes',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h8m-8 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
        ),
        adminOnly: false,
    },
    {
        label: 'Finanzas',
        href: '/finance/expenses',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        adminOnly: false,
        subItems: [
            { label: 'Ingresos', href: '/finance/income' },
            { label: 'Egresos', href: '/finance/expenses' },
        ]
    }
];

const ADMIN_ITEMS = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        label: 'Datos Maestros',
        href: '/master',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
        ),
    },
];

export function Sidebar({ isAdmin }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gradient-to-b from-sidebar-900 to-sidebar-800 flex flex-col h-full shadow-xl">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/10">
                <Link href="/orders" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold text-sm">LP</span>
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Liderplast</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                <p className="px-3 text-[11px] font-semibold text-sidebar-300 uppercase tracking-widest mb-3">
                    General
                </p>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <div key={item.href} className="space-y-0.5">
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white/15 text-white shadow-sm shadow-black/10'
                                    : 'text-sidebar-200 hover:text-white hover:bg-white/8'
                                    }`}
                            >
                                <span className={`transition-colors ${isActive ? 'text-white' : 'text-sidebar-400'}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-300 animate-pulse" />
                                )}
                            </Link>
                            {item.subItems && (isActive || pathname.startsWith(item.href)) && (
                                <div className="ml-9 space-y-0.5 border-l border-sidebar-600 pl-3">
                                    {item.subItems.map(sub => (
                                        <Link
                                            key={sub.href}
                                            href={sub.href}
                                            className={`block py-1.5 text-xs font-medium transition-colors rounded-lg px-2 ${pathname === sub.href
                                                ? 'text-white bg-white/8'
                                                : 'text-sidebar-300 hover:text-white'
                                                }`}
                                        >
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {isAdmin && (
                    <>
                        <div className="pt-5 pb-2">
                            <p className="px-3 text-[11px] font-semibold text-sidebar-300 uppercase tracking-widest">
                                Administración
                            </p>
                        </div>
                        {ADMIN_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-white/15 text-white shadow-sm shadow-black/10'
                                        : 'text-sidebar-200 hover:text-white hover:bg-white/8'
                                        }`}
                                >
                                    <span className={`transition-colors ${isActive ? 'text-white' : 'text-sidebar-400'}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-300 animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* Versión */}
            <div className="p-4 border-t border-white/10">
                <p className="text-[11px] text-sidebar-400 text-center font-medium">v1.0.0 — Liderplast</p>
            </div>
        </aside>
    );
}
