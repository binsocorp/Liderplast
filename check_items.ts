import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: inv, error: err2 } = await supabase.from('inventory_items').select('*');
    console.log(inv.slice(0, 5));
}

check().catch(console.error);
