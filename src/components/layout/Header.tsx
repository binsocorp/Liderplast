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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0">
            <div className="relative">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 text-sm font-semibold">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500">
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
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <form action={logoutAction}>
                                <button
                                    type="submit"
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
