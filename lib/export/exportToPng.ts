import { toPng } from 'html-to-image';
import { PrintSize } from '@/types/poster';

export interface ExportProgressCallback {
  (status: string): void;
}

/**
 * Exports a DOM node to a high-resolution 300 DPI PNG.
 * Prepress standard: Pixels = (mm / 25.4) * 300
 */
export async function generatePngDataUrl(
  element: HTMLElement,
  printSize: PrintSize,
  onProgress?: ExportProgressCallback
): Promise<string> {
  onProgress?.('Preparando renderizado a 300 DPI...');

  // Wait a moment for any active font rendering or images to settle
  await new Promise((resolve) => setTimeout(resolve, 150));

  const clientWidth = element.clientWidth;
  const clientHeight = element.clientHeight;

  if (clientWidth === 0 || clientHeight === 0) {
    throw new Error('El elemento del póster no tiene dimensiones visibles.');
  }

  // Calculate pixelRatio to achieve exact 300 DPI pixel dimensions
  const targetWidth = printSize.widthPx300Dpi;
  const pixelRatio = targetWidth / clientWidth;

  onProgress?.(`Renderizando ${printSize.widthPx300Dpi} × ${printSize.heightPx300Dpi} px...`);

  const dataUrl = await toPng(element, {
    pixelRatio: pixelRatio,
    cacheBust: true,
    includeQueryParams: true,
    backgroundColor: element.style.backgroundColor || '#FFFFFF',
    skipFonts: false,
    filter: (node) => {
      // Exclude interactive export buttons or helper guides if tagged with data-export-ignore
      if (node instanceof HTMLElement && node.dataset.exportIgnore === 'true') {
        return false;
      }
      return true;
    },
  });

  return dataUrl;
}

export async function exportToPng(
  element: HTMLElement,
  printSize: PrintSize,
  filename: string = 'poster-300dpi',
  onProgress?: ExportProgressCallback
): Promise<void> {
  try {
    const dataUrl = await generatePngDataUrl(element, printSize, onProgress);

    onProgress?.('Descargando archivo PNG...');
    const link = document.createElement('a');
    link.download = `${filename}-${printSize.id}-300dpi.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onProgress?.('¡Exportación PNG completada!');
  } catch (error) {
    console.error('Error al exportar PNG:', error);
    throw error;
  }
}
