const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function getData() {
    try {
        const [resProvinces, resItems] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/provinces?select=id,name`, {
                headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/catalog_items?select=id,name,sku`, {
                headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            })
        ]);

        const provinces = await resProvinces.json();
        const items = await resItems.json();

        console.log('Provinces:', JSON.stringify(provinces, null, 2));
        console.log('Catalog Items:', JSON.stringify(items, null, 2));
    } catch (e) {
        console.error(e);
    }
}

getData();
