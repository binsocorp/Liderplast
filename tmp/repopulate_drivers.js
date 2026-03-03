const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

async function cleanupAndPopulate() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/drivers?select=*`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const drivers = await res.json();
        const driversToDelete = drivers.filter(d => d.name !== 'Julio');

        if (driversToDelete.length > 0) {
            const ids = driversToDelete.map(d => d.id);
            await fetch(`${SUPABASE_URL}/rest/v1/drivers?id=in.(${ids.join(',')})`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            });
        }

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

        const lines = rawData.split('\n');
        const driversToInsert = [];
        const seen = new Set();

        for (const line of lines) {
            const parts = line.split('\t').map(s => s.trim()).filter(s => s !== '');
            if (parts.length < 1) continue;

            const pName = parts[0];
            let pCompany = parts[1] || '';

            const pNameCap = capitalize(pName);
            const pCompanyCap = capitalize(pCompany);

            let nameFinal = pNameCap;
            if (pCompany && pCompany.trim().toUpperCase() !== 'N/A' && pCompanyCap.toLowerCase() !== pNameCap.toLowerCase()) {
                nameFinal += ` (${pCompanyCap})`;
            }

            if (seen.has(nameFinal)) continue;
            seen.add(nameFinal);

            driversToInsert.push({ name: nameFinal, is_active: true });
        }

        await fetch(`${SUPABASE_URL}/rest/v1/drivers`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(driversToInsert)
        });
        console.log('Successfully repopulated drivers with fixed N/A logic.');
    } catch (e) {
        console.error(e);
    }
}

cleanupAndPopulate();
