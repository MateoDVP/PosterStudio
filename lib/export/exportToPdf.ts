import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { PrintSize, PosterConfig } from '@/types/poster';
import { generatePosterSvgElement, ExportProgressCallback } from './exportToSvg';
import { generatePngDataUrl } from './exportToPng';

export type { ExportProgressCallback };

/**
 * Exporta el póster a un PDF vectorial nativo con trazados, textos y formas
 * con dimensiones físicas exactas en milímetros (1:1) para imprenta y preprensa.
 * Cuenta con respaldo de preprensa de alta resolución si se requiere.
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

  try {
    if (config) {
      onProgress?.('Generando gráficos y trazados vectoriales...');
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

      onProgress?.('Traduciendo vectores, textos e imágenes a PDF...');
      await svg2pdf(svgElement, pdf, {
        x: 0,
        y: 0,
        width: printSize.widthMm,
        height: printSize.heightMm,
      });

      onProgress?.('Guardando archivo PDF vectorial...');
      pdf.save(`${filename}-${printSize.id}-vectorial.pdf`);
      onProgress?.('¡Exportación PDF vectorial completada!');
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
    console.error('Error al exportar PDF vectorial, aplicando respaldo de preprensa:', error);
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
