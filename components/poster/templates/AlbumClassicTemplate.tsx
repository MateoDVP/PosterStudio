'use client';

import React from 'react';
import { AlbumData, PrintSize } from '@/types/poster';
import { SpotifyCode } from '../SpotifyCode';
import { formatReleaseDate, calculateTotalDurationFromTracks } from '@/lib/spotify';

interface AlbumClassicTemplateProps {
  album: AlbumData;
  printSize: PrintSize;
  backgroundColor?: string;
  textColor?: string;
  enableBlurredBackground?: boolean;
  blurredBackgroundOpacity?: number;
  blurredBackgroundBlur?: number;
  blurredBackgroundOverlay?: 'dark' | 'light' | 'paper';
}

export const AlbumClassicTemplate: React.FC<AlbumClassicTemplateProps> = ({
  album,
  printSize,
  backgroundColor = '#000000',
  textColor = '#FFFFFF',
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
  const isUltraSquarer = printSize.aspectRatioRatio >= 0.81; // Ej: 24.8x29.8 cm (ratio ~0.832)
  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74; // Ej: 29.8x39.8, 39.8x49.8
  const needsCompactCover = tracks.length > 14 && isSquarerFormat;

  // Repartir pistas de manera equilibrada en 2 columnas o personalizada por el usuario
  const defaultHalf = Math.ceil(tracks.length / 2);
  const col1Count =
    album.col1TrackCount !== undefined && album.col1TrackCount > 0 && album.col1TrackCount < tracks.length
      ? album.col1TrackCount
      : defaultHalf;
  const col1Tracks = tracks.slice(0, col1Count);
  const col2Tracks = tracks.slice(col1Count);

  const titleColor = album.titleColor || textColor || '#FFFFFF';
  const artistColor = album.artistColor || textColor || '#E5E5E5';
  const tracklistColor = album.tracklistColor || textColor || '#CCCCCC';

  const formattedDate = album.releaseDate ? formatReleaseDate(album.releaseDate) : '';
  const formattedDuration =
    album.totalDuration || calculateTotalDurationFromTracks(tracks) || '';

  return (
    <div
      className="w-full h-full flex-1 flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isUltraSquarer
          ? '2% 6.5% 2.5% 6.5%'
          : isSquarerFormat
            ? '3.5% 6.5% 3% 6.5%'
            : '6% 6.5% 3.8% 6.5%',
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
            <div className="absolute inset-0 bg-black/50" />
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
          className="aspect-square relative z-10 bg-neutral-900/60 shadow-lg overflow-hidden transition-all duration-300"
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
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-900/40 border border-dashed border-neutral-700">
              <span className="text-sm font-medium">Sin carátula</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ZONA INFERIOR COMPLETA (Cabecera + Divider + Columnas + Spotify Code) */}
      <div className="w-full flex-1 flex flex-col justify-between relative z-10 pt-1.5 sm:pt-2 min-h-0">
        {/* Cabecera: Título, Artista, Paleta y Línea Divisoria */}
        <div className="w-full flex-shrink-0">
          {/* Fila superior: Título (Izq) y Paleta (Der) */}
          <div className="flex items-center justify-between gap-3">
            <h1
              className={`min-w-0 flex-1 font-black tracking-tight leading-[1.1] ${album.titleFontSize ? '' : 'text-xl sm:text-2xl md:text-3xl'
                } ${album.uppercaseTitle !== false ? 'uppercase' : ''
                }`}
              style={{
                color: titleColor,
                fontSize: album.titleFontSize ? `${album.titleFontSize}px` : undefined,
                wordBreak: 'break-word',
              }}
            >
              {album.title || 'Title'}
            </h1>

            {album.showPalette !== false && album.palette && album.palette.length > 0 && (
              <div className="flex items-center flex-shrink-0">
                {album.palette.slice(0, 5).map((colorHex, idx) => {
                  const pSize = album.paletteSize ?? 32;
                  return (
                    <div
                      key={`${colorHex}-${idx}`}
                      style={{
                        backgroundColor: colorHex,
                        width: `${pSize}px`,
                        height: `${Math.round(pSize * 0.5)}px`,
                      }}
                      title={colorHex}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Fila inferior: Artista */}
          <div
            className={`font-bold uppercase tracking-wider mt-0.5 ${album.artistFontSize ? '' : 'text-[10px] sm:text-[14px]'
              }`}
            style={{
              color: artistColor,
              fontSize: album.artistFontSize ? `${album.artistFontSize}px` : undefined,
            }}
          >
            {album.artist || 'Artist'}
          </div>

          {/* Línea Divisoria Horizontal Sutil */}
          <div
            className={`w-full h-[1.5px] ${isUltraSquarer ? 'my-1 sm:my-1.5' : 'my-1.5 sm:my-2'}`}
            style={{
              backgroundColor: titleColor,
              opacity: 0.35,
            }}
          />
        </div>

        {/* Cuerpo: Tracklist (2 columnas) + Metadatos y Spotify Code a la derecha */}
        <div className="w-full flex-1 flex justify-between items-stretch gap-2 sm:gap-3 min-h-0 pt-0.5 pb-0.5">
          {/* Columna Izquierda & Central: Lista de canciones en 2 columnas (espacio maximizado hacia la derecha) */}
          <div className="flex-1 min-w-0 pr-1 sm:pr-1.5">
            {tracks.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-2.5 sm:gap-x-3.5">
                {/* Columna 1 */}
                <div className={tracks.length > 14 ? (isUltraSquarer ? 'space-y-[1px] sm:space-y-[1.5px]' : 'space-y-[1.5px] sm:space-y-[2px]') : 'space-y-[2px] sm:space-y-[3px]'}>
                  {col1Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start tracking-normal ${album.tracklistFontSize
                          ? ''
                          : tracks.length > 14
                            ? isUltraSquarer
                              ? 'text-[9px] sm:text-[11px]'
                              : 'text-[10px] sm:text-[12px]'
                            : 'text-[11.5px] sm:text-[13.5px]'
                        } leading-[1.16]`}
                      style={{
                        color: tracklistColor,
                        fontSize: album.tracklistFontSize ? `${album.tracklistFontSize}px` : undefined,
                      }}
                    >
                      <span className="font-normal mr-1.5 sm:mr-2 opacity-60 tabular-nums select-none flex-shrink-0">
                        {t.number}.
                      </span>
                      <span className="font-semibold leading-[1.16] break-words min-w-0 flex-1">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Columna 2 */}
                <div className={tracks.length > 14 ? (isUltraSquarer ? 'space-y-[1px] sm:space-y-[1.5px]' : 'space-y-[1.5px] sm:space-y-[2px]') : 'space-y-[2px] sm:space-y-[3px]'}>
                  {col2Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start tracking-normal ${album.tracklistFontSize
                          ? ''
                          : tracks.length > 14
                            ? isUltraSquarer
                              ? 'text-[9px] sm:text-[11px]'
                              : 'text-[10px] sm:text-[12px]'
                            : 'text-[11.5px] sm:text-[13.5px]'
                        } leading-[1.16]`}
                      style={{
                        color: tracklistColor,
                        fontSize: album.tracklistFontSize ? `${album.tracklistFontSize}px` : undefined,
                      }}
                    >
                      <span className="font-normal mr-1.5 sm:mr-2 opacity-60 tabular-nums select-none flex-shrink-0">
                        {t.number}.
                      </span>
                      <span className="font-semibold leading-[1.16] break-words min-w-0 flex-1">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[9px] text-neutral-500 uppercase tracking-widest pt-1">
                Lista de pistas
              </div>
            )}
          </div>

          {/* Columna Derecha: Bloque de Metadatos + Código Spotify directamente debajo */}
          <div className="w-[22%] min-w-[70px] max-w-[28%] flex-shrink-0 text-right flex flex-col items-end pl-0.5">
            {/* Metadatos superiores */}
            <div className={`w-full flex flex-col items-end ${isUltraSquarer ? 'space-y-1 sm:space-y-1.5' : 'space-y-1.5 sm:space-y-2'}`}>
              {/* Release Date */}
              {formattedDate && (
                <div>
                  <div
                    className="font-bold uppercase tracking-wider opacity-65"
                    style={{
                      color: album.releaseDateColor || artistColor,
                      fontSize: `${Math.max(6, Math.round((album.metadataFontSize ?? 12) * 0.78))}px`,
                    }}
                  >
                    Release Date
                  </div>
                  <div
                    className="font-extrabold mt-0.5 tracking-tight whitespace-nowrap"
                    style={{
                      color: album.releaseDateColor || titleColor,
                      fontSize: `${album.metadataFontSize ?? 12}px`,
                    }}
                  >
                    {formattedDate}
                  </div>
                </div>
              )}

              {/* Album Length */}
              {formattedDuration && (
                <div>
                  <div
                    className="font-bold uppercase tracking-wider opacity-65"
                    style={{
                      color: album.durationColor || artistColor,
                      fontSize: `${Math.max(6, Math.round((album.metadataFontSize ?? 12) * 0.78))}px`,
                    }}
                  >
                    Album Length
                  </div>
                  <div
                    className="font-extrabold mt-0.5 tracking-tight whitespace-nowrap"
                    style={{
                      color: album.durationColor || titleColor,
                      fontSize: `${album.metadataFontSize ?? 12}px`,
                    }}
                  >
                    {formattedDuration}
                  </div>
                </div>
              )}

              {/* Código Spotify directamente debajo de Album Length sin dejar espacio vacío y con crecimiento libre proporcional */}
              <div className={`${isUltraSquarer ? 'pt-1.5' : 'pt-2.5'} flex justify-end items-center self-end`}>
                <div
                  className="flex items-center justify-end flex-shrink-0"
                  style={{
                    height: `${album.spotifyCodeSize ?? 30}px`,
                    width: `${Math.round((album.spotifyCodeSize ?? 30) * 4)}px`,
                    aspectRatio: '4 / 1',
                  }}
                >
                  <SpotifyCode
                    uri={album.spotifyUri || 'spotify:album:4m2880jivSbbyEGAKfITCa'}
                    color={album.soundwaveColor || textColor || '#FFFFFF'}
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
