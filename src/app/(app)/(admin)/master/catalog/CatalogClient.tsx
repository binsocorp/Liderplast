'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function CatalogClient({ catalogItems, autoOpen }: { catalogItems: any[]; autoOpen?: boolean }) {
    return (
        <MasterCrud
            title="Catálogo"
            entityTable="catalog_items"
            data={catalogItems ?? []}
            autoOpen={autoOpen}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'sku', label: 'SKU' },
                {
                    key: 'type',
                    label: 'Tipo comercial',
                    render: (row) => <Badge status={row.type as string} />
                },
                {
                    key: 'inventory_type',
                    label: 'Categoría inventario',
                    render: (row) => row.inventory_type
                        ? <Badge status={row.inventory_type as string} />
                        : <span className="text-gray-300 text-xs">—</span>
                },
                {
                    key: 'sales_category',
                    label: 'Categoría venta',
                    render: (row) => row.sales_category
                        ? <Badge status={row.sales_category as string} />
                        : <span className="text-gray-300 text-xs">—</span>
                },
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
                    label: 'Tipo comercial',
                    type: 'select',
                    options: [
                        { value: 'PRODUCTO', label: 'Producto' },
                        { value: 'SERVICIO', label: 'Servicio' }
                    ],
                    defaultValue: 'PRODUCTO',
                    required: true
                },
                {
                    key: 'inventory_type',
                    label: 'Categoría de inventario',
                    type: 'select',
                    options: [
                        { value: '', label: 'No aplica' },
                        { value: 'MATERIA_PRIMA', label: 'Materia Prima' },
                        { value: 'INSUMO', label: 'Insumo' },
                        { value: 'PRODUCTO_FINAL', label: 'Producto Final' },
                    ],
                    placeholder: 'No aplica',
                },
                {
                    key: 'sales_category',
                    label: 'Categoría de venta',
                    type: 'select',
                    options: [
                        { value: '', label: 'No aplica' },
                        { value: 'CASCO', label: 'Casco' },
                        { value: 'ACCESORIO', label: 'Accesorio' },
                        { value: 'SERVICIO', label: 'Servicio' },
                    ],
                    placeholder: 'No aplica',
                },
                { key: 'description', label: 'Descripción Breve', type: 'textarea' },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
