import jsPDF from 'jspdf';
import { PrintSize } from '@/types/poster';
import { generatePngDataUrl, ExportProgressCallback } from './exportToPng';

/**
 * Exports the poster to a prepress-ready PDF with exact physical dimensions in millimeters.
 */
export async function exportToPdf(
  element: HTMLElement,
  printSize: PrintSize,
  filename: string = 'poster-vectorial',
  onProgress?: ExportProgressCallback
): Promise<void> {
  try {
    onProgress?.('Generando imagen de alta resolución para preprensa...');
    const dataUrl = await generatePngDataUrl(element, printSize, onProgress);

    onProgress?.(`Creando documento PDF (${printSize.widthMm} × ${printSize.heightMm} mm)...`);

    // Create jsPDF document with exact physical dimensions in millimeters
    const pdf = new jsPDF({
      orientation: printSize.widthMm > printSize.heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [printSize.widthMm, printSize.heightMm],
      compress: false, // Ensure maximum prepress raster fidelity
    });

    // Embed the 300 DPI raster precisely filling the physical page
    pdf.addImage(
      dataUrl,
      'PNG',
      0,
      0,
      printSize.widthMm,
      printSize.heightMm,
      undefined,
      'NONE'
    );

    onProgress?.('Guardando archivo PDF...');
    pdf.save(`${filename}-${printSize.id}-300dpi.pdf`);
    onProgress?.('¡Exportación PDF completada!');
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    throw error;
  }
}
