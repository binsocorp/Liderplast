'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function CatalogClient({ catalogItems }: { catalogItems: any[] }) {
    return (
        <MasterCrud
            title="Catálogo"
            entityTable="catalog_items"
            data={catalogItems ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'sku', label: 'SKU' },
                {
                    key: 'type',
                    label: 'Tipo',
                    render: (row) => <Badge status={row.type as string} />
                },
                { key: 'category', label: 'Categoría' },
                {
                    key: 'is_active',
                    label: 'Estado',
                    render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'CANCELLED'} />
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre del Ítem', type: 'text', required: true },
                { key: 'sku', label: 'Código/SKU', type: 'text' },
                {
                    key: 'type',
                    label: 'Tipo',
                    type: 'select',
                    options: [
                        { value: 'PRODUCTO', label: 'Producto' },
                        { value: 'SERVICIO', label: 'Servicio' }
                    ],
                    defaultValue: 'PRODUCTO',
                    required: true
                },
                { key: 'category', label: 'Categoría', type: 'text' },
                { key: 'description', label: 'Descripción Breve', type: 'textarea' },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
