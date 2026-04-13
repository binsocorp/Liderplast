'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function SuppliersClient({ suppliers }: { suppliers: any[] }) {
    return (
        <MasterCrud
            title="Proveedores"
            entityTable="suppliers"
            data={suppliers ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'contact', label: 'Contacto' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'category', label: 'Categoría' },
                {
                    key: 'is_active',
                    label: 'Estado',
                    render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'CANCELLED'} />
                },
            ]}
            fields={[
                { key: 'name', label: 'Razón Social', type: 'text', required: true },
                { key: 'contact', label: 'Nombre Contacto', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Teléfono', type: 'text' },
                { key: 'category', label: 'Categoría (Ej: Resina, Flete)', type: 'text' },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
