'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function ProvincesClient({ provinces }: { provinces: any[] }) {
    return (
        <MasterCrud
            title="Provincias"
            entityTable="provinces"
            data={provinces ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                {
                    key: 'is_sellable',
                    label: 'Vendible',
                    render: (row) => <Badge status={row.is_sellable ? 'ACTIVE' : 'CANCELLED'} />
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'is_sellable', label: 'Es Vendible', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
