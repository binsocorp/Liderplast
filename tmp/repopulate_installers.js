const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

const rawData = `erik		Santa Fe	
emma		Chaco, Corrientes, Entre Ríos, Santa Fe, Formosa	
ariel		Chaco, Corrientes, Entre Ríos, Formosa, Santa Fe	
angel mza		Mendoza	
jesus		San Juan	
angel sta fe		Santa Fe	
leonardo		Córdoba	
agustin 		La Pampa	
juan		Neuquén, Río Negro	
ciro		Salta, Jujuy	
arce		Formosa	
Juarez Javier		Tucumán/Sgo del Estero	3816423667
Gutiérrez Juan Manuel		La Rioja	3804768335
Machuca Leo		San Luis	2664387588
Ojeda Alexis		Chaco 	3644619176
Mercado Cristian		San Juan	2645757540
Echeverri Maximiliano		Bahia Blanca	2915226897
Fonseca Juan Pablo		Cipolletti	2995078050
Flaiman Raul		Corrientes	3834975227
Candia Carlos		La Pampa	2954321267
Milian Segundo		Mendoza	2615361763`;

function capitalize(str) {
    if (!str) return '';
    return str.split(/[\s-]+/).map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

async function repopulate() {
    try {
        // 1. Get in-use installers
        const resOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?installer_id=not.is.null&select=installer_id`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const ordersData = await resOrders.json();
        const inUseIds = new Set(ordersData.map(o => o.installer_id));

        // 2. Get all installers to see who to delete
        const resAll = await fetch(`${SUPABASE_URL}/rest/v1/installers?select=*`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const allInstallers = await resAll.json();
        const toDelete = allInstallers.filter(i => !inUseIds.has(i.id));

        if (toDelete.length > 0) {
            console.log(`Deleting ${toDelete.length} installers...`);
            const ids = toDelete.map(i => i.id);
            await fetch(`${SUPABASE_URL}/rest/v1/installers?id=in.(${ids.join(',')})`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            });
        }

        // 3. Prepare new installers
        const lines = rawData.split('\n');
        const toInsert = [];

        for (const line of lines) {
            const parts = line.split('\t').map(s => s.trim()).filter(s => s !== '');
            if (parts.length < 2) continue;

            const name = capitalize(parts[0]);
            const zone = parts[1]; // Zone has multiple provinces, I'll keep it as text
            const phone = parts[2] || '';

            toInsert.push({
                name,
                zone,
                phone,
                is_active: true
            });
        }

        console.log(`Inserting ${toInsert.length} installers...`);
        const resIns = await fetch(`${SUPABASE_URL}/rest/v1/installers`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(toInsert)
        });

        if (!resIns.ok) {
            console.error('Error inserting installers:', await resIns.text());
        } else {
            console.log('Successfully repopulated installers.');
        }

    } catch (e) {
        console.error(e);
    }
}

repopulate();
