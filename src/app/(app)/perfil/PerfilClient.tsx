'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { updateName, updatePassword } from './actions';

interface Props {
    email: string;
    fullName: string | null;
}

export function PerfilClient({ email, fullName }: Props) {
    const [name, setName] = useState(fullName ?? '');
    const [nameSaving, setNameSaving] = useState(false);
    const [nameMsg, setNameMsg] = useState('');
    const [nameError, setNameError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordError, setPasswordError] = useState('');

    async function handleNameSave() {
        setNameSaving(true);
        setNameMsg('');
        setNameError('');
        const result = await updateName(name);
        if ('error' in result && result.error) {
            setNameError(result.error);
        } else {
            setNameMsg('Nombre actualizado.');
        }
        setNameSaving(false);
    }

    async function handlePasswordSave() {
        if (password !== passwordConfirm) {
            setPasswordError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setPasswordSaving(true);
        setPasswordMsg('');
        setPasswordError('');
        const result = await updatePassword(password);
        if ('error' in result && result.error) {
            setPasswordError(result.error);
        } else {
            setPasswordMsg('Contraseña actualizada.');
            setPassword('');
            setPasswordConfirm('');
        }
        setPasswordSaving(false);
    }

    return (
        <>
            <PageHeader
                title="Mi perfil"
                subtitle="Gestioná tu información personal y contraseña"
            />

            <div className="max-w-lg space-y-8">
                {/* Datos personales */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Datos personales</h2>
                    <FormGrid cols={1}>
                        <FormField label="Email">
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                            />
                        </FormField>
                        <FormField label="Nombre completo">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setNameMsg(''); setNameError(''); }}
                                placeholder="Tu nombre"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </FormField>
                    </FormGrid>
                    {nameError && (
                        <p className="mt-3 text-sm text-danger-600">{nameError}</p>
                    )}
                    {nameMsg && (
                        <p className="mt-3 text-sm text-success-600">{nameMsg}</p>
                    )}
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleNameSave} disabled={nameSaving || !name.trim()}>
                            {nameSaving ? 'Guardando...' : 'Guardar nombre'}
                        </Button>
                    </div>
                </div>

                {/* Cambiar contraseña */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>
                    <FormGrid cols={1}>
                        <FormField label="Nueva contraseña">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordMsg(''); setPasswordError(''); }}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </FormField>
                        <FormField label="Confirmar contraseña">
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => { setPasswordConfirm(e.target.value); setPasswordMsg(''); setPasswordError(''); }}
                                placeholder="Repetí la contraseña"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </FormField>
                    </FormGrid>
                    {passwordError && (
                        <p className="mt-3 text-sm text-danger-600">{passwordError}</p>
                    )}
                    {passwordMsg && (
                        <p className="mt-3 text-sm text-success-600">{passwordMsg}</p>
                    )}
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handlePasswordSave} disabled={passwordSaving || !password || !passwordConfirm}>
                            {passwordSaving ? 'Guardando...' : 'Cambiar contraseña'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
