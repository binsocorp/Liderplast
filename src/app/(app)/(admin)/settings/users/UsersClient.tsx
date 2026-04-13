'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Select } from '@/components/ui/FormInputs';
import { updateUserProfile, createUser } from './actions';

interface UserWithProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    can_override_prices: boolean;
    created_at: string;
    last_sign_in_at: string | null;
}

interface Props {
    users: UserWithProfile[];
}

const EMPTY_INVITE = { email: '', password: '', full_name: '', role: 'USER' };

export function UsersClient({ users }: Props) {
    const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
    const [form, setForm] = useState({ role: '', can_override_prices: false });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [inviting, setInviting] = useState(false);
    const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
    const [inviteError, setInviteError] = useState('');
    const [inviteSaving, setInviteSaving] = useState(false);

    function openEdit(user: UserWithProfile) {
        setEditingUser(user);
        setForm({ role: user.role, can_override_prices: user.can_override_prices });
        setError('');
    }

    async function handleInvite() {
        if (!inviteForm.email || !inviteForm.password) return;
        setInviteSaving(true);
        setInviteError('');
        const result = await createUser(inviteForm);
        if ('error' in result && result.error) {
            setInviteError(result.error);
        } else {
            setInviting(false);
            setInviteForm(EMPTY_INVITE);
        }
        setInviteSaving(false);
    }

    async function handleSave() {
        if (!editingUser) return;
        setSaving(true);
        setError('');
        const result = await updateUserProfile(editingUser.id, {
            role: form.role,
            can_override_prices: form.can_override_prices,
        });
        if ('error' in result && result.error) {
            setError(result.error);
        } else {
            setEditingUser(null);
        }
        setSaving(false);
    }

    const columns: Column<UserWithProfile>[] = [
        {
            key: 'email',
            label: 'Email',
            render: (row) => <span className="font-medium text-gray-900">{row.email}</span>
        },
        {
            key: 'full_name',
            label: 'Nombre',
            render: (row) => <span className="text-gray-700">{row.full_name || '—'}</span>
        },
        {
            key: 'role',
            label: 'Rol',
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    row.role === 'ADMIN'
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    {row.role}
                </span>
            )
        },
        {
            key: 'can_override_prices',
            label: 'Override precios',
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    row.can_override_prices
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    {row.can_override_prices ? 'Sí' : 'No'}
                </span>
            )
        },
        {
            key: 'last_sign_in_at',
            label: 'Último acceso',
            render: (row) => (
                <span className="text-sm text-gray-500 tabular-nums">
                    {row.last_sign_in_at
                        ? new Date(row.last_sign_in_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : 'Nunca'}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => openEdit(row)}
                        className="text-gray-400 hover:text-primary-600 p-1 rounded-lg hover:bg-primary-50 transition-colors"
                        title="Editar permisos"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <PageHeader
                title="Usuarios y Permisos"
                subtitle="Administrá los roles y permisos de los usuarios de la aplicación"
                actions={
                    <Button onClick={() => { setInviteForm(EMPTY_INVITE); setInviteError(''); setInviting(true); }}>
                        Nuevo usuario
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={users}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay usuarios registrados"
            />

            <Modal
                open={inviting}
                onClose={() => setInviting(false)}
                title="Nuevo usuario"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setInviting(false)}>Cancelar</Button>
                        <Button onClick={handleInvite} disabled={inviteSaving || !inviteForm.email || !inviteForm.password}>
                            {inviteSaving ? 'Creando...' : 'Crear usuario'}
                        </Button>
                    </>
                }
            >
                {inviteError && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {inviteError}
                    </div>
                )}
                <FormGrid cols={1}>
                    <FormField label="Email" required>
                        <input
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="usuario@empresa.com"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </FormField>
                    <FormField label="Nombre completo">
                        <input
                            type="text"
                            value={inviteForm.full_name}
                            onChange={(e) => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                            placeholder="Juan Pérez"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </FormField>
                    <FormField label="Contraseña" required>
                        <input
                            type="password"
                            value={inviteForm.password}
                            onChange={(e) => setInviteForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </FormField>
                    <FormField label="Rol" required>
                        <Select
                            value={inviteForm.role}
                            onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value }))}
                            options={[
                                { value: 'USER', label: 'Usuario' },
                                { value: 'ADMIN', label: 'Administrador' },
                            ]}
                        />
                    </FormField>
                </FormGrid>
            </Modal>

            <Modal
                open={!!editingUser}
                onClose={() => setEditingUser(null)}
                title={`Editar permisos — ${editingUser?.email ?? ''}`}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </>
                }
            >
                {error && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                        {error}
                    </div>
                )}

                <FormGrid cols={1}>
                    <FormField label="Rol" required>
                        <Select
                            value={form.role}
                            onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                            options={[
                                { value: 'ADMIN', label: 'Administrador' },
                                { value: 'USER', label: 'Usuario' },
                            ]}
                        />
                    </FormField>
                    <FormField label="Puede override precios">
                        <div className="flex items-center gap-3 mt-1">
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, can_override_prices: !f.can_override_prices }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    form.can_override_prices ? 'bg-primary-600' : 'bg-gray-200'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    form.can_override_prices ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                            <span className="text-sm text-gray-700">
                                {form.can_override_prices ? 'Habilitado' : 'Deshabilitado'}
                            </span>
                        </div>
                    </FormField>
                </FormGrid>
            </Modal>
        </>
    );
}
