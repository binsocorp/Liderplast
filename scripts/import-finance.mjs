/**
 * Importación masiva de ingresos y egresos desde Excel (via JSON pre-exportado).
 *
 * Uso:
 *   node scripts/import-finance.mjs           → importa todo
 *   node scripts/import-finance.mjs --dry-run → solo muestra warnings, no inserta nada
 *
 * SIN dependencias externas — solo usa @supabase/supabase-js (ya instalado).
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const JSON_PATH = 'C:\\Users\\juand\\excel_data.json';

// ── Helpers ──────────────────────────────────────────────────────────────────

function readEnvLocal() {
    const envPath = join(__dirname, '..', '.env.local');
    const env = {};
    try {
        for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            env[key] = val;
        }
    } catch {
        console.error('❌ No se encontró .env.local');
        process.exit(1);
    }
    return env;
}

// "-46.200,00" o "800.000,00" → número positivo
function parseMonto(raw) {
    if (!raw) return 0;
    const str = String(raw)
        .replace(/\./g, '')    // quita separador de miles
        .replace(',', '.')     // coma decimal → punto
        .replace(/[^0-9.]/g, ''); // quita todo lo demás (signo negativo, etc.)
    return Math.abs(parseFloat(str) || 0);
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    if (DRY_RUN) console.log('🔍 DRY RUN — no se insertará nada\n');

    // ── Env + Supabase ────────────────────────────────────────────────────
    const env = readEnvLocal();
    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
    const serviceKey  = env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !serviceKey) {
        console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
    });

    // ── User ID ───────────────────────────────────────────────────────────
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1 });
    const userId = usersData?.users?.[0]?.id ?? null;
    console.log(`👤 Usuario: ${usersData?.users?.[0]?.email ?? '?'} (${userId})\n`);

    // ── Leer JSON exportado del Excel ─────────────────────────────────────
    let rawRows;
    try {
        rawRows = JSON.parse(readFileSync(JSON_PATH, 'utf-8').replace(/^﻿/, ''));
    } catch (e) {
        console.error(`❌ No se pudo leer ${JSON_PATH}: ${e.message}`);
        process.exit(1);
    }
    console.log(`📊 Filas en JSON: ${rawRows.length}`);

    // ── Lookup tables ─────────────────────────────────────────────────────
    const { data: categories,    error: catErr } = await supabase.from('finance_categories').select('id, name');
    const { data: paymentMethods,error: pmErr  } = await supabase.from('finance_payment_methods').select('id, name');

    if (catErr || pmErr) {
        console.error('❌ Error leyendo tablas de lookup:', catErr?.message ?? pmErr?.message);
        process.exit(1);
    }

    const catMap     = new Map((categories    ?? []).map(c => [c.name.toLowerCase().trim(), c.id]));
    const pmMap      = new Map((paymentMethods ?? []).map(p => [p.name.toLowerCase().trim(), p.id]));
    const otrosCatId = catMap.get('otros') ?? null;

    console.log(`   Categorías en DB:     ${catMap.size}`);
    console.log(`   Medios de pago en DB: ${pmMap.size}\n`);

    // ── Parsear filas ─────────────────────────────────────────────────────
    const incomes  = [];
    const expenses = [];
    const unmappedCats = new Set();
    const unmappedPMs  = new Set();
    let skipped = 0;

    for (const row of rawRows) {
        const fecha  = String(row.fecha  ?? '').trim();
        const tipo   = String(row.tipo   ?? '').trim().toUpperCase();
        const desc   = String(row.desc   ?? '').trim();
        const cat    = String(row.cat    ?? '').trim();
        const medio  = String(row.medio  ?? '').trim();
        const monto  = parseMonto(row.monto);

        if (!fecha || monto === 0) { skipped++; continue; }

        const pmId  = medio ? (pmMap.get(medio.toLowerCase()) ?? null) : null;
        if (medio && !pmId) unmappedPMs.add(medio);

        if (tipo === 'INGRESO') {
            incomes.push({
                issue_date:         fecha,
                amount:             monto,
                income_type:        'OTRO',
                order_id:           null,
                payment_method_id:  pmId,
                description:        desc || cat || null,
                notes:              cat  || null,
                currency:           'ARS',
                created_by_user_id: userId,
            });

        } else if (tipo === 'EGRESO') {
            const catId = (cat ? (catMap.get(cat.toLowerCase()) ?? null) : null) ?? otrosCatId;
            if (cat && !catMap.get(cat.toLowerCase())) unmappedCats.add(cat);

            expenses.push({
                issue_date:         fecha,
                amount:             monto,
                category_id:        catId,
                subcategory_id:     null,
                payment_method_id:  pmId,
                description:        desc || null,
                status:             'PAGADO',
                payment_date:       fecha,
                vendor_id:          null,
                notes:              null,
            });

        } else {
            skipped++;
        }
    }

    // ── Warnings ──────────────────────────────────────────────────────────
    if (unmappedCats.size > 0) {
        console.warn('⚠️  Categorías sin match en DB (category_id quedará null):');
        unmappedCats.forEach(c => console.warn('   -', c));
        console.log();
    }
    if (unmappedPMs.size > 0) {
        console.warn('⚠️  Medios de pago sin match en DB (sin movimiento generado):');
        unmappedPMs.forEach(p => console.warn('   -', p));
        console.log();
    }
    if (skipped > 0) console.log(`⏭️  Filas ignoradas (sin fecha o monto cero): ${skipped}`);

    console.log(`📥 Ingresos a insertar: ${incomes.length}`);
    console.log(`📤 Egresos a insertar:  ${expenses.length}`);

    if (DRY_RUN) {
        console.log('\n✅ Dry run finalizado.');
        return;
    }

    // ── Insert incomes ────────────────────────────────────────────────────
    let insertedIncomes = [];
    for (const batch of chunk(incomes, 200)) {
        const { data, error } = await supabase
            .from('finance_incomes')
            .insert(batch)
            .select('id, amount, payment_method_id, description, issue_date');
        if (error) { console.error('❌ Error insertando ingresos:', error.message); process.exit(1); }
        insertedIncomes = insertedIncomes.concat(data);
    }
    console.log(`\n✅ Ingresos insertados: ${insertedIncomes.length}`);

    // ── Insert expenses ───────────────────────────────────────────────────
    let insertedExpenses = [];
    for (const batch of chunk(expenses, 200)) {
        const { data, error } = await supabase
            .from('finance_expenses')
            .insert(batch)
            .select('id, amount, payment_method_id, description, issue_date, payment_date');
        if (error) { console.error('❌ Error insertando egresos:', error.message); process.exit(1); }
        insertedExpenses = insertedExpenses.concat(data);
    }
    console.log(`✅ Egresos insertados: ${insertedExpenses.length}`);

    // ── Generate account_movements ────────────────────────────────────────
    const movements = [];

    for (const inc of insertedIncomes) {
        if (!inc.payment_method_id) continue;
        movements.push({
            payment_method_id:  inc.payment_method_id,
            movement_type:      'INGRESO',
            amount:             inc.amount,
            description:        inc.description,
            movement_date:      inc.issue_date,
            source_id:          inc.id,
            source_type:        'income',
            created_by_user_id: userId,
        });
    }

    for (const exp of insertedExpenses) {
        if (!exp.payment_method_id) continue;
        movements.push({
            payment_method_id:  exp.payment_method_id,
            movement_type:      'EGRESO',
            amount:             exp.amount,
            description:        exp.description,
            movement_date:      exp.payment_date ?? exp.issue_date,
            source_id:          exp.id,
            source_type:        'expense',
            created_by_user_id: userId,
        });
    }

    for (const batch of chunk(movements, 200)) {
        const { error } = await supabase.from('account_movements').insert(batch);
        if (error) { console.error('❌ Error insertando movimientos:', error.message); process.exit(1); }
    }
    console.log(`✅ Movimientos generados: ${movements.length}`);

    console.log('\n🎉 Importación completada.');
}

main().catch(console.error);
