import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
    }).format(val);
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateStr));
}

function formatDateShort(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR');
}

function generateHTML(quotation: any, logoDataUrl: string, brand: 'liderplast' | 'swimming' = 'liderplast'): string {
    const brandName = brand === 'swimming' ? 'Swimming Pool' : 'Liderplast';
    const brandTagline = brand === 'swimming' ? 'Piletas &amp; Accesorios' : 'Fábrica de Piletas';
    const subtotalProducto = Number(quotation.subtotal_products || 0) + Number(quotation.other_amount || 0);
    const flete = Number(quotation.freight_amount || 0) + Number(quotation.travel_amount || 0);
    const instalacion = Number(quotation.installation_amount || 0);
    const impuestos = Number(quotation.tax_amount_manual || 0);
    const descuento = Number(quotation.discount_amount || 0);
    const total = Number(quotation.total_net || 0);

    const rowStyle = `padding: 12px 20px; font-size: 14px;`;

    const conceptRow = (label: string, amount: number, isNegative = false) => `
        <tr style="background: white; border-bottom: 1px solid #F3F4F6;">
            <td style="${rowStyle} font-weight: 700; color: #111827;">${label}</td>
            <td style="${rowStyle} text-align: right; font-weight: 700; color: ${isNegative ? '#DC2626' : '#111827'};">
                ${isNegative ? '-' : ''}${formatCurrency(amount)}
            </td>
        </tr>`;

    const tableRows = [
        conceptRow('Subtotal Producto', subtotalProducto),
        flete > 0 ? conceptRow('Flete', flete) : '',
        instalacion > 0 ? conceptRow('Instalación', instalacion) : '',
        impuestos > 0 ? conceptRow('Impuestos', impuestos) : '',
        descuento > 0 ? conceptRow('Descuentos', descuento, true) : '',
    ].join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    color: #111827;
    background: white;
}
#page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 40px;
}
</style>
</head>
<body>
<div id="page">

    <!-- HEADER -->
    <div style="flex-shrink: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #111827; padding-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 16px; border: 2px solid #F3F4F6; display: flex; align-items: center; justify-content: center; padding: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <img src="${logoDataUrl}" style="max-width: 64px; max-height: 64px; display: block;" alt="${brandName}">
                </div>
                <div>
                    <h1 style="font-size: 36px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; color: #111827;">${brandName}</h1>
                    <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #9CA3AF;">${brandTagline}</p>
                </div>
            </div>
            <div style="text-align: right;">
                <h2 style="font-size: 36px; font-weight: 900; text-transform: uppercase; color: #111827; line-height: 1.1;">Cotización</h2>
                <p style="font-size: 21px; font-weight: 700; color: #6B7280;">Nº ${quotation.quotation_number}</p>
                <p style="font-size: 12px; font-weight: 500; color: #9CA3AF; margin-top: 4px;">Emitida: ${formatDate(quotation.created_at)}</p>
                ${quotation.expires_at ? `<p style="font-size: 12px; font-weight: 700; color: #D97706; margin-top: 2px;">Válida hasta: ${formatDateShort(quotation.expires_at)}</p>` : ''}
            </div>
        </div>

        <!-- CLIENT INFO -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px;">
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <h3 style="font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">Datos del Cliente</h3>
                    <p style="font-size: 18px; font-weight: 900; color: #111827; line-height: 1.2;">${quotation.client_name}</p>
                    ${quotation.client_document ? `<p style="font-size: 12px; font-weight: 500; color: #6B7280;">DNI/CUIT: ${quotation.client_document}</p>` : ''}
                    ${quotation.client_phone ? `<p style="font-size: 12px; font-weight: 500; color: #6B7280;">Tel: ${quotation.client_phone}</p>` : ''}
                </div>
                <div>
                    <h3 style="font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">Lugar de Entrega</h3>
                    <p style="font-size: 14px; font-weight: 700; color: #1F2937;">${quotation.delivery_address}</p>
                    <p style="font-size: 12px; font-weight: 500; color: #4B5563; text-transform: uppercase;">${quotation.city}${quotation.province?.name ? `, ${quotation.province.name}` : ''}</p>
                </div>
            </div>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #F3F4F6; font-style: italic;">
                <h3 style="font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.2em; font-style: normal; margin-bottom: 8px;">Observaciones</h3>
                <p style="font-size: 12px; color: #4B5563; line-height: 1.6;">${quotation.notes || 'Sin observaciones adicionales.'}</p>
            </div>
        </div>
    </div>

    <!-- TABLE -->
    <div style="border: 2px solid #111827; border-radius: 12px; overflow: hidden; margin-top: 24px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead style="background: #111827; color: white;">
                <tr>
                    <th style="padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Concepto</th>
                    <th style="padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; text-align: right; width: 160px;">Importe</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    </div>

    <!-- FOOTER -->
    <div style="margin-top: 16px; flex-shrink: 0; padding-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 40px;">
            <div style="flex: 1; font-size: 10px; color: #9CA3AF; font-weight: 700; line-height: 1.6; max-width: 384px;">
                <p>Esta cotización no es válida como factura ni constituye un compromiso de venta.${quotation.expires_at ? ` Los precios y condiciones son válidos hasta el <strong style="color: #4B5563;">${formatDateShort(quotation.expires_at)}</strong>.` : ''}</p>
            </div>
            <div style="width: 288px; background: #F9FAFB; padding: 16px; border-radius: 16px; border: 2px solid #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 900; color: #030712; text-transform: uppercase; letter-spacing: 0.1em;">Total</span>
                <span style="font-size: 18px; font-weight: 900; color: #030712; letter-spacing: -0.05em;">${formatCurrency(total)}</span>
            </div>
        </div>
        <div style="padding-top: 16px; margin-top: 16px; font-size: 10px; color: #9CA3AF; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; text-align: center; border-top: 1px dashed #E5E7EB;">
            Gracias por confiar en ${brandName}
        </div>
    </div>

</div>
</body>
</html>`;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') === 'swimming' ? 'swimming' : 'liderplast';

    const supabase = await createClient();

    const { data: quotation } = await (supabase.from('quotations') as any)
        .select(`
            *,
            province:provinces(id, name),
            seller:sellers(id, name),
            reseller:resellers(id, name),
            items:quotation_items(*)
        `)
        .eq('id', id)
        .single();

    if (!quotation) {
        return new NextResponse('Not found', { status: 404 });
    }

    let logoDataUrl = '';
    try {
        if (brand === 'swimming') {
            const svgPath = path.join(process.cwd(), 'public', 'logo-swimming-pool.svg');
            const svgContent = fs.readFileSync(svgPath, 'utf-8');
            logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
        } else {
            const pngPath = path.join(process.cwd(), 'public', 'logo-institutional.png');
            const pngBuffer = fs.readFileSync(pngPath);
            logoDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
        }
    } catch {
        // logo fallback: no image
    }

    const html = generateHTML(quotation, logoDataUrl, brand);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBytes = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });

        const filename = `COT-${quotation.quotation_number}.pdf`;

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error('[PDF] Error generating PDF:', err);
        return new NextResponse(
            JSON.stringify({ error: 'Error generando PDF', detail: String(err) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    } finally {
        await browser?.close();
    }
}
