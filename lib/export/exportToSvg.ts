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
  const width = printSize.widthMm;
  const height = printSize.heightMm;
  const isSquarer = printSize.aspectRatioRatio >= 0.74;

  const bgColor = config.backgroundColor || '#FFFFFF';
  const textColor = config.textColor || '#000000';

  onProgress?.('Incrustando carátula en alta definición...');
  const activeCoverUrl =
    config.template === 'album-gallery' ? config.album.coverUrl : config.player.coverUrl;
  const coverBase64 = activeCoverUrl ? await convertImageToBase64(activeCoverUrl) : '';

  // Generar atmósfera de fondo difuminada si está activa
  let blurredBgBase64 = '';
  if (config.enableBlurredBackground && activeCoverUrl) {
    onProgress?.('Generando atmósfera de portada difuminada...');
    blurredBgBase64 = await createBlurredBackgroundDataUrl(
      activeCoverUrl,
      width,
      height,
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
    const pad = width * (isSquarer ? 0.055 : 0.07);
    const contentW = width - 2 * pad;
    const baseScale = contentW / 255.42;
    const coverSize = contentW;
    const coverX = pad;
    const coverY = pad;

    const lowerY = coverY + coverSize + (isSquarer ? 7 : 9) * baseScale;
    const bottomLimit = height - pad;
    const rightColX = width - pad;

    onProgress?.('Descargando trazados vectoriales de Spotify...');
    const spotifyColor = album.soundwaveColor || textColor || '#000000';
    const rawSpotifySvg = await fetchSpotifyCodeSvg(album.spotifyUri || '', spotifyColor);

    onProgress?.('Construyendo capas vectoriales para Illustrator...');

    // --- CAPA 1: FONDO DE PAPEL Y ATMÓSFERA ---
    const bgLayer = `
    <!-- CAPA 1: FONDO DE PAPEL Y ATMÓSFERA DIFUMINADA -->
    <g id="Capa_Fondo">
      <rect width="${width}" height="${height}" fill="${bgColor}" />
      ${blurredBgBase64
        ? `<image id="Fondo_Portada_Difuminado" href="${blurredBgBase64}" xlink:href="${blurredBgBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />`
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
    const sqSize = (isSquarer ? 8.5 : 10.0) * baseScale;
    const sqGap = (isSquarer ? 2.2 : 2.5) * baseScale;

    const rightBlockStartY = lowerY + 2.0 * baseScale;
    const hasPalette =
      album.showPalette !== false && album.palette && album.palette.length > 0;

    if (hasPalette && album.palette) {
      const palette = album.palette.slice(0, 5);
      const totalPaletteW = palette.length * sqSize + (palette.length - 1) * sqGap;
      const startX = rightColX - totalPaletteW;
      const startY = rightBlockStartY;

      const swatchesXml = palette
        .map((hex, i) => {
          const x = startX + i * (sqSize + sqGap);
          return `<rect id="Muestra_Color_${i + 1}" x="${x.toFixed(2)}" y="${startY.toFixed(2)}" width="${sqSize.toFixed(2)}" height="${sqSize.toFixed(2)}" fill="${hex}" stroke="rgba(0,0,0,0.15)" stroke-width="${(0.3 * baseScale).toFixed(2)}" />`;
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
    const artistGap = (hasPalette ? 3.5 : 0.5) * baseScale;
    const artistTop = paletteEndY + artistGap;
    const artistFontSize = (isSquarer ? 4.4 : 5.0) * baseScale;
    const artistBaselineY = artistTop + artistFontSize * 0.85;

    // 2. Título (debajo del artista con separación garantizada)
    const isLongTitle = rawTitle.length > 18;
    const titleFontSize = (isSquarer
      ? (isLongTitle ? 7.6 : 9.4)
      : (isLongTitle ? 9.0 : 11.5)) * baseScale;
    const titleLineHeight = titleFontSize * 1.10;
    const titleLines = wrapText(rawTitle, isSquarer ? 15 : 17);

    const titleGap = 2.8 * baseScale;
    const titleTop = artistTop + artistFontSize + titleGap;

    let titleTextElements = '';
    titleLines.forEach((line, idx) => {
      const lineBaselineY = titleTop + titleFontSize * 0.88 + idx * titleLineHeight;
      titleTextElements += `<text x="${rightColX.toFixed(2)}" y="${lineBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="bold" font-size="${titleFontSize.toFixed(2)}" fill="${titleColor}">${escapeXml(line)}</text>\n      `;
    });

    // 3. Fecha de Lanzamiento (Formato: Septiembre 07, 2026)
    const formattedDate = formatReleaseDate(album.releaseDate || '');
    const formattedDuration =
      album.totalDuration || calculateTotalDurationFromTracks(tracks);

    const titleTotalHeight = (titleLines.length - 1) * titleLineHeight + titleFontSize;
    const dateGap = 2.4 * baseScale;
    const dateTop = titleTop + titleTotalHeight + dateGap;
    const dateFontSize = (isSquarer ? 3.8 : 4.4) * baseScale;
    const dateBaselineY = dateTop + dateFontSize * 0.85;

    // 4. Duración Total del Álbum (debajo de la fecha)
    const durationGap = 1.6 * baseScale;
    const durationTop = formattedDate ? dateTop + dateFontSize + durationGap : dateTop;
    const durationFontSize = (isSquarer ? 3.4 : 3.8) * baseScale;
    const durationBaselineY = durationTop + durationFontSize * 0.85;

    const albumInfoLayer = `
    <!-- CAPA 4: INFORMACIÓN DEL ÁLBUM -->
    <g id="Capa_Info_Album">
      <!-- Nombre del Artista -->
      <text x="${rightColX.toFixed(2)}" y="${artistBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="bold" font-size="${artistFontSize.toFixed(2)}" letter-spacing="${(0.5 * baseScale).toFixed(2)}" fill="${artistColor}">${escapeXml(rawArtist)}</text>
      <!-- Título Principal -->
      ${titleTextElements}
      <!-- Fecha de Lanzamiento -->
      ${formattedDate
        ? `<text x="${rightColX.toFixed(2)}" y="${dateBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="normal" font-size="${dateFontSize.toFixed(2)}" letter-spacing="${(0.4 * baseScale).toFixed(2)}" fill="${artistColor}" opacity="0.85">${escapeXml(formattedDate)}</text>`
        : ''
      }
      <!-- Duración Total del Álbum -->
      ${formattedDuration
        ? `<text x="${rightColX.toFixed(2)}" y="${durationBaselineY.toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', Helvetica, Arial, sans-serif" font-weight="normal" font-size="${durationFontSize.toFixed(2)}" letter-spacing="${(0.4 * baseScale).toFixed(2)}" fill="${artistColor}" opacity="0.75">${escapeXml(formattedDuration)}</text>`
        : ''
      }
    </g>`;

    // --- CAPA 5: CÓDIGO ESCANEABLE DE SPOTIFY ---
    const codeW = (isSquarer ? 76 : 92) * baseScale;
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

    const maxSafePerCol = isSquarer ? 9 : 15;
    const useTwoColumns =
      album.trackColumns === 2 ||
      (album.trackColumns !== 1 && tracks.length > maxSafePerCol);

    const col1Count = useTwoColumns
      ? Math.min(tracks.length - 1, Math.max(Math.ceil(tracks.length / 2), Math.min(maxSafePerCol, tracks.length - 1)))
      : tracks.length;

    const col1Tracks = tracks.slice(0, col1Count);
    const col2Tracks = useTwoColumns ? tracks.slice(col1Count) : [];

    const leftColW = contentW * 0.54;
    const colGap = 4 * baseScale;
    const colW = useTwoColumns ? (leftColW - colGap) / 2 : leftColW;
    const col1X = pad;
    const col2X = pad + colW + colGap;

    const trackFontSize = (tracks.length > 12 ? (isSquarer ? 3.6 : 4.0) : (isSquarer ? 4.2 : 4.8)) * baseScale;
    const trackLineSpacing = trackFontSize * 1.22;
    const trackItemGap = trackFontSize * 0.22;

    const renderColumnTracks = (items: typeof tracks, startX: number) => {
      let currentY = lowerY + 2.5 * baseScale;
      let result = '';

      items.forEach((t) => {
        const rawTrackTitle = t.title || '';
        const lines = wrapText(rawTrackTitle, useTwoColumns ? 18 : 36);
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

    layersXml = `${bgLayer}\n${coverLayer}\n${paletteLayer}\n${albumInfoLayer}\n${tracklistLayer}\n${spotifyLayer}`;
  } else {
    // --- PLANTILLA SONG PLAYER ---
    const player = config.player;
    const pad = width * (isSquarer ? 0.055 : 0.075);
    const photoW = width - 2 * pad;
    const photoH = photoW;
    const photoX = pad;
    const photoY = pad;
    const baseScale = photoW / 249.48;

    onProgress?.('Descargando trazados vectoriales de Spotify...');
    const spotifyColor = player.soundwaveColor || textColor || '#000000';
    const rawSpotifySvg = await fetchSpotifyCodeSvg(player.spotifyUri || '', spotifyColor);

    onProgress?.('Construyendo capas vectoriales para Illustrator...');

    const bgLayer = `
    <g id="Capa_Fondo">
      <rect width="${width}" height="${height}" fill="${bgColor}" />
      ${blurredBgBase64
        ? `<image id="Fondo_Portada_Difuminado" href="${blurredBgBase64}" xlink:href="${blurredBgBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />`
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
    const codeW = 68 * baseScale;
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

    // Barra de reproducción y tiempos
    const barY = contentStartY + 16.5 * baseScale;
    const barW = width - 2 * pad;
    const progressPercent = Math.min(1, Math.max(0, (player.progressPercent || 30) / 100));
    const fillW = barW * progressPercent;
    const playerTimeSize = 3.6 * baseScale;

    const progressLayer = `
    <g id="Capa_Barra_Progreso">
      <!-- Barra fondo -->
      <rect x="${pad.toFixed(2)}" y="${barY.toFixed(2)}" width="${barW.toFixed(2)}" height="${(1.8 * baseScale).toFixed(2)}" rx="${(0.9 * baseScale).toFixed(2)}" fill="${titleColor}" opacity="0.2" />
      <!-- Barra activa -->
      <rect x="${pad.toFixed(2)}" y="${barY.toFixed(2)}" width="${fillW.toFixed(2)}" height="${(1.8 * baseScale).toFixed(2)}" rx="${(0.9 * baseScale).toFixed(2)}" fill="${titleColor}" />
      <!-- Perilla circular -->
      <circle cx="${(pad + fillW).toFixed(2)}" cy="${(barY + 0.9 * baseScale).toFixed(2)}" r="${(2.2 * baseScale).toFixed(2)}" fill="${titleColor}" />
      <!-- Tiempos -->
      <text x="${pad.toFixed(2)}" y="${(barY + 6.2 * baseScale).toFixed(2)}" font-family="'Montserrat', 'Inter', monospace" font-weight="500" font-size="${playerTimeSize.toFixed(2)}" fill="${artistColor}" opacity="0.8">${escapeXml(player.currentTime || '0:58')}</text>
      <text x="${(pad + barW).toFixed(2)}" y="${(barY + 6.2 * baseScale).toFixed(2)}" text-anchor="end" font-family="'Montserrat', 'Inter', monospace" font-weight="500" font-size="${playerTimeSize.toFixed(2)}" fill="${artistColor}" opacity="0.8">${escapeXml(player.totalTime || '3:27')}</text>
    </g>`;

    // Controles de reproducción vectoriales
    const controlsY = barY + 16.5 * baseScale;
    const iconColor = titleColor;
    const isPlaying = player.isPlaying !== false;
    const circleRadius = 7.5 * baseScale;
    const centerX = width / 2;

    const isLightBg =
      bgColor === '#FFFFFF' ||
      bgColor.toLowerCase() === '#fff' ||
      bgColor.toLowerCase() === 'white' ||
      (bgColor.startsWith('#') &&
        bgColor.length === 7 &&
        parseInt(bgColor.slice(1, 3), 16) * 0.299 +
          parseInt(bgColor.slice(3, 5), 16) * 0.587 +
          parseInt(bgColor.slice(5, 7), 16) * 0.114 >
          180);
    const circleInnerColor = isLightBg ? '#FFFFFF' : '#000000';

    const controlsLayer = `
    <g id="Capa_Controles_Reproduccion">
      <!-- 1. Shuffle (Izquierda extrema) -->
      <g transform="translate(${(pad + 2 * baseScale).toFixed(2)}, ${(controlsY - 4 * baseScale).toFixed(2)}) scale(${(0.35 * baseScale).toFixed(3)})">
        <path d="M16 3h5v5 M4 20L21 3 M21 16v5h-5 M15 15l6 6 M4 4l5 5" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- 2. Skip Back (Izquierda) -->
      <g transform="translate(${(centerX - 24 * baseScale).toFixed(2)}, ${(controlsY - 4.5 * baseScale).toFixed(2)}) scale(${(0.38 * baseScale).toFixed(3)})">
        <polygon points="19 20 9 12 19 4 19 20" fill="${iconColor}"/>
        <line x1="5" y1="19" x2="5" y2="5" stroke="${iconColor}" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- 3. Botón Central Circular de Play/Pausa -->
      <circle cx="${centerX.toFixed(2)}" cy="${controlsY.toFixed(2)}" r="${circleRadius.toFixed(2)}" fill="${titleColor}" />
      ${
        isPlaying
          ? `<!-- Icono Pausa (||) perfectamente simétrico -->
             <rect x="${(centerX - 2.5 * baseScale).toFixed(2)}" y="${(controlsY - 3.8 * baseScale).toFixed(2)}" width="${(1.8 * baseScale).toFixed(2)}" height="${(7.6 * baseScale).toFixed(2)}" rx="${(0.5 * baseScale).toFixed(2)}" fill="${circleInnerColor}" />
             <rect x="${(centerX + 0.7 * baseScale).toFixed(2)}" y="${(controlsY - 3.8 * baseScale).toFixed(2)}" width="${(1.8 * baseScale).toFixed(2)}" height="${(7.6 * baseScale).toFixed(2)}" rx="${(0.5 * baseScale).toFixed(2)}" fill="${circleInnerColor}" />`
          : `<!-- Icono Play (▶) matemáticamente centrado -->
             <polygon points="${(centerX - 2.2 * baseScale).toFixed(2)},${(controlsY - 3.8 * baseScale).toFixed(2)} ${(centerX + 3.8 * baseScale).toFixed(2)},${controlsY.toFixed(2)} ${(centerX - 2.2 * baseScale).toFixed(2)},${(controlsY + 3.8 * baseScale).toFixed(2)}" fill="${circleInnerColor}" />`
      }

      <!-- 4. Skip Forward (Derecha) -->
      <g transform="translate(${(centerX + 15 * baseScale).toFixed(2)}, ${(controlsY - 4.5 * baseScale).toFixed(2)}) scale(${(0.38 * baseScale).toFixed(3)})">
        <polygon points="5 4 15 12 5 20 5 4" fill="${iconColor}"/>
        <line x1="19" y1="5" x2="19" y2="19" stroke="${iconColor}" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- 5. Repeat (Derecha) -->
      <g transform="translate(${(width - pad - 18 * baseScale).toFixed(2)}, ${(controlsY - 4 * baseScale).toFixed(2)}) scale(${(0.35 * baseScale).toFixed(3)})">
        <polyline points="17 1 21 5 17 9" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round"/>
        <polyline points="7 23 3 19 7 15" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round"/>
      </g>

      <!-- 6. Heart (Extremo Derecho) -->
      <g transform="translate(${(width - pad - 8 * baseScale).toFixed(2)}, ${(controlsY - 4 * baseScale).toFixed(2)}) scale(${(0.35 * baseScale).toFixed(3)})">
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

      const paletteY = height - pad - (isSquarer ? 4.5 : 5.5) * baseScale;
      const swatchH = (isSquarer ? 4.5 : 5.5) * baseScale;
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

    layersXml = `${bgLayer}\n${coverLayer}\n${textLayer}\n${spotifyLayer}\n${progressLayer}\n${controlsLayer}${paletteLayer}`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${width} ${height}"
  width="${width}mm"
  height="${height}mm"
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
    link.download = `${filename}-${printSize.id}-illustrator.svg`;
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
