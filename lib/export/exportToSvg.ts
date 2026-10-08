/**
 * Motor de exportación a SVG Vectorial nativo para Adobe Illustrator y PDF.
 * - Dimensiones físicas exactas en milímetros (viewBox 0 0 widthMm heightMm).
 * - Capas estructuradas con id para Illustrator (Fondo, Carátula, Paleta, Textos, Spotify).
 * - Soporte completo para atmósfera difuminada ambiental (enableBlurredBackground).
 * - Coordenadas verticales milimétricas calculadas con precisión (sin solapamiento de textos).
 * - Textos editables (<text>) con fuentes estándar del sistema.
 * - Carátula e imagen ambiental incrustadas en Base64 con doble atributo href y xlink:href.
 * - Trazados vectoriales oficiales puros (<path>) para el código de Spotify.
 * - Sanitización XML estricta usando entidades numéricas (&#39;) inmunes a mayúsculas.
 */

import { PosterConfig, PrintSize } from '@/types/poster';
import { getResolvedPrintDimensions } from '@/lib/constants/printSizes';
import { formatReleaseDate, calculateTotalDurationFromTracks } from '@/lib/spotify';

export type ExportProgressCallback = (status: string) => void;

/**
 * Escapa caracteres especiales para XML estricto.
 * Utiliza entidades numéricas &#39; y &#34; para que nunca sean afectadas por toUpperCase().
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function convertImageToBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  try {
    const safeUrl = url.startsWith('/') || url.startsWith('blob:')
      ? url
      : `/api/image-proxy?url=${encodeURIComponent(url)}`;

    const response = await fetch(safeUrl);
    if (!response.ok) return url;

    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('No se pudo convertir la imagen a Base64 para SVG:', err);
    return url;
  }
}

/**
 * Genera un lienzo en memoria con la atmósfera desenfocada y la capa de contraste,
 * idéntica a la vista previa del componente web.
 */
