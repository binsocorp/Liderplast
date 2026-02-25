'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function ClientsClient({ clients, provinces }: { clients: any[], provinces: any[] }) {
    const provinceOptions = provinces?.map(p => ({ value: p.id, label: p.name })) ?? [];

    return (
        <MasterCrud
            title="Clientes"
            entityTable="clients"
            data={clients ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Teléfono' },
                {
                    key: 'province',
                    label: 'Provincia',
                    render: (row) => (row.province as { name: string })?.name || '-'
                },
                {
                    key: 'is_active',
                    label: 'Estado',
                    render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'CANCELLED'} />
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre / Razón Social', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Teléfono', type: 'text' },
                { key: 'address', label: 'Dirección', type: 'text' },
                { key: 'city', label: 'Localidad', type: 'text' },
                { key: 'province_id', label: 'Provincia', type: 'select', options: provinceOptions },
                { key: 'fiscal_id', label: 'CUIT / DNI', type: 'text' },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
