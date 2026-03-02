'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function assignOrderToTrip(orderId: string, tripId: string) {
    const supabase = await createClient();

    // 1. Validation: Check if already assigned to an active trip
    const { data: existing, error: checkError } = await (supabase
        .from('trip_orders') as any)
        .select('trips!inner(trip_code, status)')
        .eq('order_id', orderId)
        .in('trips.status', ['PLANIFICADO', 'EN_RUTA']);

    if (checkError) return { error: checkError.message };
    if (existing && existing.length > 0) {
        const first = existing[0];
        return { error: `Este pedido ya está asignado al flete ${(first as any).trips.trip_code} (${(first as any).trips.status})` };
    }

    // 2. Assign
    const { error: assignError } = await (supabase
        .from('trip_orders') as any)
        .insert({ trip_id: tripId, order_id: orderId });

    if (assignError) return { error: assignError.message };

    // 3. Sync: Update orders table trip_id column
    await (supabase.from('orders') as any).update({ trip_id: tripId }).eq('id', orderId);

    revalidatePath(`/fletes/${tripId}`);
    revalidatePath(`/fletes`);
    return { success: true };
}

export async function removeOrderFromTrip(orderId: string, tripId: string) {
    const supabase = await createClient();

    // 1. Remove bridge entry
    const { error: deleteError } = await (supabase
        .from('trip_orders') as any)
        .delete()
        .eq('order_id', orderId)
        .eq('trip_id', tripId);

    if (deleteError) return { error: deleteError.message };

    // 2. Sync: Remove trip_id from orders table
    await (supabase.from('orders') as any).update({ trip_id: null }).eq('id', orderId);

    revalidatePath(`/fletes/${tripId}`);
    revalidatePath(`/fletes`);
    return { success: true };
}

export async function updateTripStatus(tripId: string, status: string) {
    const supabase = await createClient();
    const { error } = await (supabase
        .from('trips') as any)
        .update({ status })
        .eq('id', tripId);

    if (error) return { error: error.message };

    revalidatePath(`/fletes/${tripId}`);
    revalidatePath(`/fletes`);
    return { success: true };
}
