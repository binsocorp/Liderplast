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

function generateHTML(order: any, logoDataUrl: string): string {
    const subtotalItems = (order.items || []).reduce(
        (acc: number, item: any) => acc + Number(item.unit_price_net || 0) * (item.quantity || 0),
        0
    );
    const totalServicios =
        Number(order.freight_amount || 0) +
        Number(order.installation_amount || 0) +
        Number(order.travel_amount || 0);
    const totalImpuestos =
        Number(order.tax_amount_manual || 0) + Number(order.other_amount || 0);
    const descuento = Number(order.discount_amount || 0);

    const tableItemsCount = (order.items?.length || 0) + (totalServicios > 0 ? 1 : 0);
    let cellPaddingY = '12px';
    let fontSize = '14px';
    if (tableItemsCount > 10) {
        cellPaddingY = '4px';
        fontSize = '10px';
    } else if (tableItemsCount > 6) {
        cellPaddingY = '6px';
        fontSize = '11px';
    }

    const rowStyle = `padding: ${cellPaddingY} 20px; font-size: ${fontSize};`;

    const tableRows = [
        ...(order.items || []).map(
            (item: any) => `
            <tr style="background: white; border-bottom: 1px solid #F3F4F6;">
                <td style="${rowStyle}"><p style="font-weight: 700; color: #111827;">${item.description}</p></td>
                <td style="${rowStyle} text-align: center; font-weight: 700;">${item.quantity}</td>
                <td style="${rowStyle} text-align: right; color: #4B5563;">${formatCurrency(Number(item.unit_price_net))}</td>
                <td style="${rowStyle} text-align: right; font-weight: 700; color: #111827;">${formatCurrency(Number(item.unit_price_net) * item.quantity)}</td>
            </tr>`
        ),
        totalServicios > 0
            ? `<tr style="background: rgba(249,250,251,0.5); border-bottom: 1px solid #F3F4F6;">
                <td style="${rowStyle}">
                    <p style="font-weight: 700; color: #111827;">Servicios Logísticos e Instalación</p>
                    <p style="font-size: 9px; color: #6B7280; font-style: italic; margin-top: 2px;">Incluye flete, instalación y viáticos</p>
                </td>
                <td style="${rowStyle} text-align: center; font-weight: 700;">1</td>
                <td style="${rowStyle} text-align: right; color: #4B5563;">${formatCurrency(totalServicios)}</td>
                <td style="${rowStyle} text-align: right; font-weight: 700; color: #111827;">${formatCurrency(totalServicios)}</td>
            </tr>`
            : '',
    ].join('');

    const summaryRows = [
        `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            <span>Subtotal</span><span>${formatCurrency(subtotalItems + totalServicios)}</span>
        </div>`,
        `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            <span>Impuestos / Otros</span><span>${formatCurrency(totalImpuestos)}</span>
        </div>`,
        descuento > 0
            ? `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                <span>Descuento</span><span>-${formatCurrency(descuento)}</span>
            </div>`
            : '',
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
                    <img src="${logoDataUrl}" style="width: 100%; height: 100%; object-fit: contain;" alt="Liderplast">
                </div>
                <div>
                    <h1 style="font-size: 36px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; color: #111827;">Liderplast</h1>
                    <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #9CA3AF;">Fábrica de Piletas &amp; Logística</p>
                </div>
            </div>
            <div style="text-align: right;">
                <h2 style="font-size: 36px; font-weight: 900; text-transform: uppercase; color: #111827; line-height: 1.1;">Remito</h2>
                <p style="font-size: 21px; font-weight: 700; color: #6B7280;">Nº ${order.order_number}</p>
                <p style="font-size: 12px; font-weight: 500; color: #9CA3AF; margin-top: 4px;">${formatDate(order.created_at)}</p>
            </div>
        </div>

        <!-- CLIENT INFO -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px;">
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <h3 style="font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">Datos del Cliente</h3>
                    <p style="font-size: 18px; font-weight: 900; color: #111827; line-height: 1.2;">${order.client_name}</p>
                    <p style="font-size: 12px; font-weight: 500; color: #6B7280;">DNI/CUIT: ${order.client_document || '—'}</p>
                    <p style="font-size: 12px; font-weight: 500; color: #6B7280;">Tel: ${order.client_phone || '—'}</p>
                </div>
                <div>
                    <h3 style="font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">Lugar de Entrega</h3>
                    <p style="font-size: 14px; font-weight: 700; color: #1F2937;">${order.delivery_address}</p>
                    <p style="font-size: 12px; font-weight: 500; color: #4B5563; text-transform: uppercase;">${order.city}${order.province?.name ? `, ${order.province.name}` : ''}</p>
                </div>
            </div>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #F3F4F6; font-style: italic;">
                <h3 style="font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.2em; font-style: normal; margin-bottom: 8px;">Notas del Pedido</h3>
                <p style="font-size: 12px; color: #4B5563; line-height: 1.6;">${order.notes || 'Sin observaciones adicionales.'}</p>
            </div>
        </div>
    </div>

    <!-- TABLE -->
    <div style="border: 2px solid #111827; border-radius: 12px; overflow: hidden; margin-top: 24px; flex: 1; display: flex; flex-direction: column; min-height: 0;">
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead style="background: #111827; color: white;">
                <tr>
                    <th style="padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Descripción del Producto / Servicio</th>
                    <th style="padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; width: 80px;">Cant.</th>
                    <th style="padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; text-align: right; width: 110px;">Unitario</th>
                    <th style="padding: 8px 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; text-align: right; width: 110px;">Subtotal</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    </div>

    <!-- FOOTER -->
    <div style="margin-top: 16px; flex-shrink: 0; padding-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 40px;">
            <div style="flex: 1; font-size: 10px; color: #9CA3AF; font-weight: 700; line-height: 1.6; max-width: 384px;">
                <p>Este remito no es válido como factura.<br>La mercadería se entrega en las condiciones especificadas y el cliente manifiesta su conformidad con la recepción.</p>
            </div>
            <div style="width: 288px; background: #F9FAFB; padding: 16px; border-radius: 16px; border: 2px solid #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                ${summaryRows}
                <div style="padding-top: 8px; margin-top: 4px; border-top: 1px solid #D1D5DB; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; font-weight: 900; color: #030712; text-transform: uppercase; letter-spacing: 0.1em;">Total Final</span>
                    <span style="font-size: 18px; font-weight: 900; color: #030712; letter-spacing: -0.05em;">${formatCurrency(Number(order.total_net))}</span>
                </div>
            </div>
        </div>
        <div style="padding-top: 16px; margin-top: 16px; font-size: 10px; color: #9CA3AF; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; text-align: center; border-top: 1px dashed #E5E7EB;">
            Gracias por confiar en Liderplast
        </div>
    </div>

</div>
</body>
</html>`;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: order } = await (supabase.from('orders') as any)
        .select(`
            *,
            province:provinces(name),
            seller:sellers(name),
            items:order_items(id, description, quantity, unit_price_net)
        `)
        .eq('id', id)
        .single();

    if (!order) {
        return new NextResponse('Not found', { status: 404 });
    }

    let logoDataUrl = '';
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo-institutional.png');
        const logoBuffer = fs.readFileSync(logoPath);
        logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch {
        // logo fallback
    }

    const html = generateHTML(order, logoDataUrl);

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

        const filename = `REM-${order.order_number}.pdf`;

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error('[PDF] Error generating remito PDF:', err);
        return new NextResponse(
            JSON.stringify({ error: 'Error generando PDF', detail: String(err) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    } finally {
        await browser?.close();
    }
}
