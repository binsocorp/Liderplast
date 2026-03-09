import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: bom, error: err1 } = await supabase.from('bom_items').select('*');
    const { data: inv, error: err2 } = await supabase.from('inventory_items').select('id, name, type');

    console.log('--- BOM ITEMS ---');
    console.log(bom?.length ? `Found ${bom.length} items.` : 'No BOM items found.');
    if (bom?.length) console.log(bom.slice(0, 3));

    console.log('--- INVENTORY ITEMS ---');
    console.log(inv?.length ? `Found ${inv.length} items.` : 'No Inventory items found.');
    if (inv?.length) console.log(inv.slice(0, 3));
}

check().catch(console.error);
