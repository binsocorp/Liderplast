import { createClient } from '@/lib/supabase/server';
import { TruckTypesClient } from './TruckTypesClient';

export default async function AdminTruckTypesPage() {
    const supabase = await createClient();
    const { data: truckTypes } = await supabase.from('truck_types').select('*').order('name', { ascending: true });

    return <TruckTypesClient truckTypes={truckTypes ?? []} />;
}
