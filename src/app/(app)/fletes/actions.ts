'use server';

import { createClient } from '@/lib/supabase/server';
import { tripSchema, type TripFormData } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function createTrip(formData: any) {
    const parsed = tripSchema.safeParse(formData);
    if (!parsed.success) return { error: parsed.error.errors[0].message };

    const supabase = await createClient();
    const { order_ids, ...tripData } = parsed.data;

    // 1. Validation: Check if any order is already in an active trip
    if (order_ids && order_ids.length > 0) {
        const { data: existingAssignments, error: checkError } = await supabase
            .from('trip_orders')
            .select('order_id, trips!inner(trip_code, status)')
            .in('order_id', order_ids)
            .in('trips.status', ['PLANIFICADO', 'EN_RUTA']);

        if (checkError) return { error: 'Error validando pedidos: ' + checkError.message };
        if (existingAssignments && existingAssignments.length > 0) {
            const first = existingAssignments[0];
            return { error: `El pedido ya está asignado al flete ${(first as any).trips.trip_code} (Estado: ${(first as any).trips.status})` };
        }
    }

    // 2. Insert Trip
    const { data: trip, error: tripError } = await (supabase
        .from('trips') as any)
        .insert(tripData)
        .select('id')
        .single();

    if (tripError) return { error: tripError.message };

    // 3. Insert Trip Orders
    if (order_ids && order_ids.length > 0) {
        const assignments = order_ids.map(orderId => ({
            trip_id: trip.id,
            order_id: orderId
        }));

        const { error: assignError } = await (supabase
            .from('trip_orders') as any)
            .insert(assignments);

        if (assignError) {
            // Rollback trip creation if assignment fails (optional, but good for consistency)
            await (supabase.from('trips') as any).delete().eq('id', (trip as any).id);
            return { error: 'Error vinculando pedidos: ' + assignError.message };
        }

        // Update order status removed
        // await (supabase.from('orders') as any).update({ status: 'VIAJE_ASIGNADO' }).in('id', order_ids);
    }

    revalidatePath('/fletes');
    return { data: trip };
}

export async function updateTrip(id: string, formData: Partial<TripFormData>) {
    const supabase = await createClient();
    const { error } = await (supabase.from('trips') as any).update(formData as any).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/fletes');
    return { success: true };
}

export async function deleteTrip(id: string) {
    const supabase = await createClient();
    const { error } = await (supabase.from('trips') as any).delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/fletes');
    return { success: true };
}
