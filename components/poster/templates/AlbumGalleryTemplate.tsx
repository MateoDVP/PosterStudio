'use client';

import React from 'react';

import { AlbumData, PrintSize } from '@/types/poster';
import { SpotifyCode } from '../SpotifyCode';
import { formatReleaseDate, calculateTotalDurationFromTracks } from '@/lib/spotify';

interface AlbumGalleryTemplateProps {
  album: AlbumData;
  printSize: PrintSize;
  backgroundColor?: string;
  textColor?: string;
  enableBlurredBackground?: boolean;
  blurredBackgroundOpacity?: number;
  blurredBackgroundBlur?: number;
  blurredBackgroundOverlay?: 'dark' | 'light' | 'paper';
}

export const AlbumGalleryTemplate: React.FC<AlbumGalleryTemplateProps> = ({
  album,
  printSize,
  backgroundColor = '#FFFFFF',
  textColor = '#000000',
  enableBlurredBackground = false,
  blurredBackgroundOpacity = 0.65,
  blurredBackgroundBlur = 35,
  blurredBackgroundOverlay = 'dark',
}) => {
  const getSafeImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
      return url;
    }
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const tracks = album.tracks || [];
  const isUltraSquarer = printSize.aspectRatioRatio >= 0.81; // Ej: formatos cuadrados como 30x30 o 50x50
  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74; // Formato más cuadrado: 23x30 (0.767), 29.8x39.8 (0.75)
  const needsCompactCover = tracks.length > 14 && isSquarerFormat;

  // Límite seguro de canciones en 1 columna antes de pasar a 2 columnas
  const maxSafeSingleCol = isSquarerFormat ? 8 : 10;

  const useTwoColumns =
    album.trackColumns === 2 ||
    (album.trackColumns !== 1 && tracks.length > maxSafeSingleCol);

  // Repartir pistas: según la configuración del usuario en el panel o equilibrada 50/50
  const defaultHalf = Math.ceil(tracks.length / 2);
  const col1Count = useTwoColumns
    ? (album.col1TrackCount !== undefined && album.col1TrackCount > 0 && album.col1TrackCount < tracks.length
      ? album.col1TrackCount
      : defaultHalf)
    : tracks.length;

  const col1Tracks = useTwoColumns ? tracks.slice(0, col1Count) : tracks;
  const col2Tracks = useTwoColumns ? tracks.slice(col1Count) : [];

  const maxColTracks = Math.max(col1Tracks.length, col2Tracks.length);

  // Tipografía y espaciado adaptativo según la densidad de pistas para garantizar que nunca se corten
  const getAdaptiveStyles = () => {
    if (album.tracklistFontSize) {
      return {
        fontSizeClass: '',
        spaceClass: tracks.length > 14
          ? (isUltraSquarer ? 'space-y-[1.5px] sm:space-y-[2px]' : 'space-y-[2px] sm:space-y-[2.5px]')
          : 'space-y-[3.5px] sm:space-y-[4.5px]',
      };
    }
    if (maxColTracks > 13) {
      return {
        fontSizeClass: isUltraSquarer ? 'text-[7px] sm:text-[8px]' : 'text-[7.5px] sm:text-[8.5px]',
        spaceClass: 'space-y-[1px] sm:space-y-[1.5px]',
      };
    }
    if (tracks.length > 14 || maxColTracks > 8) {
      return {
        fontSizeClass: isUltraSquarer ? 'text-[8px] sm:text-[9px]' : 'text-[8.5px] sm:text-[9.5px]',
        spaceClass: isUltraSquarer ? 'space-y-[1.5px] sm:space-y-[2px]' : 'space-y-[2px] sm:space-y-[2.5px]',
      };
    }
    return {
      fontSizeClass: 'text-[9.5px] sm:text-[11px]',
      spaceClass: 'space-y-[3.5px] sm:space-y-[4.5px]',
    };
  };

  const { fontSizeClass, spaceClass } = getAdaptiveStyles();

  const titleColor = album.titleColor || textColor || '#0a0a0a';
  const artistColor = album.artistColor || album.titleColor || textColor || '#404040';
  const tracklistColor = album.tracklistColor || textColor || '#262626';

  return (
    <div
      className="w-full h-full flex-1 flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isUltraSquarer
          ? '1.8% 6.5% 2.8% 6.5%'
          : isSquarerFormat
            ? '3.5% 6.5% 5% 6.5%'
            : '6% 6.5% 8% 6.5%',
      }}
    >
      {/* Capa de fondo con portada desenfocada ambiental */}
      {enableBlurredBackground && album.coverUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <img
            src={getSafeImageUrl(album.coverUrl)}
            alt="Fondo desenfocado del álbum"
            crossOrigin="anonymous"
            className="w-full h-full object-cover scale-125"
            style={{
              filter: `blur(${blurredBackgroundBlur}px)`,
              opacity: blurredBackgroundOpacity,
            }}
          />
          {blurredBackgroundOverlay === 'dark' ? (
            <div className="absolute inset-0 bg-black/40" />
          ) : blurredBackgroundOverlay === 'light' ? (
            <div className="absolute inset-0 bg-white/40" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: backgroundColor || '#000000',
                opacity: 0.35,
              }}
            />
          )}
        </div>
      )}

      {/* 1. SECCIÓN SUPERIOR: Carátula del Álbum (Cuadrada 1:1, centrada con fino marco de aire si hay más de 14 pistas) */}
      <div className="w-full flex justify-center items-center flex-shrink-0">
        <div
          className="aspect-square relative z-10 bg-neutral-100 shadow-sm overflow-hidden transition-all duration-300"
          style={{
            width: needsCompactCover ? `${isUltraSquarer ? 86 : 90}%` : '100%',
          }}
        >
          {album.coverUrl ? (
            <img
              src={getSafeImageUrl(album.coverUrl)}
              alt={album.title}
              crossOrigin="anonymous"
              className="w-full h-full object-cover block"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 border border-dashed border-neutral-300">
              <span className="text-sm font-medium">Sin carátula</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SECCIÓN INFERIOR: Lista de canciones y tipografía / Código Spotify */}
      <div
        className="w-full flex-1 flex justify-between items-stretch gap-1.5 sm:gap-2 relative z-10 pt-2.5 sm:pt-3.5 min-h-0"
      >
        {/* Columna Izquierda: Lista numerada de canciones (aprovecha el ancho con padding mínimo) */}
        <div className="w-[59%] max-w-[59%] min-w-0 pr-0.5">
          {tracks.length > 0 ? (
            <div className={`grid ${useTwoColumns ? 'grid-cols-2 gap-x-2.5 sm:gap-x-3.5' : 'grid-cols-1'} gap-y-[2px]`}>
              {/* Columna 1 de canciones */}
              <div className={spaceClass}>
                {col1Tracks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-start tracking-normal uppercase ${fontSizeClass} leading-[1.22]`}
                    style={{
                      color: tracklistColor,
                      fontSize: album.tracklistFontSize ? `${album.tracklistFontSize}px` : undefined,
                    }}
                  >
                    <span className="font-normal mr-1.5 opacity-60 tabular-nums select-none flex-shrink-0">
                      {t.number}.
                    </span>
                    <span className="font-semibold break-words min-w-0 flex-1">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Columna 2 de canciones */}
              {useTwoColumns && (
                <div className={spaceClass}>
                  {col2Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start tracking-normal uppercase ${fontSizeClass} leading-[1.22]`}
                      style={{
                        color: tracklistColor,
                        fontSize: album.tracklistFontSize ? `${album.tracklistFontSize}px` : undefined,
                      }}
                    >
                      <span className="font-normal mr-1.5 opacity-60 tabular-nums select-none flex-shrink-0">
                        {t.number}.
                      </span>
                      <span className="font-semibold break-words min-w-0 flex-1">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-neutral-400 uppercase tracking-widest pt-1">
              Lista de pistas
            </div>
          )}
        </div>

        {/* Columna Derecha: Información del Álbum + Código Spotify abajo (40% de ancho para títulos amplios) */}
        <div className="w-[40%] min-w-[145px] max-w-[40%] h-full flex flex-col justify-between items-end text-right flex-shrink-0 pl-0.5">

          {/* Bloque Superior: Información del Álbum */}
          <div className="w-full flex flex-col items-end text-right">
            {/* Paleta de Colores del Álbum (5 Cuadros con sombra y borde configurable) */}
            {album.showPalette !== false && album.palette && album.palette.length > 0 && (
              <div className="flex items-center justify-end gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
                {album.palette.slice(0, 5).map((colorHex, idx) => {
                  const size = album.paletteSize ?? 24;
                  const hasBorder = album.paletteBorder !== false;
                  const borderColor = album.paletteBorderColor || '#FFFFFF';

                  return (
                    <div
                      key={`${colorHex}-${idx}`}
                      className="flex-shrink-0 rounded-[3px] transition-transform duration-200"
                      style={{
                        backgroundColor: colorHex,
                        width: `${size}px`,
                        height: `${size}px`,
                        border: hasBorder ? `1.5px solid ${borderColor}` : 'none',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.25)',
                      }}
                      title={colorHex}
                    />
                  );
                })}
              </div>
            )}

            {/* Nombre del Artista */}
            <div
              className={`font-bold uppercase tracking-[0.2em] mb-1 ${album.artistFontSize ? '' : 'text-[9.5px] sm:text-[11.5px]'
                }`}
              style={{
                color: artistColor,
                fontSize: album.artistFontSize ? `${album.artistFontSize}px` : undefined,
              }}
            >
              {album.artist || 'ARTISTA'}
            </div>

            {/* Título Principal del Álbum */}
            <h1
              className={`font-black tracking-tight leading-[1.04] text-right ${album.titleFontSize
                ? ''
                : isSquarerFormat
                  ? album.title.length > 20
                    ? 'text-base sm:text-lg'
                    : 'text-lg sm:text-2xl'
                  : album.title.length > 20
                    ? 'text-xl sm:text-2xl'
                    : 'text-2xl sm:text-3xl'
                } ${album.uppercaseTitle ? 'uppercase' : ''}`}
              style={{
                color: titleColor,
                fontSize: album.titleFontSize ? `${album.titleFontSize}px` : undefined,
                wordBreak: 'break-word',
              }}
            >
              {album.title || 'TÍTULO DEL ÁLBUM'}
            </h1>

            {/* Fecha / Año de Lanzamiento */}
            {album.releaseDate && (
              <div
                className="font-medium tracking-wider mt-1.5"
                style={{
                  color: album.releaseDateColor || artistColor,
                  opacity: 0.9,
                  fontSize: `${album.metadataFontSize ?? 12}px`,
                }}
              >
                {formatReleaseDate(album.releaseDate)}
              </div>
            )}

            {/* Duración Total del Álbum */}
            {(album.totalDuration || calculateTotalDurationFromTracks(tracks)) && (
              <div
                className="font-normal mt-0.5"
                style={{
                  color: album.durationColor || artistColor,
                  opacity: 0.8,
                  fontSize: `${album.metadataFontSize ?? 12}px`,
                }}
              >
                {album.totalDuration || calculateTotalDurationFromTracks(tracks)}
              </div>
            )}
          </div>

          {/* Código Scannable de Spotify */}
          <div
            className="flex items-center justify-end flex-shrink-0 mt-auto pt-1 self-end"
            style={{
              height: `${album.spotifyCodeSize ?? 30}px`,
              width: `${Math.round((album.spotifyCodeSize ?? 30) * 4)}px`,
              aspectRatio: '4 / 1',
            }}
          >
            <SpotifyCode
              uri={album.spotifyUri || 'spotify:album:3RQQmkQEvNCY4prGKE6oc5'}
              color={album.soundwaveColor || textColor || '#000000'}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
