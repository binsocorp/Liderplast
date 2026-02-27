'use client';

import { logoutAction } from '@/app/(auth)/actions';
import type { UserRole } from '@/lib/types/database';
import { useState } from 'react';

interface HeaderProps {
    userName: string;
    userRole: UserRole;
}

export function Header({ userName, userRole }: HeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 shrink-0">
            {/* Barra de búsqueda */}
            <div className="relative w-full max-w-md">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
            </div>

            {/* Perfil */}
            <div className="relative ml-4">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors"
                >
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-bold">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-[11px] text-gray-500 font-medium">
                            {userRole === 'ADMIN' ? 'Administrador' : 'Usuario'}
                        </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {menuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                            <form action={logoutAction}>
                                <button
                                    type="submit"
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cerrar Sesión
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
