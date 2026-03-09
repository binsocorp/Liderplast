import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const bomData = [
    { p: "P-715300", c: "Catalizador", q: 1 },
    { p: "P-715300", c: "Resina", q: 128 },
    { p: "P-715300", c: "Gel Coat", q: 35 },
    { p: "P-715300", c: "Fibra mecha", q: 120 },
    { p: "P-715300", c: "Pigmento Celeste", q: 2 },
    { p: "P-700300", c: "Catalizador", q: 1 },
    { p: "P-700300", c: "Resina", q: 126 },
    { p: "P-700300", c: "Gel Coat", q: 33 },
    { p: "P-700300", c: "Fibra mecha", q: 120 },
    { p: "P-700300", c: "Pigmento Celeste", q: 2 },
    { p: "P-615300", c: "Catalizador", q: 1 },
    { p: "P-615300", c: "Resina", q: 105 },
    { p: "P-615300", c: "Gel Coat", q: 30 },
    { p: "P-615300", c: "Fibra mecha", q: 100 },
    { p: "P-615300", c: "Pigmento Celeste", q: 1.5 },
    { p: "P-600300", c: "Catalizador", q: 1 },
    { p: "P-600300", c: "Resina", q: 108 },
    { p: "P-600300", c: "Gel Coat", q: 32 },
    { p: "P-600300", c: "Fibra mecha", q: 100 },
    { p: "P-600300", c: "Pigmento Celeste", q: 1.5 },
    { p: "P-500315", c: "Catalizador", q: 1 },
    { p: "P-500315", c: "Resina", q: 103 },
    { p: "P-500315", c: "Gel Coat", q: 28 },
    { p: "P-500315", c: "Fibra mecha", q: 100 },
    { p: "P-500315", c: "Pigmento Celeste", q: 1 },
    { p: "P-570270", c: "Catalizador", q: 1 },
    { p: "P-570270", c: "Resina", q: 100 },
    { p: "P-570270", c: "Gel Coat", q: 25 },
    { p: "P-570270", c: "Fibra mecha", q: 90 },
    { p: "P-570270", c: "Pigmento Celeste", q: 1 },
    { p: "P-390230", c: "Catalizador", q: 1 },
    { p: "P-390230", c: "Resina", q: 69 },
    { p: "P-390230", c: "Gel Coat", q: 15 },
    { p: "P-390230", c: "Fibra mecha", q: 80 },
    { p: "P-390230", c: "Pigmento Celeste", q: 0.75 },
    { p: "M-Minipiscina", c: "Catalizador", q: 1 },
    { p: "M-Minipiscina", c: "Resina", q: 100 },
    { p: "M-Minipiscina", c: "Gel Coat", q: 25 },
    { p: "M-Minipiscina", c: "Fibra mecha", q: 20 },
    { p: "M-Minipiscina", c: "Fibra manta", q: 3.5 },
    { p: "Loseta L", c: "Cemento blanco", q: 54 },
    { p: "Loseta L", c: "Marmolina", q: 120 },
    { p: "Loseta L", c: "Piedra", q: 30 },
    { p: "Loseta S", c: "Cemento blanco", q: 54 },
    { p: "Loseta S", c: "Marmolina", q: 120 },
    { p: "Loseta S", c: "Piedra", q: 30 },
    { p: "Casilla", c: "Resina", q: 9 },
    { p: "Casilla", c: "Gel Coat", q: 1.875 },
    { p: "Casilla", c: "Fibra mecha", q: 1.25 }
];

async function main() {
    const products = Array.from(new Set(bomData.map(d => d.p)));
    const components = Array.from(new Set(bomData.map(d => d.c)));

    const itemsMap = new Map();

    // Handle Products
    for (const name of products) {
        let { data, error } = await supabase.from('inventory_items').select('*').eq('name', name).maybeSingle();
        if (!data) {
            console.log(`Creating product: ${name}`);
            const { data: inserted, error: err } = await supabase.from('inventory_items').insert({
                name,
                type: 'PRODUCTO_FINAL',
                unit: 'un'
            }).select().single();
            if (err) console.error('Error inserting product', err);
            else data = inserted;
        }
        itemsMap.set(name, data.id);
    }

    // Handle Components
    for (const name of components) {
        let { data, error } = await supabase.from('inventory_items').select('*').eq('name', name).maybeSingle();
        if (!data) {
            console.log(`Creating component: ${name}`);
            const { data: inserted, error: err } = await supabase.from('inventory_items').insert({
                name,
                type: 'MATERIA_PRIMA',
                unit: 'kg'
            }).select().single();
            if (err) console.error('Error inserting component', err);
            else data = inserted;
        }
        itemsMap.set(name, data.id);
    }

    // Insert BOM
    for (const d of bomData) {
        const productId = itemsMap.get(d.p);
        const materialId = itemsMap.get(d.c);

        if (!productId || !materialId) {
            console.error(`Missing id for ${d.p} or ${d.c}`);
            continue;
        }

        const { error } = await supabase.from('bom_items').upsert(
            { product_id: productId, material_id: materialId, quantity_per_unit: d.q },
            { onConflict: 'product_id,material_id' }
        );
        if (error) {
            console.error(`Error upserting BOM for ${d.p} -> ${d.c}:`, error);
        } else {
            console.log(`Inserted BOM: ${d.p} -> ${d.c} (${d.q})`);
        }
    }

    console.log('BOM import finished.');
}

main().catch(console.error);
