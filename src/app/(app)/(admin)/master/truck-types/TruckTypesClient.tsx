'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function TruckTypesClient({ truckTypes }: { truckTypes: any[] }) {
    return (
        <MasterCrud
            title="Tipos de Camión"
            entityTable="truck_types"
            data={truckTypes ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'capacity', label: 'Capacidad (Ctd. Pedidos)' },
                {
                    key: 'is_active',
                    label: 'Estado',
                    render: (row) => (
                        <Badge status={row.is_active ? 'CONFIRMADO' : 'CANCELADO'} />
                    )
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre', type: 'text', required: true },
                { key: 'capacity', label: 'Capacidad (Piletas / Pedidos)', type: 'number', required: true, defaultValue: 1 },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
