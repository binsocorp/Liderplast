const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function checkDrivers() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/drivers?select=*&limit=1`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const data = await res.json();
        console.log('Drivers Columns:', Object.keys(data[0] || {}));
    } catch (e) {
        console.error(e);
    }
}

checkDrivers();
