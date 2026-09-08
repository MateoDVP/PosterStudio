/**
 * Extracción inteligente de paleta de colores de portada con ColorThief.
 * - Carga imágenes con CORS seguro mediante el proxy local /api/image-proxy.
 * - Almacena en caché en memoria los resultados para no procesar dos veces la misma imagen.
 * - Retorna un arreglo de 5 colores en formato Hex (#RRGGBB).
 */

export const DEFAULT_PALETTE = [
  '#1A1A1A',
  '#4A4A4A',
  '#808080',
  '#C0C0C0',
  '#FFFFFF',
];

const paletteCache = new Map<string, string[]>();

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function toHexColor(color: any): string {
  if (!color) return '#1A1A1A';
  if (typeof color === 'string') {
    return color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`;
  }
  if (typeof color.hex === 'function') {
    return color.hex().toUpperCase();
  }
  if (Array.isArray(color) && color.length >= 3) {
    return rgbToHex(color[0], color[1], color[2]);
  }
  if (typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
    return rgbToHex(color.r, color.g, color.b);
  }
  return '#1A1A1A';
}

function getSafeImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Extrae los colores dominantes de una carátula o imagen.
 * @param imageUrl URL remota, local (blob:/data:) o proxy de la imagen.
 * @param colorCount Cantidad de colores a extraer (por defecto 5).
 */
export async function extractPaletteFromImage(
  imageUrl: string,
  colorCount: number = 5
): Promise<string[]> {
  if (!imageUrl || typeof window === 'undefined') {
    return DEFAULT_PALETTE;
  }

  // 1. Revisar si ya está en caché en memoria
  if (paletteCache.has(imageUrl)) {
    return paletteCache.get(imageUrl)!;
  }

  try {
    // 2. Importación dinámica de ColorThief para evitar problemas con Server-Side Rendering
    const colorThiefModule: any = await import('colorthief');

    // 3. Crear elemento Image con crossOrigin para permitir lectura de canvas sin errores de CORS
    const safeUrl = getSafeImageUrl(imageUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const palette: string[] = await new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          let rawPalette: any[] | null = null;

          if (typeof colorThiefModule.getPalette === 'function') {
            rawPalette = await colorThiefModule.getPalette(img, {
              colorCount: Math.max(colorCount + 3, 8),
            });
          } else if (typeof colorThiefModule.getPaletteSync === 'function') {
            rawPalette = colorThiefModule.getPaletteSync(img, {
              colorCount: Math.max(colorCount + 3, 8),
            });
          } else {
            const ColorThiefClass = colorThiefModule.default || colorThiefModule;
            const thief = new ColorThiefClass();
            rawPalette = thief.getPalette(img, Math.max(colorCount + 3, 8));
          }

          if (!rawPalette || rawPalette.length === 0) {
            resolve(DEFAULT_PALETTE);
            return;
          }

          // Convertir a Hexadecimales
          const hexColors: string[] = [];
          for (const item of rawPalette) {
            const hex = toHexColor(item);
            if (hex && !hexColors.includes(hex)) {
              hexColors.push(hex);
            }
            if (hexColors.length >= colorCount) break;
          }

          // Si faltan colores para completar colorCount, rellenar
          while (hexColors.length < colorCount) {
            hexColors.push(DEFAULT_PALETTE[hexColors.length % DEFAULT_PALETTE.length]);
          }

          resolve(hexColors.slice(0, colorCount));
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        reject(err);
      };

      img.src = safeUrl;
    });

    // 4. Guardar en caché y retornar
    paletteCache.set(imageUrl, palette);
    return palette;
  } catch (err) {
    console.warn('Error al extraer paleta con ColorThief, usando paleta por defecto:', err);
    return DEFAULT_PALETTE;
  }
}
