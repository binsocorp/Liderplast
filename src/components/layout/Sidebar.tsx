'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isAdmin: boolean;
    lowStockCount?: number;
}

const NAV_ITEMS = [
    {
        label: 'Cotizaciones',
        href: '/cotizaciones',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        adminOnly: false,
    },
    {
        label: 'Pedidos',
        href: '/orders',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        adminOnly: false,
        subItems: [
            { label: 'Todos los pedidos', href: '/orders' },
            { label: 'Archivados', href: '/orders/archivados' },
        ]
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
        label: 'Inventario',
        href: '/inventario',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        adminOnly: false,
        subItems: [
            { label: 'Stock', href: '/inventario' },
            { label: 'Movimientos', href: '/inventario/movimientos' },
            { label: 'Compras', href: '/inventario/compras' },
        ]
    },
    {
        label: 'Producción',
        href: '/produccion',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        adminOnly: false,
        subItems: [
            { label: 'Producción', href: '/produccion' },
            { label: 'BOM', href: '/produccion/bom' },
        ]
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
            { label: 'Caja', href: '/finance/caja' },
        ]
    }
];

const ADMIN_ITEMS = [
    {
        label: 'Dashboard',
        href: '/dashboard/executive',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
        ),
        subItems: [
            { label: 'Resumen Ejecutivo', href: '/dashboard/executive' },
            { label: 'Finanzas y Costos', href: '/dashboard/finance' },
            { label: 'Ventas y Clientes', href: '/dashboard/sales' },
            { label: 'Finanzas (Caja)', href: '/dashboard/finanzas' },
        ]
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

export function Sidebar({ isAdmin, lowStockCount = 0 }: SidebarProps) {
    const pathname = usePathname();

    const renderItem = (item: any) => {
        const isActive = item.subItems
            ? item.subItems.some((sub: any) => pathname.startsWith(sub.href))
            : pathname.startsWith(item.href);
        const showStockBadge = item.href === '/inventario' && lowStockCount > 0;
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
                    <div className="ml-auto flex items-center gap-1">
                        {showStockBadge && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                                {lowStockCount}
                            </span>
                        )}
                        {isActive && !showStockBadge && (
                            <div className="w-1.5 h-1.5 rounded-full bg-sidebar-300 animate-pulse" />
                        )}
                    </div>
                </Link>
                {item.subItems && (isActive || pathname.startsWith(item.href)) && (
                    <div className="ml-9 space-y-0.5 border-l border-sidebar-600 pl-3">
                        {item.subItems.map((sub: any) => (
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
    };

    return (
        <aside className="w-64 bg-gradient-to-b from-sidebar-900 to-sidebar-800 flex flex-col h-full shadow-xl">
            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-white/10">
                <Link href="/orders" className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-black/20 overflow-hidden">
                        <img
                            src="/logo-institutional.png"
                            alt="Liderplast"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.svg';
                            }}
                        />
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter uppercase">Liderplast</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                <p className="px-3 text-[11px] font-semibold text-sidebar-300 uppercase tracking-widest mb-3">
                    General
                </p>
                {NAV_ITEMS.map(renderItem)}

                {isAdmin && (
                    <>
                        <div className="pt-5 pb-2">
                            <p className="px-3 text-[11px] font-semibold text-sidebar-300 uppercase tracking-widest">
                                Administración
                            </p>
                        </div>
                        {ADMIN_ITEMS.map(renderItem)}
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
