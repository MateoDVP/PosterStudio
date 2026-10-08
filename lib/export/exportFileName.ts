import { PosterConfig, PrintSize } from '@/types/poster';
import { getBasePrintSize } from '@/lib/constants/printSizes';

/**
 * Convierte un texto a PascalCase sin espacios, eliminando caracteres no permitidos:
 * Ejemplo: "Wish You Were Here" -> "WishYouWereHere"
 *          "Pink Floyd" -> "PinkFloyd"
 */
function toPascalCaseNoSpaces(str: string): string {
  if (!str) return '';
  // Limpiar caracteres reservados de archivo y puntuación conflictiva
  const sanitized = str.replace(/[/\\?%*:|"<>.,;!#$^&(){}[\]~`+=@]/g, '').trim();
  if (!sanitized) return '';

  return sanitized
    .split(/[\s_—–-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Genera el nombre de archivo sin espacios separado por guiones bajos:
 * Ejemplo: "WishYouWereHere_PinkFloyd_29.8x39.8cm"
 *          "WishYouWereHere_PinkFloyd_MDF_29.8x39.8cm_(Impresion_33.8x43.8cm)"
 */
export function getExportBaseFileName(config: PosterConfig, printSize: PrintSize): string {
  const isSong = config.template === 'song-player';
  const rawTitle = (isSong ? config.player.title : config.album.title)?.trim() || (isSong ? 'Cancion' : 'Album');
  const rawArtist = (isSong ? config.player.artist : config.album.artist)?.trim() || 'Artista';

  let sizeLabel = '';
  if (config.finishType === 'mdf') {
    const baseSize = getBasePrintSize(config);
    const baseLabel =
      baseSize.id === 'custom'
        ? `${baseSize.widthMm / 10}x${baseSize.heightMm / 10}cm`
        : `${baseSize.id}cm`;
    const sheetLabel = `${(printSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })}x${(printSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })}cm`;
    sizeLabel = `MDF_${baseLabel}_(Impresion_${sheetLabel})`;
  } else {
    sizeLabel =
      printSize.id === 'custom'
        ? `${(printSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })}x${(printSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })}cm`
        : `${printSize.id}cm`;
  }

  const cleanTitle = toPascalCaseNoSpaces(rawTitle) || (isSong ? 'Cancion' : 'Album');
  const cleanArtist = toPascalCaseNoSpaces(rawArtist) || 'Artista';

  return `${cleanTitle}_${cleanArtist}_${sizeLabel}`;
}

