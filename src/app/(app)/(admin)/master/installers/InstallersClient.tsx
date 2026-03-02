'use client';

import { MasterCrud } from '../MasterCrud';
import { Badge } from '@/components/ui/Badge';

export function InstallersClient({ installers, provinces }: { installers: any[]; provinces: any[] }) {
    return (
        <MasterCrud
            title="Instaladores (Admin)"
            entityTable="installers"
            data={installers ?? []}
            columns={[
                { key: 'name', label: 'Nombre' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'email', label: 'Email' },
                { key: 'zone', label: 'Zona/Especialidad' },
                {
                    key: 'provinces',
                    label: 'Provincias',
                    render: (row) => {
                        if (!row.provinces || !Array.isArray(row.provinces)) return '-';
                        const provNames = row.provinces.map((id: string) => {
                            const p = provinces.find((prov) => prov.id === id);
                            return p ? p.name : id;
                        });
                        return provNames.join(', ');
                    }
                },
                {
                    key: 'is_active',
                    label: 'Estado',
                    render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'CANCELLED'} />
                },
            ]}
            fields={[
                { key: 'name', label: 'Nombre Completo', type: 'text', required: true },
                { key: 'phone', label: 'Teléfono', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'zone', label: 'Zona / Especialidad', type: 'text' },
                {
                    key: 'provinces',
                    label: 'Provincias',
                    type: 'multiselect',
                    options: provinces.map((p) => ({ value: p.id, label: p.name }))
                },
                { key: 'notes', label: 'Notas', type: 'textarea' },
                { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
            ]}
        />
    );
}
