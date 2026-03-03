const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

const rawData = `Catamarca	Chaco	Chubut	Córdoba	Corrientes	Entre Ríos	Formosa	Jujuy	La Pampa	La Rioja	Misiones	Mendoza	Neuquén	Río Negro	Salta	San Juan	San Luis	Santa Fe	Santiago del Estero	Tucumán
P-715300	2364000.00	2957600.00	3258600.00	2677600.00	2957600.00	2657600.00	3207600.00	2658600.00	2757600.00	2658600.00	3458600.00	2857600.00	2607600.00	2607600.00	2658600.00	2857600.00	2857600.00	2657600.00	2658600.00	3058600.00
P-700300	2064000.00	2657600.00	2958600.00	2377600.00	2657600.00	2357600.00	2907600.00	2358600.00	2457600.00	2358600.00	3158600.00	2557600.00	2307600.00	2307600.00	2358600.00	2557600.00	2557600.00	2357600.00	2358600.00	2758600.00
P-615300	2064000.00	2657600.00	2958600.00	2377600.00	2657600.00	2357600.00	2907600.00	2358600.00	2457600.00	2358600.00	3158600.00	2557600.00	2307600.00	2307600.00	2358600.00	2557600.00	2557600.00	2357600.00	2358600.00	2758600.00
P-600300	1964000.00	2557600.00	2858600.00	2277600.00	2557600.00	2257600.00	2807600.00	2258600.00	2357600.00	2258600.00	3058600.00	2457600.00	2207600.00	2207600.00	2258600.00	2457600.00	2457600.00	2257600.00	2258600.00	2658600.00
P-500315	1764000.00	2357600.00	2658600.00	2077600.00	2357600.00	2057600.00	2607600.00	2058600.00	2157600.00	2058600.00	2858600.00	2257600.00	2007600.00	2007600.00	2058600.00	2257600.00	2257600.00	2057600.00	2058600.00	2458600.00
P-570270	1964000.00	2557600.00	2858600.00	2277600.00	2557600.00	2257600.00	2807600.00	2258600.00	2357600.00	2258600.00	3058600.00	2457600.00	2207600.00	2207600.00	2258600.00	2457600.00	2457600.00	2257600.00	2258600.00	2658600.00
P-390230	1464000.00	2057600.00	2358600.00	1777600.00	2057600.00	1757600.00	2307600.00	1758600.00	1857600.00	1758600.00	2558600.00	1957600.00	1707600.00	1707600.00	1758600.00	1957600.00	1957600.00	1757600.00	1758600.00	2158600.00
Losetas L	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00	4800.00
Losetas R	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00	4400.00
Pastina (Kg)	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00	1800.00
Casilla	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00	120000.00
Kit Filtrado	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00	460000.00
Accesorios Instalación	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00	140000.00
Luces	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00
Prev. Clima.	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00
Prev. Cascada	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00
Cascada	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00	80000.00
Kit Limpieza	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00	180000.00
Flete	500000.00	500000.00	800000.00	0.00	500000.00	400000.00	500000.00	500000.00	500000.00	500000.00	500000.00	500000.00	500000.00	500000.00	500000.00	500000.00	500000.00	400000.00	500000.00	500000.00
Instalacion	1200000.00	700000.00	2100000.00	580000.00	700000.00	700000.00	700000.00	1200000.00	900000.00	1200000.00	1000000.00	800000.00	1500000.00	1500000.00	1200000.00	800000.00	800000.00	700000.00	1200000.00	800000.00`;

async function upsertPrices() {
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

        const lines = rawData.split('\n');
        const provinceNames = lines[0].split('\t').map(s => s.trim());
        const provinceIds = provinceNames.map(name => {
            const p = provinces.find(prov => prov.name.toLowerCase() === name.toLowerCase());
            return p ? p.id : null;
        });

        const itemMapping = {
            'P-715300': 'P-715300',
            'P-700300': 'P-700300',
            'P-615300': 'P-615300',
            'P-600300': 'P-600300',
            'P-500315': 'P-500315',
            'P-570270': 'P-570270',
            'P-390230': 'P-390230',
            'Losetas L': 'Loseta Atérmica L',
            'Losetas R': 'Loseta Atérmica R',
            'Pastina (Kg)': 'Pastina (Kg)',
            'Casilla': 'Casilla',
            'Kit Filtrado': 'Kit Filtrado',
            'Accesorios Instalación': 'Accesorios Instalación',
            'Luces': 'Luces',
            'Prev. Clima.': 'Prev. Climatización',
            'Prev. Cascada': 'Prev. Cascada',
            'Cascada': 'Cascada',
            'Kit Limpieza': 'Kit Limpieza',
            'Flete': 'Flete Base',
            'Instalacion': 'Instalación Base'
        };

        const pricesToUpsert = [];

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split('\t').map(s => s.trim());
            const itemName = parts[0];
            const mappedName = itemMapping[itemName];
            if (!mappedName) {
                console.log(`Skipping item: ${itemName}`);
                continue;
            }

            const catalogItem = items.find(it => it.name === mappedName);
            if (!catalogItem) {
                console.log(`Catalog item not found: ${mappedName}`);
                continue;
            }

            for (let j = 0; j < provinceIds.length; j++) {
                if (!provinceIds[j]) continue;
                const priceValue = parseFloat(parts[j + 1]);
                if (isNaN(priceValue)) continue;

                pricesToUpsert.push({
                    catalog_item_id: catalogItem.id,
                    province_id: provinceIds[j],
                    unit_price_net: priceValue,
                    is_active: true
                });
            }
        }

        console.log(`Prepared ${pricesToUpsert.length} prices to upsert.`);

        // Split into chunks of 100
        for (let i = 0; i < pricesToUpsert.length; i += 100) {
            const chunk = pricesToUpsert.slice(i, i + 100);
            const res = await fetch(`${SUPABASE_URL}/rest/v1/prices?on_conflict=catalog_item_id,province_id`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(chunk)
            });

            if (!res.ok) {
                console.error(`Error in chunk ${i / 100}:`, await res.text());
            } else {
                console.log(`Chunk ${i / 100} upserted successfully.`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

upsertPrices();
