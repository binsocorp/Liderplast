const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function checkDetails() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/resellers?select=*&limit=1`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const data = await res.json();
        console.log('Resellers Columns:', Object.keys(data[0] || {}));

        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/installers?select=*&limit=1`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const data2 = await res2.json();
        console.log('Installers Columns:', Object.keys(data2[0] || {}));

        const res3 = await fetch(`${SUPABASE_URL}/rest/v1/provinces?select=id,name`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const provinces = await res3.json();
        console.log('Provinces:', JSON.stringify(provinces));
    } catch (e) {
        console.error(e);
    }
}

checkDetails();
