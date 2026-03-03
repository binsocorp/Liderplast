const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const driversData = [
    { name: 'Kikin', phone: '', notes: 'Empresa: El Kino' },
    { name: 'Cristian', phone: '', notes: 'Empresa: Cristian' },
    { name: 'Cri Alexis', phone: '', notes: 'Empresa: Cristian' },
    { name: 'Cri Pelado', phone: '', notes: 'Empresa: Cristian' },
    { name: 'Cri German', phone: '', notes: 'Empresa: Cristian' },
    { name: 'Cri Francisco', phone: '', notes: 'Empresa: Cristian' },
    { name: 'Ki Fabio', phone: '', notes: 'Empresa: El Kino' },
    { name: 'Ki Ariel', phone: '', notes: 'Empresa: El Kino' },
    { name: 'Ki Cesar Rio Ce', phone: '', notes: 'Empresa: El Kino' },
    { name: 'Ki Mariano', phone: '', notes: 'Empresa: El Kino' },
    { name: 'Ki Carlos', phone: '', notes: 'Empresa: El Kino' },
    { name: 'Luciano', phone: '', notes: 'Empresa: N/A' },
    { name: 'Luis Filtro', phone: '', notes: 'Empresa: Cristian' }
];

async function seedDrivers() {
    console.log('Iniciando carga de fleteros...');

    for (const driver of driversData) {
        const { data, error } = await supabase
            .from('drivers')
            .insert([driver])
            .select();

        if (error) {
            console.error(`Error insertando a ${driver.name}:`, error.message);
        } else {
            console.log(`Fletero insertado correctamente: ${driver.name}`);
        }
    }

    console.log('Proceso de carga finalizado.');
}

seedDrivers();
