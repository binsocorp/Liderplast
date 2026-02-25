'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function FletesClient({ trips }: { trips: any[] }) {
    return (
        <MasterCrud
            title="Fletes (Admin)"
            entityTable="trips"
            data={trips ?? []}
            columns={[
                { key: 'trip_code', label: 'Código' },
                { key: 'destination', label: 'Destino' },
                {
                    key: 'date',
                    label: 'Fecha',
                    render: (row) => row.date ? new Intl.DateTimeFormat('es-AR').format(new Date(row.date as string)) : '-'
                },
                {
                    key: 'status',
                    label: 'Estado',
                    render: (row) => <Badge status={row.status as string} />
                },
            ]}
            fields={[
                { key: 'destination', label: 'Destino', type: 'text', required: true },
                { key: 'date', label: 'Fecha (YYYY-MM-DD)', type: 'text' },
                {
                    key: 'status',
                    label: 'Estado',
                    type: 'select',
                    options: [
                        { value: 'PENDIENTE', label: 'Pendiente' },
                        { value: 'EN_CURSO', label: 'En Curso' },
                        { value: 'COMPLETADO', label: 'Completado' },
                        { value: 'CANCELADO', label: 'Cancelado' },
                    ],
                    defaultValue: 'PENDIENTE',
                    required: true
                },
                { key: 'description', label: 'Descripción', type: 'textarea' },
                { key: 'notes', label: 'Notas', type: 'textarea' },
            ]}
        />
    );
}
