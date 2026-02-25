const fs = require('fs');
const path = require('path');

const baseDir = 'c:/Users/juand/Documents/Binso 2025/Liderplast/App/src/app/(app)/(admin)/master';
const pages = ['provinces', 'clients', 'sellers', 'resellers', 'suppliers', 'catalog', 'prices', 'installers', 'trips'];

for (const p of pages) {
    const pagePath = path.join(baseDir, p, 'page.tsx');
    if (!fs.existsSync(pagePath)) continue;

    const content = fs.readFileSync(pagePath, 'utf8');

    const name = p.charAt(0).toUpperCase() + p.slice(1);
    const clientName = `${name}Client`;

    // Extract props (from data: XYZ)
    let props = [];
    const matches = [...content.matchAll(/data: (\w+)/g)];
    matches.forEach(m => props.push(m[1]));

    // Replace component name
    let clientContent = `'use client';\n\n` + content.replace(`export default async function ${name}Page() {`, `export function ${clientName}({ ${props.join(', ')} }: any) {`);

    // Remove supabase import and fetch block from client
    clientContent = clientContent.replace(/import \{ createClient \} from '@\/lib\/supabase\/server';\n/, '');

    // Remove block starting at `const supabase = await createClient();`
    // For `clients` it ends at `]);`, for `provinces` it ends at `const { data...`
    const lines = clientContent.split('\n');
    let newLines = [];
    let inFetch = false;
    for (let line of lines) {
        if (line.includes('const supabase = await createClient();')) {
            inFetch = true;
            continue;
        }
        if (inFetch) {
            // Find where fetch ends by checking empty line or `const ...Options` or `return`
            if (line.trim() === '' || line.includes('Options =') || line.includes('return (')) {
                inFetch = false;
                if (!line.includes('const supabase')) newLines.push(line);
            }
            continue;
        }
        newLines.push(line);
    }
    clientContent = newLines.join('\n');

    // Create page.tsx
    const pageImports = `import { createClient } from '@/lib/supabase/server';\nimport { ${clientName} } from './${clientName}';`;

    // Extract fetch body from original
    let fetchBody = '';
    const linesOrig = content.split('\n');
    let inFetchOrig = false;
    for (let line of linesOrig) {
        if (line.includes('const supabase = await createClient();')) {
            inFetchOrig = true;
        }
        if (inFetchOrig) {
            if (line.includes('Options =') || line.includes('return (')) {
                inFetchOrig = false;
                break;
            }
            fetchBody += line + '\n';
        }
    }

    const pageContent = `${pageImports}\n\nexport default async function ${name}Page() {\n${fetchBody}\n  return <${clientName} ${props.map(pr => `${pr}={${pr} ?? null}`).join(' ')} />;\n}\n`;

    fs.writeFileSync(path.join(baseDir, p, `${clientName}.tsx`), clientContent);
    fs.writeFileSync(pagePath, pageContent);
    console.log(`Refactored ${p}`);
}
