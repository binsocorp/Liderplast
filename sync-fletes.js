const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function sync() {
    console.log('Starting freight synchronization (Fetch API)...');

    try {
        // 1. Get assignments
        const res = await fetch(`${SUPABASE_URL}/rest/v1/trip_orders?select=trip_id,order_id`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch assignments');
        const assignments = await res.json();
        console.log(`Found ${assignments.length} assignments.`);

        // 2. Update orders
        for (const assignment of assignments) {
            const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${assignment.order_id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ trip_id: assignment.trip_id })
            });

            if (!updateRes.ok) {
                console.error(`Error updating order ${assignment.order_id}`);
            } else {
                console.log(`Synced order ${assignment.order_id} with trip ${assignment.trip_id}`);
            }
        }

        console.log('Synchronization complete.');
    } catch (err) {
        console.error('Sync failed:', err);
    }
}

sync();
