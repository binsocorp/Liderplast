'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select, Textarea, Checkbox } from '@/components/ui/FormInputs';
import { Badge } from '@/components/ui/Badge';
import { createEntity, updateEntity, deleteEntity } from './actions';

// -----------------------------------------------
// Generic CRUD Client component for Master Data
// -----------------------------------------------

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'email' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'number';
    required?: boolean;
    options?: { value: string; label: string }[];
    defaultValue?: string | boolean | number | string[];
    placeholder?: string;
}

interface MasterColumn extends Column<Record<string, unknown>> {
    renderType?: 'boolean' | 'currency' | 'badge';
}

interface MasterCrudProps {
    title: string;
    entityTable: 'provinces' | 'clients' | 'sellers' | 'resellers' | 'suppliers' | 'catalog_items' | 'prices' | 'installers' | 'trips' | 'drivers' | 'vehicles' |
    'finance_categories' | 'finance_subcategories' | 'finance_payment_methods' | 'finance_vendors' | 'finance_cost_centers' | 'reseller_price_lists' | 'reseller_prices';
    columns: MasterColumn[];
    fields: FieldDef[];
    data: Record<string, unknown>[];
    backHref?: string;
}

export function MasterCrud({ title, entityTable, columns, fields, data, backHref = '/master' }: MasterCrudProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function openCreate() {
        setEditingId(null);
        const defaults: Record<string, unknown> = {};
        fields.forEach(f => {
            defaults[f.key] = f.defaultValue ?? (f.type === 'checkbox' ? true : f.type === 'multiselect' ? [] : '');
        });
        setFormData(defaults);
        setShowModal(true);
    }

    function openEdit(row: Record<string, unknown>) {
        setEditingId(row.id as string);
        const values: Record<string, unknown> = {};
        fields.forEach(f => {
            values[f.key] = row[f.key] ?? f.defaultValue ?? (f.type === 'multiselect' ? [] : '');
        });
        setFormData(values);
        setShowModal(true);
    }

    async function handleSave() {
        setSaving(true);
        setError(null);

        let result;
        if (editingId) {
            result = await updateEntity(entityTable, editingId, formData);
        } else {
            result = await createEntity(entityTable, formData);
        }

        if ('error' in result && result.error) {
            setError(result.error);
        } else {
            setShowModal(false);
            router.refresh();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        const result = await deleteEntity(entityTable, id);
        if (result.error) {
            setError(result.error);
        } else {
            router.refresh();
        }
    }

    // Map columns to include declarative rendering
    const mappedColumns: Column<Record<string, unknown>>[] = columns.map(col => {
        if (col.renderType === 'boolean') {
            return {
                ...col,
                render: (row: any) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row[col.key] ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                        {row[col.key] ? 'Activo' : 'Inactivo'}
                    </span>
                )
            };
        }
        if (col.renderType === 'badge') {
            return {
                ...col,
                render: (row: any) => (
                    <Badge status={row[col.key] ? 'ACTIVE' : 'PAUSED'} />
                )
            };
        }
        if (col.renderType === 'currency') {
            return {
                ...col,
                render: (row: any) => row[col.key] ? `$${Number(row[col.key]).toLocaleString('es-AR')}` : '-'
            };
        }
        return col as Column<Record<string, unknown>>;
    });

    // Add action column
    const allColumns: Column<Record<string, unknown>>[] = [
        ...mappedColumns,
        {
            key: '_actions',
            label: '',
            className: 'w-24',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id as string); }}
                        className="p-1.5 text-gray-400 hover:text-danger-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ),
        },
    ];

    function updateField(key: string, value: unknown) {
        setFormData(prev => ({ ...prev, [key]: value }));
    }

    return (
        <>
            <PageHeader
                title={title}
                backHref={backHref}
                subtitle={`${data.length} registro${data.length !== 1 ? 's' : ''}`}
                actions={
                    <Button onClick={openCreate}>+ Nuevo</Button>
                }
            />

            {error && (
                <div className="mb-4 p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700 text-sm">
                    {error}
                </div>
            )}

            <DataTable
                columns={allColumns}
                data={data}
                keyExtractor={(row) => row.id as string}
                emptyMessage="No hay registros"
            />

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? `Editar ${title}` : `Nuevo ${title}`}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <FormGrid>
                        {fields.map((field) => (
                            <FormField key={field.key} label={field.label} required={field.required}>
                                {field.type === 'checkbox' ? (
                                    <Checkbox
                                        label={field.label}
                                        checked={formData[field.key] as boolean}
                                        onChange={(e) => updateField(field.key, e.target.checked)}
                                    />
                                ) : field.type === 'select' ? (
                                    <Select
                                        value={String(formData[field.key] || '')}
                                        onChange={(e) => updateField(field.key, e.target.value)}
                                        options={field.options || []}
                                        placeholder={field.placeholder || 'Seleccionar'}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <Textarea
                                        value={String(formData[field.key] || '')}
                                        onChange={(e) => updateField(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                ) : field.type === 'multiselect' && field.options ? (
                                    <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                        {field.options.map((opt) => {
                                            const currentValues = (formData[field.key] as string[]) || [];
                                            const isChecked = currentValues.includes(opt.value);
                                            return (
                                                <Checkbox
                                                    key={opt.value}
                                                    label={opt.label}
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const newVal = e.target.checked
                                                            ? [...currentValues, opt.value]
                                                            : currentValues.filter((v) => v !== opt.value);
                                                        updateField(field.key, newVal);
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <Input
                                        type={field.type}
                                        value={String(formData[field.key] || '')}
                                        onChange={(e) => updateField(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                        placeholder={field.placeholder}
                                        required={field.required}
                                    />
                                )}
                            </FormField>
                        ))}
                    </FormGrid>
                </div>
            </Modal>
        </>
    );
}
