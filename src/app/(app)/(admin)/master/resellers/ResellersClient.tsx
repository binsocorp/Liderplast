'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function ResellersClient({ resellers }: { resellers: any[] }) {
    return (
        <MasterCrud
            title="Revendedores"
            entityTable="resellers"
            data={resellers ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'zone', label: 'Zona/Localidad' },
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
                { key: 'zone', label: 'Zona/Localidad', type: 'text' },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
