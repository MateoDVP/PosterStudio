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
  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74; // Formato más cuadrado: 30x40 cm (0.75) vs Serie A ISO (0.707)

  // Límite seguro de canciones por columna para garantizar que NUNCA se corten
  const maxSafePerCol = isSquarerFormat ? 9 : 15;

  const useTwoColumns =
    album.trackColumns === 2 ||
    (album.trackColumns !== 1 && tracks.length > maxSafePerCol);

  // Cuando llega al límite seguro de canciones, el excedente pasa a la segunda columna
  const col1Count = useTwoColumns
    ? Math.min(tracks.length - 1, Math.max(Math.ceil(tracks.length / 2), Math.min(maxSafePerCol, tracks.length - 1)))
    : tracks.length;

  const col1Tracks = tracks.slice(0, col1Count);
  const col2Tracks = useTwoColumns ? tracks.slice(col1Count) : [];

  const titleColor = album.titleColor || textColor || '#0a0a0a';
  const artistColor = album.artistColor || album.titleColor || textColor || '#404040';
  const tracklistColor = album.tracklistColor || textColor || '#262626';

  return (
    <div
      className="w-full h-full flex-1 flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isSquarerFormat ? '5.5% 6%' : '7%',
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

      {/* 1. SECCIÓN SUPERIOR: Carátula cuadrada en Ultra-HD */}
      <div className="w-full aspect-square relative z-10 flex-shrink-0 bg-neutral-100 shadow-sm overflow-hidden">
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

      {/* 2. SECCIÓN INFERIOR: Lista de canciones y tipografía / Código Spotify */}
      <div
        className="w-full flex-1 flex justify-between items-stretch gap-2.5 sm:gap-3.5 relative z-10 pt-2.5 sm:pt-3.5 min-h-0"
      >
        {/* Columna Izquierda: Lista numerada de canciones */}
        <div className="w-[53%] max-w-[53%] min-w-0 pr-1.5">
          {tracks.length > 0 ? (
            <div className={`grid ${useTwoColumns ? 'grid-cols-2 gap-x-2 sm:gap-x-3' : 'grid-cols-1'} gap-y-[2px]`}>
              {/* Columna 1 de canciones */}
              <div className={tracks.length > 14 ? 'space-y-[3px] sm:space-y-[4px]' : 'space-y-[4.5px] sm:space-y-[6px]'}>
                {col1Tracks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-start tracking-normal uppercase ${tracks.length > 14 ? 'text-[8.5px] sm:text-[9.5px]' : 'text-[9.5px] sm:text-[11px]'
                      } leading-[1.25]`}
                    style={{ color: tracklistColor }}
                  >
                    <span className="font-normal mr-1 opacity-60 tabular-nums select-none flex-shrink-0">
                      {t.number}.
                    </span>
                    <span className="font-semibold break-words">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Columna 2 de canciones */}
              {useTwoColumns && (
                <div className={tracks.length > 14 ? 'space-y-[3px] sm:space-y-[4px]' : 'space-y-[4.5px] sm:space-y-[6px]'}>
                  {col2Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start tracking-normal uppercase ${tracks.length > 14 ? 'text-[8.5px] sm:text-[9.5px]' : 'text-[9.5px] sm:text-[11px]'
                        } leading-[1.25]`}
                      style={{ color: tracklistColor }}
                    >
                      <span className="font-normal mr-1 opacity-60 tabular-nums select-none flex-shrink-0">
                        {t.number}.
                      </span>
                      <span className="font-semibold break-words">
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

        {/* Columna Derecha: Información del Álbum + Código Spotify abajo */}
        <div className="w-[47%] max-w-[47%] h-full flex flex-col justify-between items-end text-right flex-shrink-0 pl-1.5 sm:pl-2.5">

          {/* Bloque Superior: Información del Álbum */}
          <div className="w-full flex flex-col items-end text-right">
            {/* Paleta de Colores del Álbum (5 Cuadros de color sólido) */}
            {album.showPalette !== false && album.palette && album.palette.length > 0 && (
              <div className="flex items-center justify-end gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
                {album.palette.slice(0, 5).map((colorHex, idx) => (
                  <div
                    key={`${colorHex}-${idx}`}
                    className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                ))}
              </div>
            )}

            {/* Nombre del Artista */}
            <div
              className="text-[9.5px] sm:text-[11.5px] font-bold uppercase tracking-[0.25em] mb-1"
              style={{ color: artistColor }}
            >
              {album.artist || 'ARTISTA'}
            </div>

            {/* Título Principal del Álbum */}
            <h1
              className={`font-black tracking-tight leading-[1.04] text-right ${isSquarerFormat
                ? album.title.length > 20
                  ? 'text-base sm:text-lg'
                  : 'text-lg sm:text-2xl'
                : album.title.length > 20
                  ? 'text-xl sm:text-2xl'
                  : 'text-2xl sm:text-3xl'
                } ${album.uppercaseTitle ? 'uppercase' : ''}`}
              style={{ color: titleColor, wordBreak: 'break-word' }}
            >
              {album.title || 'TÍTULO DEL ÁLBUM'}
            </h1>

            {/* Fecha / Año de Lanzamiento */}
            {album.releaseDate && (
              <div
                className="text-[9px] sm:text-[16px] font-medium tracking-wider mt-1.5"
                style={{ color: artistColor, opacity: 0.9 }}
              >
                {formatReleaseDate(album.releaseDate)}
              </div>
            )}

            {/* Duración Total del Álbum */}
            {(album.totalDuration || calculateTotalDurationFromTracks(tracks)) && (
              <div
                className="text-[10px] sm:text-[15px] font-normal mt-0.5"
                style={{ color: artistColor, opacity: 0.8 }}
              >
                {album.totalDuration || calculateTotalDurationFromTracks(tracks)}
              </div>
            )}
          </div>

          {/* Código Scannable de Spotify (ampliado para mayor legibilidad y escaneo rápido) */}
          <div
            className={`flex items-center justify-end overflow-hidden mt-auto pt-2 ${isSquarerFormat
              ? 'h-9 sm:h-10.5 w-38 sm:w-46'
              : 'h-10 sm:h-12 w-42 sm:w-52'
              }`}
          >
            <SpotifyCode
              uri={album.spotifyUri || 'spotify:album:3RQQmkQEvNCY4prGKE6oc5'}
              color={album.soundwaveColor || textColor || '#000000'}
              className="h-full w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
