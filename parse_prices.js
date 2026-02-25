const fs = require('fs');

const data = `Buenos Aires	Catamarca	Chaco	Chubut	Ciudad Autónoma de Buenos Aires	Córdoba	Corrientes	Entre Ríos	Formosa	Jujuy	La Pampa	La Rioja	Misiones	Mendoza	Neuquén	Río Negro	Salta	San Juan	San Luis	Santa Fe	Santiago del Estero	Tucumán
P-715300	2364000	2957600	3258600	-841400	2677600	2957600	2657600	3207600	2658600	2757600	2658600	3458600	2857600	2607600	2607600	2658600	2857600	2857600	2657600	2658600	3058600
P-700300	2064000	2657600	2958600	-1141400	2377600	2657600	2357600	2907600	2358600	2457600	2358600	3158600	2557600	2307600	2307600	2358600	2557600	2557600	2357600	2358600	2758600
P-615300	2064000	2657600	2958600	-1141400	2377600	2657600	2357600	2907600	2358600	2457600	2358600	3158600	2557600	2307600	2307600	2358600	2557600	2557600	2357600	2358600	2758600
P-600300	1964000	2557600	2858600	-1241400	2277600	2557600	2257600	2807600	2258600	2357600	2258600	3058600	2457600	2207600	2207600	2258600	2457600	2457600	2257600	2258600	2658600
P-500315	1764000	2357600	2658600	-1441400	2077600	2357600	2057600	2607600	2058600	2157600	2058600	2858600	2257600	2007600	2007600	2058600	2257600	2257600	2057600	2058600	2458600
P-570270	1964000	2557600	2858600	-1241400	2277600	2557600	2257600	2807600	2258600	2357600	2258600	3058600	2457600	2207600	2207600	2258600	2457600	2457600	2257600	2258600	2658600
P-390230	1464000	2057600	2358600	-1741400	1777600	2057600	1757600	2307600	1758600	1857600	1758600	2558600	1957600	1707600	1707600	1758600	1957600	1957600	1757600	1758600	2158600
Flete	500000	500000	800000	0	500000	400000	500000	500000	500000	500000	500000	500000	500000	500000	500000	500000	500000	400000	500000	500000	0
Instalacion	1200000	700000	2100000	0	580000	700000	700000	700000	1200000	900000	1200000	1000000	800000	1500000	1500000	1200000	800000	800000	700000	1200000	800000`;

const rows = data.split('\n').map(r => r.split('\t').map(c => c.trim()));
const provincesNames = rows[0];

let sql = `-- ============================================================
-- LIDERPLAST — Seeds para Precios Base (Fase 10)
-- Ejecutar DESPUES de upgrade_phase10.sql
-- ============================================================

DO $$
DECLARE
  v_prov_id UUID;
  v_item_id UUID;
BEGIN

-- 1. Insertar Catálogo Fijo necesario para la cotización
`;

const items = [
    { name: 'P-715300', type: 'PRODUCTO' },
    { name: 'P-700300', type: 'PRODUCTO' },
    { name: 'P-615300', type: 'PRODUCTO' },
    { name: 'P-600300', type: 'PRODUCTO' },
    { name: 'P-500315', type: 'PRODUCTO' },
    { name: 'P-570270', type: 'PRODUCTO' },
    { name: 'P-390230', type: 'PRODUCTO' },
    { name: 'Flete Base', type: 'SERVICIO' },
    { name: 'Instalación Base', type: 'SERVICIO' },
    { name: 'Loseta Atérmica L', type: 'PRODUCTO', price: 4800 },
    { name: 'Loseta Atérmica R', type: 'PRODUCTO', price: 4400 },
    { name: 'Pastina (Kg)', type: 'PRODUCTO', price: 1800 },
    { name: 'Casilla', type: 'PRODUCTO', price: 120000 },
    { name: 'Kit Filtrado', type: 'PRODUCTO', price: 460000 },
    { name: 'Accesorios Instalación', type: 'PRODUCTO', price: 140000 },
    { name: 'Luces', type: 'PRODUCTO', price: 180000 },
    { name: 'Prev. Climatización', type: 'PRODUCTO', price: 180000 },
    { name: 'Prev. Cascada', type: 'PRODUCTO', price: 180000 },
    { name: 'Cascada', type: 'PRODUCTO', price: 80000 },
    { name: 'Kit Limpieza', type: 'PRODUCTO', price: 180000 },
];

for (const item of items) {
    sql += `INSERT INTO public.catalog_items (name, type, sku, description) VALUES ('${item.name}', '${item.type}', 'FIJO_UI', 'Item fijo de interfaz') ON CONFLICT DO NOTHING;\n`;
}

sql += `\n-- 2. Cargar Matriz de Precios Fijos y Dinámicos por Provincia\n`;

for (let i = 0; i < provincesNames.length; i++) {
    const provName = provincesNames[i];
    if (!provName) continue;

    sql += `\n-- Provincia: ${provName}\n`;
    sql += `SELECT id INTO v_prov_id FROM public.provinces WHERE name = '${provName}' LIMIT 1;\n`;
    sql += `IF FOUND THEN\n`;

    // Static priced items for all provinces based on user's table:
    for (const item of items) {
        if (item.price) {
            sql += `  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = '${item.name}' LIMIT 1;\n`;
            sql += `  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov_id, ${item.price}) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;\n`;
        }
    }

    // Dynamic priced items specific to province
    for (let r = 1; r < rows.length; r++) {
        const itemRowName = rows[r][0];
        let price = parseInt(rows[r][i]);
        if (isNaN(price) || price <= 0) continue; // Ignore 0 or negative

        // Map Flete and Instalacion to the catalog items
        let realName = itemRowName;
        if (itemRowName === 'Flete') realName = 'Flete Base';
        if (itemRowName === 'Instalacion') realName = 'Instalación Base';

        sql += `  SELECT id INTO v_item_id FROM public.catalog_items WHERE name = '${realName}' LIMIT 1;\n`;
        sql += `  INSERT INTO public.prices (catalog_item_id, province_id, unit_price_net) VALUES (v_item_id, v_prov_id, ${price}) ON CONFLICT (catalog_item_id, province_id) DO UPDATE SET unit_price_net = EXCLUDED.unit_price_net;\n`;
    }

    sql += `END IF;\n`;
}

sql += `\nEND $$;\n`;

fs.writeFileSync('c:/Users/juand/Documents/Binso 2025/Liderplast/App/db/seeds_prices.sql', sql);
console.log('SQL generated.');
