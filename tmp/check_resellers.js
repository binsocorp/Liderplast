const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function checkColumns() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/resellers?select=*&limit=1`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'count=exact'
            }
        });
        const data = await res.json();
        console.log('Columns in resellers:', Object.keys(data[0] || {}));

        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/provinces?select=id,name`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        const provinces = await res2.json();
        console.log('Provinces:', JSON.stringify(provinces));
    } catch (e) {
        console.error(e);
    }
}

checkColumns();
