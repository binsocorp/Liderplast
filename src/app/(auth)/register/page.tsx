'use client';

import { useState } from 'react';
import { registerAction } from '../actions';
import Link from 'next/link';

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        const result = await registerAction(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Crear Cuenta</h2>

            {error && (
                <div className="mb-4 p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700 text-sm">
                    {error}
                </div>
            )}

            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo
                    </label>
                    <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                        placeholder="Juan Pérez"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                        placeholder="tu@email.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Iniciar Sesión
                </Link>
            </p>
        </div>
    );
}
