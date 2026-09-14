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

  // --------------------------------------------------------------------------
  // MÉTODO 1 (PRIMARIO): GENERACIÓN VECTORIAL CON CHROMIUM HEADLESS (PUPPETEER)
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
          filename: `${filename}-${printSize.id}-vectorial`,
        }),
      });

      if (response.ok) {
        onProgress?.('Descargando archivo PDF vectorial nativo...');
        const pdfBlob = await response.blob();
        downloadBlob(pdfBlob, `${filename}-${printSize.id}-vectorial.pdf`);
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
  // MÉTODO 2 (RESPALDO): JSDOM / SVG2PDF LOCAL EN NAVEGADOR
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
      pdf.save(`${filename}-${printSize.id}-vectorial.pdf`);
      onProgress?.('¡Exportación PDF completada con éxito!');
      return;
    }

    // Si no se proporcionó config pero sí un elemento del DOM
    if (domElement) {
      onProgress?.('Generando imagen de alta resolución para preprensa...');
      const dataUrl = await generatePngDataUrl(domElement, printSize, onProgress);

      const pdf = new jsPDF({
        orientation: printSize.widthMm > printSize.heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [printSize.widthMm, printSize.heightMm],
        compress: false,
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, printSize.widthMm, printSize.heightMm, undefined, 'NONE');
      pdf.save(`${filename}-${printSize.id}-300dpi.pdf`);
      onProgress?.('¡Exportación PDF completada!');
    }
  } catch (error) {
    console.error('Error en exportación PDF local, aplicando respaldo PNG:', error);
    if (domElement) {
      onProgress?.('Aplicando respaldo de preprensa en alta resolución...');
      const dataUrl = await generatePngDataUrl(domElement, printSize, onProgress);
      const pdf = new jsPDF({
        orientation: printSize.widthMm > printSize.heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [printSize.widthMm, printSize.heightMm],
        compress: false,
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, printSize.widthMm, printSize.heightMm, undefined, 'NONE');
      pdf.save(`${filename}-${printSize.id}-300dpi.pdf`);
      onProgress?.('¡Exportación PDF completada con respaldo de preprensa!');
      return;
    }
    throw error;
  }
}
