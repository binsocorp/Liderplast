import { createClient } from '@/lib/supabase/server';
import { SuppliersClient } from './SuppliersClient';

export default async function SuppliersPage() {
    const supabase = await createClient();
    const { data: suppliers } = await supabase.from('suppliers').select('*').order('name');

    return <SuppliersClient suppliers={suppliers ?? []} />;
}