async function createBlurredBackgroundDataUrl(
  coverUrl: string,
  widthMm: number,
  heightMm: number,
  blurPx: number = 35,
  opacity: number = 0.65,
  overlay: 'dark' | 'light' | 'paper' = 'dark',
  backgroundColor: string = '#FFFFFF'
): Promise<string> {
  if (!coverUrl || typeof window === 'undefined') return '';

  try {
    const safeUrl =
      coverUrl.startsWith('data:') || coverUrl.startsWith('blob:') || coverUrl.startsWith('/')
        ? coverUrl
        : `/api/image-proxy?url=${encodeURIComponent(coverUrl)}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = safeUrl;
    });

    if (!img.naturalWidth || !img.naturalHeight) return '';

    const aspect = widthMm / heightMm;
    const canvasW = 1200;
    const canvasH = Math.round(canvasW / aspect);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Fondo de papel
    ctx.fillStyle = backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 2. Imagen con desenfoque gaussiano ambiental
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity ?? 0.65));
    const effectiveBlur = Math.max(8, Math.round((blurPx || 35) * 1.5));
    ctx.filter = `blur(${effectiveBlur}px)`;

    const scale = 1.35;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW = canvasW * scale;
    let drawH = drawW / imgAspect;
    if (drawH < canvasH * scale) {
      drawH = canvasH * scale;
      drawW = drawH * imgAspect;
    }
    const drawX = (canvasW - drawW) / 2;
    const drawY = (canvasH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // 3. Capa de contraste ambiental
    if (overlay === 'dark') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
      ctx.fillRect(0, 0, canvasW, canvasH);
    } else if (overlay === 'light') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
      ctx.fillRect(0, 0, canvasW, canvasH);
    } else {
      ctx.fillStyle = backgroundColor || '#000000';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.warn('No se pudo generar el fondo difuminado en canvas:', err);
    return '';
  }
}

async function fetchSpotifyCodeSvg(uri: string, codeColor: string): Promise<string> {
  const cleanUri = (uri || '').trim() || 'spotify:album:3RQQmkQEvNCY4prGKE6oc5';
  const cleanColor = (codeColor || '#000000').replace('#', '');
  try {
    const response = await fetch(
      `/api/spotify-code?uri=${encodeURIComponent(cleanUri)}&bgColor=transparent&codeColor=${encodeURIComponent(cleanColor)}`
    );
    if (!response.ok) return '';

    let svgText = await response.text();
    // Extraer únicamente el contenido interno entre las etiquetas <svg...> y </svg>
    svgText = svgText
      .replace(/^[\s\S]*?<svg[^>]*>/i, '')
      .replace(/<\/svg>[\s\S]*?$/i, '');
    return svgText.trim();
  } catch (err) {
    console.warn('Error al obtener trazados vectoriales de Spotify:', err);
    return '';
  }
}

/**
 * Divide un texto largo en múltiples líneas de un número máximo de caracteres aproximado.
 * Opera sobre el texto sin escapar para medir la longitud real.
 */
function wrapText(text: string, maxCharsPerLine: number = 20): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

/**
 * Genera el código SVG vectorial completo listo para Adobe Illustrator y PDF.
 */
export async function generatePosterSvgString(
  config: PosterConfig,
  printSize: PrintSize,
  onProgress?: ExportProgressCallback
): Promise<string> {
  const { baseSize, sheetSize, isMdf, bleedMm } = getResolvedPrintDimensions(config);
  const totalSheetW = sheetSize.widthMm;
  const totalSheetH = sheetSize.heightMm;
  const width = baseSize.widthMm;
  const height = baseSize.heightMm;
  const isUltraSquarer = baseSize.aspectRatioRatio >= 0.81;
  const isSquarer = baseSize.aspectRatioRatio >= 0.74;

  const bgColor = config.backgroundColor || '#FFFFFF';
  const textColor = config.textColor || '#000000';

  onProgress?.('Incrustando carátula en alta definición...');
  const activeCoverUrl =
    config.template === 'album-gallery' || config.template === 'album-classic'
      ? config.album.coverUrl
      : config.player.coverUrl;
  const coverBase64 = activeCoverUrl ? await convertImageToBase64(activeCoverUrl) : '';

  // Generar atmósfera de fondo difuminada si está activa (cubriendo toda la lámina con sangrado)
  let blurredBgBase64 = '';
  if (config.enableBlurredBackground && activeCoverUrl) {
    onProgress?.('Generando atmósfera de portada difuminada...');
    blurredBgBase64 = await createBlurredBackgroundDataUrl(
      activeCoverUrl,
      totalSheetW,
      totalSheetH,
      config.blurredBackgroundBlur,
      config.blurredBackgroundOpacity,
      config.blurredBackgroundOverlay,
      bgColor
    );
  }

  let layersXml = '';

  if (config.template === 'album-gallery') {
    const album = config.album;
    const tracks = album.tracks || [];
    const padX = width * 0.065;
    const padTop = width * (isUltraSquarer ? 0.018 : isSquarer ? 0.035 : 0.06);
    const padBottom = width * (isUltraSquarer ? 0.028 : isSquarer ? 0.05 : 0.08);
    const contentW = width - 2 * padX;
    const baseScale = contentW / 255.42;

    const needsCompactCover = tracks.length > 14 && isSquarer;
    const coverScale = needsCompactCover ? (isUltraSquarer ? 0.86 : 0.90) : 1.0;
    const coverSize = contentW * coverScale;
    const coverX = padX + (contentW - coverSize) / 2;
    const coverY = padTop;

    const lowerY = coverY + coverSize + (isSquarer ? 6 : 7.5) * baseScale;
    const bottomLimit = height - padBottom;
    const rightColX = width - padX;

    onProgress?.('Descargando trazados vectoriales de Spotify...');
    const spotifyColor = album.soundwaveColor || textColor || '#000000';
    const rawSpotifySvg = await fetchSpotifyCodeSvg(album.spotifyUri || '', spotifyColor);

    onProgress?.('Construyendo capas vectoriales para Illustrator...');

    // --- CAPA 1: FONDO DE PAPEL Y ATMÓSFERA ---
    const bgLayer = `
    <!-- CAPA 1: FONDO DE PAPEL Y ATMÓSFERA DIFUMINADA -->
    <g id="Capa_Fondo">
      <rect width="${totalSheetW}" height="${totalSheetH}" fill="${bgColor}" />
      ${blurredBgBase64
        ? `<image id="Fondo_Portada_Difuminado" href="${blurredBgBase64}" xlink:href="${blurredBgBase64}" x="0" y="0" width="${totalSheetW}" height="${totalSheetH}" preserveAspectRatio="xMidYMid slice" />`
        : ''
      }
    </g>`;

    // --- CAPA 2: CARÁTULA ---
    const coverLayer = `
    <!-- CAPA 2: CARÁTULA EN ALTA RESOLUCIÓN -->
    <g id="Capa_Caratula">
      ${coverBase64
        ? `<image id="Caratula_UltraHD" href="${coverBase64}" xlink:href="${coverBase64}" x="${coverX.toFixed(2)}" y="${coverY.toFixed(2)}" width="${coverSize.toFixed(2)}" height="${coverSize.toFixed(2)}" preserveAspectRatio="xMidYMid slice" />`
        : `<rect x="${coverX.toFixed(2)}" y="${coverY.toFixed(2)}" width="${coverSize.toFixed(2)}" height="${coverSize.toFixed(2)}" fill="#f3f4f6" />`
      }
    </g>`;

    // --- CAPA 3: PALETA DE COLORES (5 Cuadros vectoriales) ---
    let paletteLayer = '';
    const rightBlockStartY = lowerY + 2.0 * baseScale;
    const hasPalette = album.showPalette !== false && album.palette && album.palette.length > 0;
    const paletteMultiplier = (album.paletteSize ?? 24) / 24;
    const sqSize = (isSquarer ? 8.0 : 9.5) * baseScale * paletteMultiplier;
    const sqGap = (isSquarer ? 2.0 : 2.5) * baseScale * Math.min(1.2, paletteMultiplier);

    if (hasPalette && album.palette) {
      const palette = album.palette.slice(0, 5);
      const totalPaletteW = palette.length * sqSize + (palette.length - 1) * sqGap;
      const startX = rightColX - totalPaletteW;
      const startY = rightBlockStartY;
      const hasBorder = album.paletteBorder !== false;
      const borderColor = album.paletteBorderColor || '#FFFFFF';
      const borderWidth = (0.45 * baseScale).toFixed(2);
      const borderRadius = (0.8 * baseScale).toFixed(2);
      const strokeAttr = hasBorder ? ` stroke="${borderColor}" stroke-width="${borderWidth}"` : '';

      const swatchesXml = palette
        .map((hex, i) => {
          const x = startX + i * (sqSize + sqGap);
          return `<rect id="Muestra_Color_${i + 1}" x="${x.toFixed(2)}" y="${startY.toFixed(2)}" width="${sqSize.toFixed(2)}" height="${sqSize.toFixed(2)}" rx="${borderRadius}" fill="${hex}" style="filter: drop-shadow(0px ${(0.5 * baseScale).toFixed(2)}px ${(0.8 * baseScale).toFixed(2)}px rgba(0,0,0,0.4));"${strokeAttr} />`;
        })
        .join('\n      ');

      paletteLayer = `
    <!-- CAPA 3: PALETA DE COLORES -->
    <g id="Capa_Paleta_Colores">
      ${swatchesXml}
    </g>`;
    }

    // --- CAPA 4: INFORMACIÓN DEL ÁLBUM (Artista, Título, Año, Duración) ---
    const artistColor = album.artistColor || album.titleColor || textColor || '#404040';
    const titleColor = album.titleColor || textColor || '#0a0a0a';

    const rawArtist = (album.artist || 'ARTISTA').toUpperCase();
    const rawTitle = album.uppercaseTitle
      ? (album.title || 'TÍTULO').toUpperCase()
      : album.title || 'TÍTULO';

    const paletteEndY = hasPalette ? rightBlockStartY + sqSize : rightBlockStartY;

    // 1. Artista (debajo de la paleta)
    const artistGap = (hasPalette ? 4.5 : 1.0) * baseScale;
    const artistTop = paletteEndY + artistGap;
    const baseArtistFontSize = (isSquarer ? 6.2 : 7.2) * baseScale;
    const artistMultiplier = album.artistFontSize ? (album.artistFontSize / 14) : 1;
    const artistFontSize = baseArtistFontSize * artistMultiplier;
    const artistBaselineY = artistTop + artistFontSize * 0.85;

    // 2. Título (debajo del artista con presencia editorial destacada)
    const isLongTitle = rawTitle.length > 18;
    const baseTitleFontSize = (isSquarer
      ? (isLongTitle ? 11.5 : 14.0)
      : (isLongTitle ? 13.5 : 16.5)) * baseScale;
    const fontMultiplier = album.titleFontSize ? album.titleFontSize / 24 : 1;
    const titleFontSize = baseTitleFontSize * fontMultiplier;
    const titleLineHeight = titleFontSize * 1.06;
    const titleLines = wrapText(rawTitle, isSquarer ? 13 : 15);

    const titleGap = 3.2 * baseScale;
    const titleTop = artistTop + artistFontSize + titleGap;

    let titleTextElements = '';
    titleLines.forEach((line, idx) => {
      const lineBaselineY = titleTop + titleFontSize * 0.88 + idx * titleLineHeight;
      titleTextElements += `<text x="${rightColX.toFixed(2)}" y="${lineBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="900" font-size="${titleFontSize.toFixed(2)}" fill="${titleColor}">${escapeXml(line)}</text>\n      `;
    });

    // 3. Fecha de Lanzamiento (Formato: Septiembre 07, 2026)
    const formattedDate = formatReleaseDate(album.releaseDate || '');
    const formattedDuration =
      album.totalDuration || calculateTotalDurationFromTracks(tracks);

    const titleTotalHeight = (titleLines.length - 1) * titleLineHeight + titleFontSize;
    const dateGap = 4.0 * baseScale;
    const dateTop = titleTop + titleTotalHeight + dateGap;
    const metaMultiplier = (album.metadataFontSize ?? 12) / 12;
    const dateFontSize = (isSquarer ? 7.8 : 9.2) * baseScale * metaMultiplier;
    const dateBaselineY = dateTop + dateFontSize * 0.85;

    // 4. Duración Total del Álbum (debajo de la fecha)
    const durationGap = 2.4 * baseScale;
    const durationTop = formattedDate ? dateTop + dateFontSize + durationGap : dateTop;
    const durationFontSize = (isSquarer ? 6.8 : 8.0) * baseScale * metaMultiplier;
    const durationBaselineY = durationTop + durationFontSize * 0.85;

    const albumInfoLayer = `
    <!-- CAPA 4: INFORMACIÓN DEL ÁLBUM -->
    <g id="Capa_Info_Album">
      <!-- Nombre del Artista -->
      <text x="${rightColX.toFixed(2)}" y="${artistBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="bold" font-size="${artistFontSize.toFixed(2)}" letter-spacing="${(0.8 * baseScale).toFixed(2)}" fill="${artistColor}">${escapeXml(rawArtist)}</text>
      <!-- Título Principal -->
      ${titleTextElements}
      <!-- Fecha de Lanzamiento -->
      ${formattedDate
        ? `<text x="${rightColX.toFixed(2)}" y="${dateBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="500" font-size="${dateFontSize.toFixed(2)}" letter-spacing="${(0.4 * baseScale).toFixed(2)}" fill="${album.releaseDateColor || artistColor}" opacity="0.9">${escapeXml(formattedDate)}</text>`
        : ''
      }
      <!-- Duración Total del Álbum -->
      ${formattedDuration
        ? `<text x="${rightColX.toFixed(2)}" y="${durationBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="normal" font-size="${durationFontSize.toFixed(2)}" fill="${album.durationColor || artistColor}" opacity="0.8">${escapeXml(formattedDuration)}</text>`
        : ''
      }
    </g>`;

    // --- CAPA 5: CÓDIGO ESCANEABLE DE SPOTIFY ---
    const codeMultiplier = (album.spotifyCodeSize ?? 30) / 32;
    const codeW = (isSquarer ? 76 : 90) * baseScale * codeMultiplier;
    const codeH = codeW * 0.25; // Proporción oficial 4:1
    const codeX = rightColX - codeW;
    const codeY = bottomLimit - codeH;
    const scaleX = codeW / 400;
    const scaleY = codeH / 100;

    const spotifyLayer = `
    <!-- CAPA 5: CÓDIGO SPOTIFY VECTORIAL -->
    <g id="Capa_Codigo_Spotify" transform="translate(${codeX.toFixed(2)}, ${codeY.toFixed(2)})">
      <g transform="scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})">
        ${rawSpotifySvg || `<rect width="400" height="100" fill="${spotifyColor}" rx="8"/>`}
      </g>
    </g>`;

    // --- CAPA 6: LISTA DE CANCIONES (TRACKLIST) ---
    const tracklistColor = album.tracklistColor || textColor || '#262626';

    const maxSafeSingleCol = isSquarer ? 8 : 10;
    const useTwoColumns =
      album.trackColumns === 2 ||
      (album.trackColumns !== 1 && tracks.length > maxSafeSingleCol);

    // Repartición de pistas: personalizada por el usuario o equilibrada 50/50
    const defaultHalf = Math.ceil(tracks.length / 2);
    const col1Count = useTwoColumns
      ? (album.col1TrackCount !== undefined && album.col1TrackCount > 0 && album.col1TrackCount < tracks.length
        ? album.col1TrackCount
        : defaultHalf)
      : tracks.length;

    const col1Tracks = useTwoColumns ? tracks.slice(0, col1Count) : tracks;
    const col2Tracks = useTwoColumns ? tracks.slice(col1Count) : [];

    const leftColW = contentW * 0.585;
    const colGap = (isSquarer ? 3.5 : 5.0) * baseScale;
    const colW = useTwoColumns ? (leftColW - colGap) / 2 : leftColW;
    const col1X = padX;
    const col2X = padX + colW + colGap;

    const maxColItems = Math.max(col1Tracks.length, col2Tracks.length);
    const baseTrackFontSize = (
      maxColItems > 13 ? 4.2 : maxColItems > 8 ? 4.6 : 5.4
    ) * baseScale;
    const trackMultiplier = album.tracklistFontSize ? (album.tracklistFontSize / 13) : 1;
    const trackFontSize = baseTrackFontSize * trackMultiplier;
    const trackLineSpacing = trackFontSize * 1.20;
    const trackItemGap = trackFontSize * (maxColItems > 13 ? 0.30 : maxColItems > 8 ? 0.36 : 0.50);

    const charsPerLine = useTwoColumns ? 24 : 44;

    const renderColumnTracks = (items: typeof tracks, startX: number) => {
      let currentY = lowerY + 2.5 * baseScale;
      let result = '';

      items.forEach((t) => {
        const rawTrackTitle = t.title || '';
        const lines = wrapText(rawTrackTitle, charsPerLine);
        lines.forEach((line, lineIdx) => {
          const lineUpper = line.toUpperCase();
          const displayString = lineIdx === 0 ? `${t.number}. ${lineUpper}` : `   ${lineUpper}`;
          result += `
          <text x="${startX.toFixed(2)}" y="${currentY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-size="${trackFontSize.toFixed(2)}" font-weight="bold" fill="${tracklistColor}">
            ${escapeXml(displayString)}
          </text>`;
          currentY += trackLineSpacing;
        });
        currentY += trackItemGap;
      });

      return result;
    };

    const tracklistLayer = `
    <!-- CAPA 6: LISTA DE CANCIONES (TRACKLIST) -->
    <g id="Capa_Lista_Canciones">
      <!-- Columna 1 -->
      <g id="Pistas_Columna_1">
        ${renderColumnTracks(col1Tracks, col1X)}
      </g>
      ${useTwoColumns && col2Tracks.length > 0
        ? `<!-- Columna 2 -->
      <g id="Pistas_Columna_2">
        ${renderColumnTracks(col2Tracks, col2X)}
      </g>`
        : ''
      }
    </g>`;

    const galleryContent = `${coverLayer}\n${paletteLayer}\n${albumInfoLayer}\n${tracklistLayer}\n${spotifyLayer}`;
    layersXml = isMdf
      ? `${bgLayer}\n    <!-- CONTENIDO CENTRADO PARA TABLA MDF -->\n    <g id="Contenido_Diseno_MDF" transform="translate(${bleedMm.toFixed(2)}, ${bleedMm.toFixed(2)})">\n${galleryContent}\n    </g>`
      : `${bgLayer}\n${galleryContent}`;
  } else if (config.template === 'album-classic') {
    const album = config.album;
    const tracks = album.tracks || [];
    const padX = width * 0.065;
    const padTop = width * (isUltraSquarer ? 0.018 : isSquarer ? 0.035 : 0.06);
    const padBottom = width * (isUltraSquarer ? 0.022 : isSquarer ? 0.03 : 0.038);
    const contentW = width - 2 * padX;
    const baseScale = contentW / 255.42;

    const needsCompactCover = tracks.length > 14 && isSquarer;
    const coverScale = needsCompactCover ? (isUltraSquarer ? 0.86 : 0.90) : 1.0;
    const coverSize = contentW * coverScale;
    const coverX = padX + (contentW - coverSize) / 2;
    const coverY = padTop;

    onProgress?.('Descargando trazados vectoriales de Spotify...');
    const spotifyColor = album.soundwaveColor || textColor || '#FFFFFF';
    const rawSpotifySvg = await fetchSpotifyCodeSvg(album.spotifyUri || '', spotifyColor);

    onProgress?.('Construyendo capas vectoriales para Illustrator...');

    // 1. Fondo
    const bgLayer = `
    <!-- CAPA 1: FONDO DE PAPEL Y ATMÓSFERA DIFUMINADA -->
    <g id="Capa_Fondo">
      <rect width="${totalSheetW}" height="${totalSheetH}" fill="${bgColor}" />
      ${blurredBgBase64
        ? `<image id="Fondo_Portada_Difuminado" href="${blurredBgBase64}" xlink:href="${blurredBgBase64}" x="0" y="0" width="${totalSheetW}" height="${totalSheetH}" preserveAspectRatio="xMidYMid slice" />`
        : ''
      }
    </g>`;

    // 2. Carátula
    const coverLayer = `
    <!-- CAPA 2: CARÁTULA DEL ÁLBUM -->
    <g id="Capa_Caratula">
      ${coverBase64
        ? `<image id="Caratula_Master" href="${coverBase64}" xlink:href="${coverBase64}" x="${coverX.toFixed(2)}" y="${coverY.toFixed(2)}" width="${coverSize.toFixed(2)}" height="${coverSize.toFixed(2)}" preserveAspectRatio="xMidYMid slice" />`
        : `<rect x="${coverX.toFixed(2)}" y="${coverY.toFixed(2)}" width="${coverSize.toFixed(2)}" height="${coverSize.toFixed(2)}" fill="#1a1a1a" />`
      }
    </g>`;

    // 3. Cabecera (Fila 1: Título y Paleta | Fila 2: Artista | Fila 3: Línea Divisoria)
    const titleColor = album.titleColor || textColor || '#FFFFFF';
    const artistColor = album.artistColor || textColor || '#E5E5E5';
    const tracklistColor = album.tracklistColor || textColor || '#CCCCCC';

    // Margen proporcional y limpio entre la carátula y el título
    const spaceBetweenCoverAndTitle = (isSquarer ? 8.5 : 10.5) * baseScale;
    const titleTop = coverY + coverSize + spaceBetweenCoverAndTitle;

    const rawTitle = album.uppercaseTitle !== false
      ? (album.title || 'THE DARK SIDE OF THE MOON').toUpperCase()
      : (album.title || 'The Dark Side of the Moon');
    const rawArtist = (album.artist || 'PINK FLOYD').toUpperCase();

    // Paleta de colores a la derecha en la fila superior (anclada al margen derecho completo)
    const hasPalette = album.showPalette !== false && album.palette && album.palette.length > 0;
    const pColors = hasPalette ? album.palette!.slice(0, 5) : [];
    const paletteMultiplier = (album.paletteSize ?? 24) / 24;
    const boxSize = (isSquarer ? 6.5 : 7.8) * baseScale * paletteMultiplier;
    const boxGap = (isSquarer ? 1.6 : 2.0) * baseScale;
    const totalPaletteW = pColors.length * boxSize + (pColors.length - 1) * boxGap;
    const startPaletteX = padX + contentW - totalPaletteW;

    const isLongTitle = rawTitle.length > 22;
    const baseTitleFontSize = (isSquarer
      ? (isLongTitle ? 11.5 : 13.5)
      : (isLongTitle ? 13.0 : 15.5)) * baseScale;
    const fontMultiplier = album.titleFontSize ? album.titleFontSize / 26 : 1;
    const titleFontSize = baseTitleFontSize * fontMultiplier;
    const titleLineHeight = titleFontSize * 1.1;

    // Con la paleta a la derecha en la misma fila, calculamos el ancho de línea de forma adaptativa según el espacio real y tamaño de letra
    const availableTitleW = hasPalette
      ? Math.max(contentW * 0.5, contentW - totalPaletteW - 4.0 * baseScale)
      : contentW;
    const approxCharW = Math.max(1, titleFontSize * 0.56);
    const dynamicMaxChars = Math.max(16, Math.floor(availableTitleW / approxCharW));
    const titleLines = wrapText(rawTitle, dynamicMaxChars);

    let titleTextElements = '';
    titleLines.forEach((line, idx) => {
      const lineBaselineY = titleTop + titleFontSize * 0.88 + idx * titleLineHeight;
      titleTextElements += `<text x="${padX.toFixed(2)}" y="${lineBaselineY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="900" font-size="${titleFontSize.toFixed(2)}" fill="${titleColor}">${escapeXml(line)}</text>\n      `;
    });

    const titleTotalH = (titleLines.length - 1) * titleLineHeight + titleFontSize;

    // Paleta en la fila superior (cuadros separados, redondeados, con sombra y borde configurable)
    let paletteSvg = '';
    if (hasPalette) {
      const paletteY = titleTop + (titleFontSize - boxSize) / 2;
      const hasBorder = album.paletteBorder !== false;
      const borderColor = album.paletteBorderColor || '#FFFFFF';
      const borderWidth = (0.45 * baseScale).toFixed(2);
      const borderRadius = (0.8 * baseScale).toFixed(2);
      const strokeAttr = hasBorder ? ` stroke="${borderColor}" stroke-width="${borderWidth}"` : '';

      paletteSvg = `
      <g id="Paleta_Colores">
        ${pColors.map((hex, i) => {
        const bx = startPaletteX + i * (boxSize + boxGap);
        return `<rect x="${bx.toFixed(2)}" y="${paletteY.toFixed(2)}" width="${boxSize.toFixed(2)}" height="${boxSize.toFixed(2)}" rx="${borderRadius}" fill="${hex}" style="filter: drop-shadow(0px ${(0.5 * baseScale).toFixed(2)}px ${(0.8 * baseScale).toFixed(2)}px rgba(0,0,0,0.4));"${strokeAttr} />`;
      }).join('')}
      </g>`;
    }

    // Fila inferior: Artista debajo del título (mt-0.5 en la plantilla)
    const spaceBetweenTitleAndArtist = (isSquarer ? 2.2 : 2.8) * baseScale;
    const artistTop = titleTop + titleTotalH + spaceBetweenTitleAndArtist;
    const baseArtistFontSize = (isSquarer ? 5.6 : 6.4) * baseScale;
    const artistMultiplier = album.artistFontSize ? (album.artistFontSize / 14) : 1;
    const artistFontSize = baseArtistFontSize * artistMultiplier;
    const artistBaselineY = artistTop + artistFontSize * 0.85;

    const headerLayer = `
    <!-- CAPA 3: CABECERA Y TÍTULO -->
    <g id="Capa_Cabecera">
      ${titleTextElements}
      ${paletteSvg}
      <text x="${padX.toFixed(2)}" y="${artistBaselineY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="bold" font-size="${artistFontSize.toFixed(2)}" letter-spacing="${(0.4 * baseScale).toFixed(2)}" fill="${artistColor}">
        ${escapeXml(rawArtist)}
      </text>
    </g>`;

    // 4. Línea Divisoria Horizontal Sutil (ancho completo de margen a margen)
    const dividerGap = (isSquarer ? 5.0 : 6.2) * baseScale;
    const dividerY = artistTop + artistFontSize + dividerGap;
    const dividerLayer = `
    <!-- CAPA 4: LÍNEA DIVISORIA -->
    <g id="Capa_Linea_Divisoria">
      <line x1="${padX.toFixed(2)}" y1="${dividerY.toFixed(2)}" x2="${(padX + contentW).toFixed(2)}" y2="${dividerY.toFixed(2)}" stroke="${titleColor}" stroke-width="${(0.4 * baseScale).toFixed(2)}" stroke-opacity="0.35" />
    </g>`;



    // 6. Tracklist en 2 Columnas (personalizada o equilibrada 50/50, expandida hacia la derecha)
    const defaultHalf = Math.ceil(tracks.length / 2);
    const col1Count =
      album.col1TrackCount !== undefined && album.col1TrackCount > 0 && album.col1TrackCount < tracks.length
        ? album.col1TrackCount
        : defaultHalf;
    const col1Tracks = tracks.slice(0, col1Count);
    const col2Tracks = tracks.slice(col1Count);

    const leftColW = contentW * 0.77;
    // Separación limpia entre columna 1 y columna 2 (equivalente a gap-x-3.5 en la plantilla)
    const colGap = (isSquarer ? 4.5 : 6.0) * baseScale;
    const colW = (leftColW - colGap) / 2;
    const col1X = padX;
    const col2X = padX + colW + colGap;

    // Tipografía proporcional idéntica a la plantilla (text-[12px] sm:text-[14px])
    const baseTrackFontSize = (tracks.length > 18
      ? (isSquarer ? 4.6 : 5.2)
      : tracks.length > 14
        ? (isSquarer ? 5.2 : 5.8)
        : tracks.length > 10
          ? (isSquarer ? 5.8 : 6.4)
          : (isSquarer ? 6.3 : 7.0)) * baseScale;
    const trackMultiplier = album.tracklistFontSize ? (album.tracklistFontSize / 13) : 1;
    const trackFontSize = baseTrackFontSize * trackMultiplier;
    const trackLineSpacing = trackFontSize * 1.20;

    // Altura de mayúsculas (capitales) para centrar la línea exactamente entre el artista y el inicio del texto
    const trackCapHeight = trackFontSize * 0.82;
    // Margen inferior bajo la línea idéntico al margen superior (dividerGap)
    const contentTopY = dividerY + dividerGap + trackCapHeight;
    const bottomTrackLimitY = height - padBottom;
    const availableTrackH = bottomTrackLimitY - contentTopY;
    const maxTracksInCol = Math.max(col1Tracks.length, col2Tracks.length, 1);

    // Espaciado dinámico vertical para aprovechar el alto disponible de las columnas
    const maxEstimatedH = maxTracksInCol * (trackLineSpacing * 1.22);
    const remainingH = Math.max(0, availableTrackH - maxEstimatedH);
    const trackItemGap = Math.max(
      1.2 * baseScale,
      Math.min(
        trackFontSize * 0.50,
        remainingH / Math.max(maxTracksInCol, 1)
      )
    );

    const renderTracksClassic = (items: typeof tracks, startX: number) => {
      let currentY = contentTopY;
      let result = '';

      items.forEach((t) => {
        const rawTrackTitle = t.title || '';
        // Ancho ampliado para títulos más largos antes de saltar de línea
        const maxChars = isSquarer ? 23 : 26;
        const lines = wrapText(rawTrackTitle, maxChars);
        const numLabel = `${t.number}. `;
        const numIndent = (t.number > 9 ? 9.5 : 7.5) * baseScale;

        lines.forEach((line, lineIdx) => {
          if (lineIdx === 0) {
            result += `
          <text x="${startX.toFixed(2)}" y="${currentY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-size="${trackFontSize.toFixed(2)}" font-weight="normal" fill="${tracklistColor}" opacity="0.6">
            ${escapeXml(numLabel)}
          </text>
          <text x="${(startX + numIndent).toFixed(2)}" y="${currentY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-size="${trackFontSize.toFixed(2)}" font-weight="600" fill="${tracklistColor}">
            ${escapeXml(line)}
          </text>`;
          } else {
            result += `
          <text x="${(startX + numIndent).toFixed(2)}" y="${currentY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-size="${trackFontSize.toFixed(2)}" font-weight="600" fill="${tracklistColor}">
            ${escapeXml(line)}
          </text>`;
          }
          currentY += trackLineSpacing;
        });
        currentY += trackItemGap;
      });

      return result;
    };

    const tracklistLayer = `
    <!-- CAPA 5: LISTA DE CANCIONES (2 COLUMNAS) -->
    <g id="Capa_Lista_Canciones">
      <g id="Pistas_Columna_1">
        ${renderTracksClassic(col1Tracks, col1X)}
      </g>
      <g id="Pistas_Columna_2">
        ${renderTracksClassic(col2Tracks, col2X)}
      </g>
    </g>`;

    // 7. Metadatos (Release Date y Album Length)
    const formattedDate = album.releaseDate ? formatReleaseDate(album.releaseDate) : '';
    const formattedDuration = album.totalDuration || calculateTotalDurationFromTracks(tracks) || '';

    const releaseDateColor = album.releaseDateColor || titleColor;
    const releaseDateLabelColor = album.releaseDateColor || artistColor;
    const durationColor = album.durationColor || titleColor;
    const durationLabelColor = album.durationColor || artistColor;

    const metaRightX = padX + contentW;
    let metaCurrentY = contentTopY;
    const metaMultiplier = (album.metadataFontSize ?? 12) / 12;
    const metaLabelSize = (isSquarer ? 3.9 : 4.4) * baseScale * metaMultiplier * 0.78;
    const metaValueSize = (isSquarer ? 6.2 : 7.2) * baseScale * metaMultiplier;

    let metadataItems = '';
    let lastMetaBottomY = contentTopY;
    if (formattedDate) {
      const labelBaselineY = metaCurrentY;
      const valueBaselineY = labelBaselineY + metaValueSize * 1.25;
      metadataItems += `
      <text x="${metaRightX.toFixed(2)}" y="${labelBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="bold" font-size="${metaLabelSize.toFixed(2)}" letter-spacing="${(0.5 * baseScale).toFixed(2)}" fill="${releaseDateLabelColor}" opacity="0.65">RELEASE DATE</text>
      <text x="${metaRightX.toFixed(2)}" y="${valueBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="900" font-size="${metaValueSize.toFixed(2)}" fill="${releaseDateColor}">${escapeXml(formattedDate)}</text>
      `;
      metaCurrentY = valueBaselineY + (isSquarer ? 6.5 : 8.0) * baseScale;
      lastMetaBottomY = valueBaselineY;
    }

    if (formattedDuration) {
      const labelBaselineY = metaCurrentY;
      const valueBaselineY = labelBaselineY + metaValueSize * 1.25;
      metadataItems += `
      <text x="${metaRightX.toFixed(2)}" y="${labelBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="bold" font-size="${metaLabelSize.toFixed(2)}" letter-spacing="${(0.5 * baseScale).toFixed(2)}" fill="${durationLabelColor}" opacity="0.65">ALBUM LENGTH</text>
      <text x="${metaRightX.toFixed(2)}" y="${valueBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="900" font-size="${metaValueSize.toFixed(2)}" fill="${durationColor}">${escapeXml(formattedDuration)}</text>
      `;
      lastMetaBottomY = valueBaselineY;
    }

    const metadataLayer = `
    <!-- CAPA 6: METADATOS (RELEASE DATE & ALBUM LENGTH) -->
    <g id="Capa_Metadatos">
      ${metadataItems}
    </g>`;

    // 8. Spotify Code directamente debajo de Album Length (sin espacio vacío excesivo)
    const baseCodeW = (isSquarer ? 54 : 60) * baseScale;
    const codeMultiplier = (album.spotifyCodeSize ?? 30) / 24;
    const codeW = baseCodeW * codeMultiplier;
    const codeH = codeW * 0.25;
    const codeX = padX + contentW - codeW;
    const spotifyGap = (isSquarer ? 4.5 : 6.0) * baseScale;
    const codeY = (formattedDate || formattedDuration)
      ? lastMetaBottomY + spotifyGap
      : contentTopY;
    const scaleX = codeW / 400;
    const scaleY = codeH / 100;

    const spotifyLayer = `
    <!-- CAPA 7: CÓDIGO SPOTIFY JUSTO DEBAJO DE LOS METADATOS -->
    <g id="Capa_Codigo_Spotify" transform="translate(${codeX.toFixed(2)}, ${codeY.toFixed(2)})">
      <g transform="scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})">
        ${rawSpotifySvg || `<rect width="400" height="100" fill="${spotifyColor}" rx="8"/>`}
      </g>
    </g>`;

    const classicContent = `${coverLayer}\n${headerLayer}\n${dividerLayer}\n${tracklistLayer}\n${metadataLayer}\n${spotifyLayer}`;
    layersXml = isMdf
      ? `${bgLayer}\n    <!-- CONTENIDO CENTRADO PARA TABLA MDF -->\n    <g id="Contenido_Diseno_MDF" transform="translate(${bleedMm.toFixed(2)}, ${bleedMm.toFixed(2)})">\n${classicContent}\n    </g>`
      : `${bgLayer}\n${classicContent}`;
  } else {
    // --- PLANTILLA SONG PLAYER ---
    const player = config.player;
    const pad = width * 0.065;
    const padTop = width * (isUltraSquarer ? 0.025 : isSquarer ? 0.045 : 0.07);
    const photoW = width - 2 * pad;
    const photoH = photoW;
    const photoX = pad;
    const photoY = padTop;
    const baseScale = photoW / 249.48;

    onProgress?.('Descargando trazados vectoriales de Spotify...');
    const spotifyColor = player.soundwaveColor || textColor || '#000000';
    const rawSpotifySvg = await fetchSpotifyCodeSvg(player.spotifyUri || '', spotifyColor);

    onProgress?.('Construyendo capas vectoriales para Illustrator...');

    const bgLayer = `
    <g id="Capa_Fondo">
      <rect width="${totalSheetW}" height="${totalSheetH}" fill="${bgColor}" />
      ${blurredBgBase64
        ? `<image id="Fondo_Portada_Difuminado" href="${blurredBgBase64}" xlink:href="${blurredBgBase64}" x="0" y="0" width="${totalSheetW}" height="${totalSheetH}" preserveAspectRatio="xMidYMid slice" />`
        : ''
      }
    </g>`;

    const coverLayer = `
    <g id="Capa_Foto_Reproductor">
      <clipPath id="Photo_Radius">
        <rect x="${photoX.toFixed(2)}" y="${photoY.toFixed(2)}" width="${photoW.toFixed(2)}" height="${photoH.toFixed(2)}" rx="${((player.coverBorderRadius || 8) * 0.5 * baseScale).toFixed(2)}" ry="${((player.coverBorderRadius || 8) * 0.5 * baseScale).toFixed(2)}" />
      </clipPath>
      ${coverBase64
        ? `<image href="${coverBase64}" xlink:href="${coverBase64}" x="${photoX.toFixed(2)}" y="${photoY.toFixed(2)}" width="${photoW.toFixed(2)}" height="${photoH.toFixed(2)}" clip-path="url(#Photo_Radius)" preserveAspectRatio="xMidYMid slice" />`
        : `<rect x="${photoX.toFixed(2)}" y="${photoY.toFixed(2)}" width="${photoW.toFixed(2)}" height="${photoH.toFixed(2)}" fill="#171717" clip-path="url(#Photo_Radius)" />`
      }
    </g>`;

    const titleColor = player.titleColor || textColor || '#FFFFFF';
    const artistColor = player.artistColor || textColor || '#D4D4D4';
    const contentStartY = photoY + photoH + 11.5 * baseScale;
    const playerTitleSize = 8.5 * baseScale;
    const playerArtistSize = 5.2 * baseScale;

    // Spotify Code alineado a la derecha de Título y Artista
    const codeMultiplier = player.spotifyCodeSize ? (player.spotifyCodeSize / 40) : 1;
    const codeW = 88 * baseScale * codeMultiplier;
    const codeH = codeW * 0.25;
    const codeX = width - pad - codeW;
    const codeY = contentStartY - 6.5 * baseScale;
    const scaleX = codeW / 400;
    const scaleY = codeH / 100;

    const spotifyLayer = `
    <g id="Capa_Codigo_Spotify" transform="translate(${codeX.toFixed(2)}, ${codeY.toFixed(2)})">
      <g transform="scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})">
        ${rawSpotifySvg || `<rect width="400" height="100" fill="${spotifyColor}" rx="8"/>`}
      </g>
    </g>`;

    const textLayer = `
    <g id="Capa_Titulo_Artista">
      <text x="${pad.toFixed(2)}" y="${contentStartY.toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="900" font-size="${playerTitleSize.toFixed(2)}" fill="${titleColor}" letter-spacing="0.2">${escapeXml((player.title || 'CANCIÓN').toUpperCase())}</text>
      <text x="${pad.toFixed(2)}" y="${(contentStartY + 6.8 * baseScale).toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="600" font-size="${playerArtistSize.toFixed(2)}" fill="${artistColor}" opacity="0.85">${escapeXml(player.artist || 'Artista')}</text>
    </g>`;

    // Línea de progreso de reproducción
    const barY = contentStartY + 14 * baseScale;
    const barH = 1.2 * baseScale;
    const progressWidth = (photoW * (player.progressPercent || 0)) / 100;

    const progressLayer = `
    <g id="Capa_Barra_Progreso">
      <rect x="${pad.toFixed(2)}" y="${barY.toFixed(2)}" width="${photoW.toFixed(2)}" height="${barH.toFixed(2)}" rx="${(barH / 2).toFixed(2)}" fill="${titleColor}" opacity="0.25" />
      <rect x="${pad.toFixed(2)}" y="${barY.toFixed(2)}" width="${progressWidth.toFixed(2)}" height="${barH.toFixed(2)}" rx="${(barH / 2).toFixed(2)}" fill="${titleColor}" />
      <circle cx="${(pad + progressWidth).toFixed(2)}" cy="${(barY + barH / 2).toFixed(2)}" r="${(1.6 * baseScale).toFixed(2)}" fill="${titleColor}" />
      <text x="${pad.toFixed(2)}" y="${(barY + 6.0 * baseScale).toFixed(2)}" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="600" font-size="${(4.8 * baseScale).toFixed(2)}" fill="${artistColor}" opacity="0.9">${escapeXml(player.currentTime || '0:58')}</text>
      <text x="${(width - pad).toFixed(2)}" y="${(barY + 6.0 * baseScale).toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="600" font-size="${(4.8 * baseScale).toFixed(2)}" fill="${artistColor}" opacity="0.9">${escapeXml(player.totalTime || '3:27')}</text>
    </g>`;

    // Controles de reproducción vectoriales
    const controlsY = barY + (isUltraSquarer ? 15.0 : 16.5) * baseScale;
    const iconColor = titleColor;
    const isPlaying = player.isPlaying !== false;
    const circleRadius = (isSquarer ? 8.5 : 9.5) * baseScale;
    const centerX = width / 2;

    const getContrastColor = (hexColor: string) => {
      if (!hexColor) return '#000000';
      const clean = hexColor.replace('#', '');
      if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        return (r * 299 + g * 587 + b * 114) >= 128 ? '#000000' : '#FFFFFF';
      }
      if (clean.length === 6) {
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) >= 128 ? '#000000' : '#FFFFFF';
      }
      return '#000000';
    };

    const circleInnerColor = getContrastColor(titleColor);

    const controlsLayer = `
    <g id="Capa_Controles_Reproduccion">
      <!-- 1. Shuffle (Izquierda extrema) -->
      <g transform="translate(${(pad + 2 * baseScale).toFixed(2)}, ${(controlsY - 4.5 * baseScale).toFixed(2)}) scale(${(0.42 * baseScale).toFixed(3)})">
        <path d="M16 3h5v5 M4 20L21 3 M21 16v5h-5 M15 15l6 6 M4 4l5 5" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- 2. Skip Back (Izquierda, bien separado del Play) -->
      <g transform="translate(${(centerX - 38 * baseScale).toFixed(2)}, ${(controlsY - 5.5 * baseScale).toFixed(2)}) scale(${(0.45 * baseScale).toFixed(3)})">
        <polygon points="19 20 9 12 19 4 19 20" fill="${iconColor}"/>
        <line x1="5" y1="19" x2="5" y2="5" stroke="${iconColor}" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- 3. Botón Central Circular de Play/Pausa (Centrado al 50%) -->
      <circle cx="${centerX.toFixed(2)}" cy="${controlsY.toFixed(2)}" r="${circleRadius.toFixed(2)}" fill="${titleColor}" />
      ${isPlaying
        ? `<!-- Icono Pausa (||) perfectamente simétrico -->
             <rect x="${(centerX - 3.0 * baseScale).toFixed(2)}" y="${(controlsY - 4.5 * baseScale).toFixed(2)}" width="${(2.0 * baseScale).toFixed(2)}" height="${(9.0 * baseScale).toFixed(2)}" rx="${(0.6 * baseScale).toFixed(2)}" fill="${circleInnerColor}" />
             <rect x="${(centerX + 1.0 * baseScale).toFixed(2)}" y="${(controlsY - 4.5 * baseScale).toFixed(2)}" width="${(2.0 * baseScale).toFixed(2)}" height="${(9.0 * baseScale).toFixed(2)}" rx="${(0.6 * baseScale).toFixed(2)}" fill="${circleInnerColor}" />`
        : `<!-- Icono Play (▶) matemáticamente centrado -->
             <polygon points="${(centerX - 2.8 * baseScale).toFixed(2)},${(controlsY - 4.8 * baseScale).toFixed(2)} ${(centerX + 4.8 * baseScale).toFixed(2)},${controlsY.toFixed(2)} ${(centerX - 2.8 * baseScale).toFixed(2)},${(controlsY + 4.8 * baseScale).toFixed(2)}" fill="${circleInnerColor}" />`
      }

      <!-- 4. Skip Forward (Derecha, bien separado del Play) -->
      <g transform="translate(${(centerX + 29 * baseScale).toFixed(2)}, ${(controlsY - 5.5 * baseScale).toFixed(2)}) scale(${(0.45 * baseScale).toFixed(3)})">
        <polygon points="5 4 15 12 5 20 5 4" fill="${iconColor}"/>
        <line x1="19" y1="5" x2="19" y2="19" stroke="${iconColor}" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- 5. Heart (Extremo Derecho Simétrico a Shuffle) -->
      <g transform="translate(${(width - pad - 6 * baseScale).toFixed(2)}, ${(controlsY - 4.5 * baseScale).toFixed(2)}) scale(${(0.42 * baseScale).toFixed(3)})">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" ${player.isLiked ? `fill="${titleColor}"` : 'fill="none"'} stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>`;

    // Paleta de colores en la parte inferior (5 Rectángulos como en la referencia)
    let paletteLayer = '';
    if (player.showPalette !== false) {
      const paletteColors = (player.palette && player.palette.length > 0
        ? player.palette
        : ['#D6C6B6', '#B0A296', '#696058', '#403A36', '#1E1B19']
      ).slice(0, 5);

      const paletteMultiplier = player.paletteSize ? (player.paletteSize / 14) : 1;
      const swatchH = (isSquarer ? 4.5 : 5.5) * baseScale * paletteMultiplier;
      const paletteY = height - pad - (isUltraSquarer ? 6.5 : isSquarer ? 5.5 : 5.5) * baseScale;
      const swatchGap = (isSquarer ? 2.2 : 2.8) * baseScale;
      const totalAvailableW = width - 2 * pad;
      const swatchW = (totalAvailableW - (paletteColors.length - 1) * swatchGap) / paletteColors.length;

      const swatchesXml = paletteColors
        .map((hex, i) => {
          const x = pad + i * (swatchW + swatchGap);
          return `<rect x="${x.toFixed(2)}" y="${paletteY.toFixed(2)}" width="${swatchW.toFixed(2)}" height="${swatchH.toFixed(2)}" rx="${(0.8 * baseScale).toFixed(2)}" fill="${hex}" />`;
        })
        .join('\n      ');

      paletteLayer = `
    <g id="Capa_Paleta_Colores">
      ${swatchesXml}
    </g>`;
    }

    const playerContent = `${coverLayer}\n${textLayer}\n${spotifyLayer}\n${progressLayer}\n${controlsLayer}${paletteLayer}`;
    layersXml = isMdf
      ? `${bgLayer}\n    <!-- CONTENIDO CENTRADO PARA TABLA MDF -->\n    <g id="Contenido_Diseno_MDF" transform="translate(${bleedMm.toFixed(2)}, ${bleedMm.toFixed(2)})">\n${playerContent}\n    </g>`
      : `${bgLayer}\n${playerContent}`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${totalSheetW} ${totalSheetH}"
  width="${totalSheetW}mm"
  height="${totalSheetH}mm"
  version="1.1"
