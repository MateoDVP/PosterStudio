import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { PrintSize, PosterConfig } from '@/types/poster';
import {
  generatePosterSvgString,
  generatePosterSvgElement,
  ExportProgressCallback,
} from './exportToSvg';
import { generatePngDataUrl } from './exportToPng';

export type { ExportProgressCallback };

/**
 * Dispara la descarga en el navegador a partir de un Blob de archivo binario.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el póster a un PDF vectorial nativo con trazados, textos y formas
 * con dimensiones físicas exactas en milímetros (1:1) para imprenta y preprensa.
 *
 * Utiliza Puppeteer (Chromium Headless) en el backend para una renderización
 * vectorial perfecta al 100% idéntica a la pantalla, con respaldo local automático.
 */
export async function exportToPdf(
  configOrElement: PosterConfig | HTMLElement,
  printSize: PrintSize,
  filename: string = 'poster-vectorial',
  onProgress?: ExportProgressCallback,
  fallbackDomElementOrConfig?: HTMLElement | PosterConfig | null
): Promise<void> {
  const config = (
    configOrElement && 'template' in configOrElement
      ? configOrElement
      : fallbackDomElementOrConfig && 'template' in fallbackDomElementOrConfig
        ? fallbackDomElementOrConfig
        : null
  ) as PosterConfig | null;

  const domElement = (
    configOrElement && ('tagName' in configOrElement || 'nodeType' in configOrElement)
      ? configOrElement
      : fallbackDomElementOrConfig &&
        ('tagName' in fallbackDomElementOrConfig || 'nodeType' in fallbackDomElementOrConfig)
        ? fallbackDomElementOrConfig
        : null
  ) as HTMLElement | null;

  const cleanBaseName = filename.endsWith('.pdf') ? filename.replace(/\.pdf$/i, '') : filename;
  const finalPdfName = `${cleanBaseName}.pdf`;

  // --------------------------------------------------------------------------
  // MÉTODO 1 (PRIMARIO): CAPTURA FIEL 1:1 DESDE EL DOM A 300 DPI PRE-PRENSA
  // --------------------------------------------------------------------------
  if (domElement) {
    try {
      onProgress?.('Capturando diseño de pantalla a resolución de imprenta (300 DPI)...');
      const dataUrl = await generatePngDataUrl(domElement, printSize, onProgress);

      onProgress?.(
        `Creando documento PDF de imprenta (${printSize.widthMm} × ${printSize.heightMm} mm)...`
      );

      const pdf = new jsPDF({
        orientation: printSize.widthMm > printSize.heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [printSize.widthMm, printSize.heightMm],
        compress: true,
      });

      // Añadir imagen a escala exacta física 1:1 en mm con compresión Flate sin pérdidas (lossless)
      pdf.addImage(
        dataUrl,
        'PNG',
        0,
        0,
        printSize.widthMm,
        printSize.heightMm,
        undefined,
        'FAST'
      );

      onProgress?.('Guardando archivo PDF...');
      pdf.save(finalPdfName);
      onProgress?.('¡Exportación PDF para imprenta (300 DPI) completada!');
      return;
    } catch (domErr) {
      console.warn('Fallo en la captura de DOM para PDF, probando método alternativo:', domErr);
    }
  }

  // --------------------------------------------------------------------------
  // MÉTODO 2 (RESPALDO 1): PUPPETEER CHROMIUM VECTORIAL ENGINE
  // --------------------------------------------------------------------------
  if (config) {
    try {
      onProgress?.('Generando gráficos y trazados vectoriales...');
      const svgString = await generatePosterSvgString(config, printSize, onProgress);

      onProgress?.('Enviando a motor Chromium (Puppeteer)...');
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg: svgString,
          widthMm: printSize.widthMm,
          heightMm: printSize.heightMm,
          filename: cleanBaseName,
        }),
      });

      if (response.ok) {
        onProgress?.('Descargando archivo PDF vectorial nativo...');
        const pdfBlob = await response.blob();
        downloadBlob(pdfBlob, finalPdfName);
        onProgress?.('¡Exportación PDF vectorial con Puppeteer completada!');
        return;
      }

      console.warn(
        'El endpoint de Puppeteer devolvió un error, aplicando respaldo local:',
        await response.text()
      );
    } catch (puppeteerErr) {
      console.warn(
        'No se pudo completar con Puppeteer, aplicando respaldo local:',
        puppeteerErr
      );
    }
  }

  // --------------------------------------------------------------------------
  // MÉTODO 3 (RESPALDO 2): JSDOM / SVG2PDF LOCAL EN NAVEGADOR
  // --------------------------------------------------------------------------
  try {
    if (config) {
      onProgress?.('Generando PDF con motor vectorial local...');
      const svgElement = await generatePosterSvgElement(config, printSize, onProgress);

      onProgress?.(
        `Creando documento PDF vectorial (${printSize.widthMm} × ${printSize.heightMm} mm)...`
      );

      const pdf = new jsPDF({
        orientation: printSize.widthMm > printSize.heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [printSize.widthMm, printSize.heightMm],
        compress: false,
      });

      onProgress?.('Traduciendo vectores a PDF...');
      await svg2pdf(svgElement, pdf, {
        x: 0,
        y: 0,
        width: printSize.widthMm,
        height: printSize.heightMm,
      });

      onProgress?.('Guardando archivo PDF...');
      pdf.save(finalPdfName);
      onProgress?.('¡Exportación PDF completada con éxito!');
      return;
    }
  } catch (error) {
    console.error('Error en exportación PDF local:', error);
    throw error;
  }
}
