'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function SellersClient({ sellers }: { sellers: any[] }) {
    return (
        <MasterCrud
            title="Vendedores"
            entityTable="sellers"
            data={sellers ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Teléfono' },
                {
                    key: 'type',
                    label: 'Tipo',
                    render: (row) => <span className="text-sm font-medium">{row.type === 'INTERNO' ? 'Interno' : 'Externo'}</span>
                },
                {
                    key: 'is_active',
                    label: 'Estado',
                    render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'CANCELLED'} />
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre Completo', type: 'text', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Teléfono', type: 'text' },
                {
                    key: 'type',
                    label: 'Tipo',
                    type: 'select',
                    options: [
                        { value: 'INTERNO', label: 'Interno' },
                        { value: 'EXTERNO', label: 'Externo' }
                    ],
                    defaultValue: 'INTERNO',
                    required: true
                },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