>
  ${layersXml}
</svg>`;
}

/**
 * Convierte el SVG a un elemento del DOM para procesamiento con svg2pdf,
 * validando que no existan errores de sintaxis XML (parsererror).
 */
export async function generatePosterSvgElement(
  config: PosterConfig,
  printSize: PrintSize,
  onProgress?: ExportProgressCallback
): Promise<SVGSVGElement> {
  const svgString = await generatePosterSvgString(config, printSize, onProgress);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    const errorDetails = parserError.textContent || 'Error de parseo XML en el SVG';
    console.error('Error al parsear SVG:', errorDetails);
    throw new Error(`Error en el archivo SVG: ${errorDetails}`);
  }

  return doc.documentElement as unknown as SVGSVGElement;
}

/**
 * Dispara la descarga directa de un archivo .svg para Adobe Illustrator.
 */
export async function exportToSvg(
  config: PosterConfig,
  printSize: PrintSize,
  filename: string = 'poster-vectorial',
  onProgress?: ExportProgressCallback
): Promise<void> {
  try {
    onProgress?.('Generando código SVG compatible con Illustrator...');
    const svgString = await generatePosterSvgString(config, printSize, onProgress);

    onProgress?.('Preparando descarga de archivo SVG...');
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const finalDownloadName = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    link.download = finalDownloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    onProgress?.('¡Archivo SVG descargado con éxito!');
  } catch (err) {
    console.error('Error al exportar SVG:', err);
    throw err;
  }
}
