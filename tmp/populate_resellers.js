const SUPABASE_URL = 'http://liderplast-web-supabase-0c8b0c-187-77-59-136.traefik.me';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIwNDU3OTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.yBiwhe8UhzILpXfc6EJrHp6vTmiYs8cSVfdavLsO2fQ';

const rawData = `agustina frias	del sur		2644159296		capital	san juan
alfredo	sin marca		2995365986		san patricio del chañar	Neuquén
ana laura	sin marca		3704882007		capital 	formosa
angel gabriel	instalador		2664853562		capital	san luis
antonio	industria bombazo		3815109238		capital	Tucumán
arce	instalador		3704011724		capital 	formosa
ariel 	instalador		3483440081		capital	Santa Fe, Chaco, Corrientes, Formosa
ariel	instalador		3872262622		capital	salta
bernardo	instalador		3513445418		capital	cordoba
betina	sin marca		2954660811		santa rosa	la pampa
cande	monaco		3513573398		capital 	cordoba
carlos 	del sur		2645707640		capital	san juan
carlos 	sin marca		2914620500		bahia blanca	buenos aires
ciro	sin  marca		3874848707		capital	salta
cristian 	sin marca		3517625040		yacanto	cordoba
cristian instalador	instalador		3483528004		capital	norte sta fe
damian 	sin marca		2664255417		merlo	san luis
damian crespo	sin marca		2392609079		trenque lauquen	buenos aires
daniel 	mundo piscinas		2664867246		capital	san luis
daniel y misa	mundo piscinas		2664610610		capital	san luis
dario gomez	sin marca		3498430991		capital	santa fe 
david ro	sierras azul		3518152387		capital	cordoba
eduardo	hidrozen		3874405274		capital	salta
eduardo rach	sin instalacion		2954865062		santa rosa	la pampa
emma 	instalador		3483639848		capital 	sta fe,chaco, corrienes y formosa
emmanuel	piscinas multimarca		3816317378		yerba buena	tucuman
enzo	ambar		3513905450		capital 	cordoba
fabricio 	sin nombre		3582409430		sampacho	cordoba
felix	piletas oliva		3532418795		manfredi	cordoba
fer vilma	sin marca		3544418541		villa dolores	cordoba
fernando flores	af piscinas		2645401824		capital	san juan
fernandoo	cloran		3878446331		capital	salta
franco re	ac piscinas		3584376545		laboulaye	cordoba
francoo	aconcagua		2612317733		guaymayen	mendoza
gaston marquez	paradice piscinas		3537448490		villa maria 	cordoba
gaston monge	sin marca		3513189843		capital	cordoba
german	piscinas bienesraices		3777662320		esquina	corrientes
jesus	sin marca		2644805336		capital	san juan
joel 	constructora		3516137816		capital	cordoba
jorge kloster	sin nombre		2954671703		santa rosa	la pampa
jose	futurax		3541219844		siquiman	cordoba
jose	sin marca		3704553225		capital	formosa
juan 	ocean pool		2995184289		plottier	neuquen
juan 	urban		3624566619		resistencia	chaco
juan	sin marca		3834411542		capital	catamarca
juan piscinas	sin marca		2396583921		pehuajo	buenos aires
juliana 	sin marca		3624172931		capital	formosa
kevin esmoris	sin marca		3446634862		gualeguaychu	entre rios
lucas zavarela	sin nombre		3518191963		capital	cordoba
lucass	sin marca		2664390350		capital	san luis
luis 	sin marca		3541665945		carlos paz	cordoba
majo	aquafenix		3512106025		capital	cordoba
marcelo acosta	sin marca		3704383172		capital	formosa
mariel 	piletas cordoba		3516425474		capital	cordoba
nahuel cuestas	quintas piscinas		3513860769		capital	cordoba
nico espinoza	laboulaye		3385447177		laboulaye 	cordoba
nico hijo	porto		3517179579		capital	cordoba
omar 	instalador		2615080648		capital	mendoza
piletas cañada	piletas dos soles		3471319662		cañada de gomez 	santa fe 
raul	sin marca		3875777465		capital	salta
ricardo quintana	sin marca		3777695423		esquina	corrientes
rocio	sin marca		2996299876		plottier	neuquen
sebastian	sin nombre		3404530223		arocena	santa fe 
sergio 	piscinas paula		2995471695		barda del medio	neuquen
sergio cides	instalador		2994194958		barda del medio	neuquen
Sofia	sin marca		3416807007		Funes	santa fe 
Tizi	Swim Pool		3518588062		capital 	cordoba
tomate	sin marca		3513239694		capital	cordoba
veronica leal	la piscine		2657647313		villa mercedes	san luis
victor raul 	instalador		3885821045		san salvador	jujuy`;

function capitalize(str) {
    if (!str) return '';
    return str.split(/[\s-]+/).map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

async function populate() {
    try {
        const resProvinces = await fetch(`${SUPABASE_URL}/rest/v1/provinces?select=id,name`, {
            headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
        });
        const provinces = await resProvinces.json();

        const lines = rawData.split('\n');
        const resellers = [];

        for (const line of lines) {
            const parts = line.split(/\t+| {2,}/).map(s => s.trim()).filter(s => s !== '');
            if (parts.length < 4) {
                console.log('Skipping line (too few parts):', line);
                continue;
            }

            let pName, pBrand, pPhone, pCity, pProv;

            if (parts.length >= 5) {
                [pName, pBrand, pPhone, pCity, pProv] = parts;
            } else {
                // Brand might be missing
                [pName, pPhone, pCity, pProv] = parts;
                pBrand = '';
            }

            // Normalize Province
            let provName = pProv.trim();
            provName = provName.split(',')[0].split(' y ')[0].replace(/norte /i, '').trim();

            const province = provinces.find(p => p.name.toLowerCase() === provName.toLowerCase())
                || provinces.find(p => p.name.toLowerCase().includes(provName.toLowerCase()));

            const isUselessBrand = (b) => {
                const low = b.toLowerCase();
                return low.includes('sin marca') || low.includes('sin nombre') || low.includes('instalador') || low.includes('sin instalacion');
            };

            const nameFinal = capitalize(pName) + (pBrand && !isUselessBrand(pBrand) ? ` (${capitalize(pBrand)})` : '');

            resellers.push({
                name: nameFinal,
                phone: pPhone.trim(),
                contact: capitalize(pCity.trim()), // Using contact for city/zone because 'zone' is missing in table rest api
                province_id: province ? province.id : null,
                is_active: true
            });
        }

        console.log(`Prepared ${resellers.length} resellers`);

        // Split into chunks of 10 to be safe
        for (let i = 0; i < resellers.length; i += 10) {
            const chunk = resellers.slice(i, i + 10);
            const res = await fetch(`${SUPABASE_URL}/rest/v1/resellers`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(chunk)
            });
            if (!res.ok) {
                const err = await res.text();
                console.error(`Error inserting chunk ${i / 10}:`, err);
            } else {
                console.log(`Inserted chunk ${i / 10} (${chunk.length} items)`);
            }
        }
        console.log('Population script finished.');
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

populate();
