import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import type { Installer } from '@/lib/types/database';

export default async function InstallersPage() {
    const supabase = await createClient();

    const { data: installers } = await supabase
        .from('installers')
        .select('*')
        .order('name');

    const columns: Column<Installer>[] = [
        {
            key: 'name',
            label: 'Nombre',
            render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
        },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'zone', label: 'Zona' },
        {
            key: 'is_active',
            label: 'Estado',
            render: (row) => (
                <Badge status={row.is_active ? 'ACTIVE' : 'CANCELLED'} />
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Instaladores"
                subtitle={`${installers?.length ?? 0} instalador${(installers?.length ?? 0) !== 1 ? 'es' : ''}`}
            />
            <DataTable
                columns={columns}
                data={installers ?? []}
                keyExtractor={(row) => row.id}
                emptyMessage="No hay instaladores registrados"
            />
        </>
    );
}
