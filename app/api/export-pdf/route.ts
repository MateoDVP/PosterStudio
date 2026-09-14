import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const maxDuration = 60; // Permite hasta 60s en caso de pósters grandes 50x70

interface ExportPdfPayload {
  svg: string;
  widthMm: number;
  heightMm: number;
  filename?: string;
}

export async function POST(req: NextRequest) {
  let browser = null;

  try {
    const body: ExportPdfPayload = await req.json();
    const { svg, widthMm, heightMm, filename = 'poster-vectorial' } = body;

    if (!svg || !widthMm || !heightMm) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: svg, widthMm, heightMm' },
        { status: 400 }
      );
    }

    // 1. Lanzar instancia limpia y optimizada de Chromium
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();

    // 2. Establecer viewport con las dimensiones físicas del póster
    // Conversión mm a px en pantalla para viewport inicial (aprox 96 dpi)
    const viewportW = Math.round((widthMm * 96) / 25.4);
    const viewportH = Math.round((heightMm * 96) / 25.4);

    await page.setViewport({
      width: viewportW,
      height: viewportH,
      deviceScaleFactor: 2,
    });

    // 3. Documento HTML autocontenido con las fuentes Montserrat e Inter precargadas
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0mm;
    }

    html, body {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
      font-family: 'Montserrat', 'Inter', sans-serif;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;

    // 4. Cargar contenido y esperar a que las fuentes de Google Fonts estén 100% listas
    await page.setContent(htmlContent, {
      waitUntil: 'load',
      timeout: 30000,
    });

    // Asegurar que el motor tipográfico de Chromium ha renderizado todas las fuentes
    await page.evaluateHandle('document.fonts.ready');

    // 5. Generar el PDF vectorial con el motor nativo de Google Chrome
    const pdfBuffer = await page.pdf({
      width: `${widthMm}mm`,
      height: `${heightMm}mm`,
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    // 6. Devolver el archivo PDF como respuesta binaria descargable
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error al generar PDF con Puppeteer:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn('Error al cerrar browser de Puppeteer:', closeErr);
      }
    }

    return NextResponse.json(
      {
        error: error.message || 'Error interno al generar el PDF con Puppeteer',
      },
      { status: 500 }
    );
  }
}
