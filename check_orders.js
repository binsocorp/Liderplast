const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    const { data, count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log('Total orders in DB:', count);
    if (data.length > 0) {
        console.log('Sample order:', data[0]);
    } else {
        console.log('No orders found.');
    }
}

checkOrders();
