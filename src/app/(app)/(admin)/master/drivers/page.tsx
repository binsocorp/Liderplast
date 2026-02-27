import { createClient } from '@/lib/supabase/server';
import { MasterCrud } from '../MasterCrud';

export default async function DriversPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true });

    const columns: any[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'phone', label: 'Teléfono' },
        {
            key: 'is_active',
            label: 'Estado',
            renderType: 'boolean'
        },
    ];

    const fields: any[] = [
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'phone', label: 'Teléfono', type: 'text' },
        { key: 'is_active', label: 'Activo', type: 'checkbox', defaultValue: true },
    ];

    return (
        <MasterCrud
            title="Fleteros"
            entityTable="drivers"
            columns={columns}
            fields={fields}
            data={data ?? []}
        />
    );
}
