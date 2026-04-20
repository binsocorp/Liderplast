'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, FormGrid } from '@/components/ui/FormSection';
import { Input, Select, Textarea, Checkbox } from '@/components/ui/FormInputs';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Pencil, Plus, Banknote } from 'lucide-react';
import { createEntity, updateEntity, deleteEntity } from './actions';

// ... (skipping some interfaces)

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
    renderType?: 'currency' | 'badge' | 'id' | 'boolean';
}

interface MasterCrudProps {
    title: string;
    entityTable: 'provinces' | 'clients' | 'sellers' | 'resellers' | 'suppliers' | 'catalog_items' | 'prices' | 'installers' | 'trips' | 'drivers' | 'vehicles' |
    'finance_categories' | 'finance_subcategories' | 'finance_payment_methods' | 'finance_vendors' | 'finance_cost_centers' | 'reseller_price_lists' | 'reseller_prices';
    columns: MasterColumn[];
    fields: FieldDef[];
    data: Record<string, unknown>[];
    backHref?: string;
    autoOpen?: boolean;
}

export function MasterCrud({ title, entityTable, columns, fields, data, backHref = '/master', autoOpen }: MasterCrudProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(!!autoOpen);
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

    useEffect(() => {
        if (autoOpen) openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (col.renderType === 'badge' || col.renderType === 'boolean') {
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
                render: (row: any) => row[col.key] ? `$${Number(row[col.key]).toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '-'
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
                <div className="flex items-center gap-1 justify-end">
                    {entityTable === 'reseller_price_lists' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); router.push(`/master/reseller-prices`); }}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50"
                            title="Gestionar Precios"
                            icon={<Banknote className="w-4 h-4" />}
                        />
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                        title="Editar"
                        icon={<Pencil className="w-4 h-4" />}
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id as string); }}
                        className="p-1.5 text-gray-400 hover:text-danger-500 hover:bg-danger-50"
                        title="Eliminar"
                        icon={<Trash2 className="w-4 h-4" />}
                    />
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
                    <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>Nuevo</Button>
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
