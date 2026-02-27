import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';

export default async function VehiclesPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('vehicles')
        .select('*')
        .order('name', { ascending: true });

    const columns: any[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'capacity', label: 'Capacidad (Unidades)' },
        {
            key: 'is_active',
            label: 'Estado',
            renderType: 'boolean'
        },
    ];

    const fields: any[] = [
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'capacity', label: 'Capacidad (Unidades)', type: 'number', required: true, defaultValue: 1 },
        { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
    ];

    return (
        <MasterCrud
            title="Vehículos"
            entityTable="vehicles"
            columns={columns}
            fields={fields}
            data={data ?? []}
        />
    );
}
