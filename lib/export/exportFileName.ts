import { PosterConfig, PrintSize } from '@/types/poster';

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
 * Ejemplo: "WishYouWereHere_PinkFloyd_50x70"
 *          "ItBeckonsUsAll_Darkthrone_A3"
 */
export function getExportBaseFileName(config: PosterConfig, printSize: PrintSize): string {
  const isSong = config.template === 'song-player';
  const rawTitle = (isSong ? config.player.title : config.album.title)?.trim() || (isSong ? 'Cancion' : 'Album');
  const rawArtist = (isSong ? config.player.artist : config.album.artist)?.trim() || 'Artista';

  // Formato limpio del tamaño sin espacios: A3, A4, A5, 30x40, 50x70 o personalizado (ej: 40x50cm)
  const sizeLabel =
    printSize.id === 'custom'
      ? `${printSize.widthMm / 10}x${printSize.heightMm / 10}cm`
      : printSize.id.startsWith('a')
        ? printSize.id.toUpperCase()
        : printSize.id;

  const cleanTitle = toPascalCaseNoSpaces(rawTitle) || (isSong ? 'Cancion' : 'Album');
  const cleanArtist = toPascalCaseNoSpaces(rawArtist) || 'Artista';

  return `${cleanTitle}_${cleanArtist}_${sizeLabel}`;
}
