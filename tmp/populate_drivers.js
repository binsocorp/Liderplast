const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

const rawData = `kikin	el kino
cristian	cristian
cri alexis	cristian
cri pelado	cristian
cri german	cristian
cri francisco	cristian
ki fabio	el kino
ki ariel	el kino
ki cesar rio ce	el kino
ki cesar rio ce	el kino
ki mariano	el kino
ki carlos	el kino
luciano	N/A
luis filtro	cristian`;

function capitalize(str) {
    if (!str) return '';
    return str.split(/[\s-]+/).map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

async function populateDrivers() {
    try {
        console.log('Obteniendo fleteros existentes...');
        const resExisting = await fetch(`${SUPABASE_URL}/rest/v1/drivers?select=name`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const existingData = await resExisting.json();
        const existingNames = new Set(existingData.map(d => d.name.toLowerCase()));

        const lines = rawData.split('\n');
        const driversToInsert = [];
        const seenInList = new Set();

        for (const line of lines) {
            const parts = line.split('\t').map(s => s.trim()).filter(s => s !== '');
            if (parts.length < 1) continue;

            const pName = parts[0];
            const pCompany = parts[1] || '';

            const pNameCap = capitalize(pName);
            const pCompanyCap = capitalize(pCompany);

            let nameFinal = pNameCap;
            if (pCompanyCap && pCompanyCap !== 'N/A' && pCompanyCap.toLowerCase() !== pNameCap.toLowerCase()) {
                nameFinal += ` (${pCompanyCap})`;
            }

            const lowName = nameFinal.toLowerCase();
            if (seenInList.has(lowName)) continue;
            seenInList.add(lowName);

            if (!existingNames.has(lowName)) {
                driversToInsert.push({
                    name: nameFinal,
                    is_active: true
                });
            } else {
                console.log(`- Saltando: "${nameFinal}" (ya existe)`);
            }
        }

        if (driversToInsert.length === 0) {
            console.log('Todos los fleteros de la lista ya existen en la base de datos.');
            return;
        }

        console.log(`Preparados ${driversToInsert.length} nuevos fleteros para insertar.`);

        const res = await fetch(`${SUPABASE_URL}/rest/v1/drivers`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(driversToInsert)
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`Error insertando fleteros:`, err);
        } else {
            console.log(`Se insertaron ${driversToInsert.length} fleteros correctamente.`);
        }
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

populateDrivers();
