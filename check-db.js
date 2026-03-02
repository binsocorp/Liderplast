const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function check() {
    console.log('--- DEBUG: Checking database state ---');

    try {
        // 1. Get all orders
        const ordersRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id,order_number,trip_id`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const orders = await ordersRes.json();
        console.log('Orders in DB:', JSON.stringify(orders, null, 2));

        // 2. Get all trip_orders
        const bridgeRes = await fetch(`${SUPABASE_URL}/rest/v1/trip_orders?select=trip_id,order_id`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const assignments = await bridgeRes.json();
        console.log('Assignments in bridge table:', JSON.stringify(assignments, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
