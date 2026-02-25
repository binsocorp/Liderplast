'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function assignOrderToTrip(orderId: string, tripId: string) {
    const supabase = await createClient();

    // Optionally check capacity again here if we want to be safe server-side,
    // but the UI check is already providing guidance. We assume the user is authorized.

    // Assign trip_id and change status to VIAJE_ASIGNADO
    const { error } = await supabase
        .from('orders')
        .update({
            trip_id: tripId,
            status: 'VIAJE_ASIGNADO'
        })
        .eq('id', orderId);

    if (error) return { error: error.message };

    revalidatePath(`/fletes/${tripId}`);
    return { success: true };
}

export async function removeOrderFromTrip(orderId: string) {
    const supabase = await createClient();

    // Fetch the trip_id first to revalidate correctly
    const { data: order } = await supabase
        .from('orders')
        .select('trip_id')
        .eq('id', orderId)
        .single();

    // Remove trip_id and set status back to PRODUCIDO
    // (Assuming they only assign shipped/produced items)
    const { error } = await supabase
        .from('orders')
        .update({
            trip_id: null,
            status: 'PRODUCIDO'
        })
        .eq('id', orderId);

    if (error) return { error: error.message };

    if (order?.trip_id) {
        revalidatePath(`/fletes/${order.trip_id}`);
    }
    return { success: true };
}

export async function updateTripStatus(tripId: string, status: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('trips')
        .update({ status })
        .eq('id', tripId);

    if (error) return { error: error.message };

    revalidatePath(`/fletes/${tripId}`);
    revalidatePath(`/fletes`);
    return { success: true };
}
