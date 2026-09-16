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
  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74;

  // Repartir pistas de manera equilibrada en 2 columnas
  const halfTracks = Math.ceil(tracks.length / 2);
  const col1Tracks = tracks.slice(0, halfTracks);
  const col2Tracks = tracks.slice(halfTracks);

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
        padding: isSquarerFormat ? '5% 5.5% 3.2% 5.5%' : '6% 6.5% 3.8% 6.5%',
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

      {/* 1. SECCIÓN SUPERIOR: Carátula cuadrada en Ultra-HD */}
      <div className="w-full aspect-square relative z-10 flex-shrink-0 bg-neutral-900/60 shadow-lg overflow-hidden">
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

      {/* 2. ZONA INFERIOR COMPLETA (Cabecera + Divider + Columnas + Spotify Code) */}
      <div className="w-full flex-1 flex flex-col justify-between relative z-10 pt-2 sm:pt-3 min-h-0">
        {/* Cabecera: Título, Artista, Paleta y Línea Divisoria */}
        <div className="w-full flex-shrink-0">
          {/* Fila superior: Título (Izq) y Paleta (Der) */}
          <div className="flex items-center justify-between gap-3">
            <h1
              className={`min-w-0 flex-1 font-black tracking-tight leading-[1.1] text-base sm:text-lg md:text-xl ${album.uppercaseTitle !== false ? 'uppercase' : ''
                }`}
              style={{ color: titleColor, wordBreak: 'break-word' }}
            >
              {album.title || 'Title'}
            </h1>

            {album.showPalette !== false && album.palette && album.palette.length > 0 && (
              <div className="flex items-center flex-shrink-0">
                {album.palette.slice(0, 5).map((colorHex, idx) => (
                  <div
                    key={`${colorHex}-${idx}`}
                    className="w-5 h-2.5 sm:w-6 sm:h-3"
                    style={{ backgroundColor: colorHex }}
                    title={colorHex}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Fila inferior: Artista */}
          <div
            className="text-[10px] sm:text-[14px] font-bold uppercase tracking-wider mt-0.5"
            style={{ color: artistColor }}
          >
            {album.artist || 'Artist'}
          </div>

          {/* Línea Divisoria Horizontal Sutil */}
          <div
            className="w-full h-[1.5px] mt-2 sm:mt-1"
            style={{
              backgroundColor: titleColor,
              opacity: 0.35,
            }}
          />
        </div>

        {/* Cuerpo: Tracklist (2 columnas) + Metadatos a la derecha */}
        <div className="w-full flex-1 flex justify-between items-start gap-2.5 sm:gap-4 my-auto min-h-0 pt-2 sm:pt-2.5 pb-1">
          {/* Columna Izquierda & Central: Lista de canciones en 2 columnas (espacio maximizado) */}
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            {tracks.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-2.5 sm:gap-x-4">
                {/* Columna 1 */}
                <div className={tracks.length > 14 ? 'space-y-[1.5px] sm:space-y-[2.5px]' : 'space-y-[2px] sm:space-y-[3.5px]'}>
                  {col1Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start tracking-normal ${tracks.length > 14
                        ? 'text-[10px] sm:text-[13px]'
                        : 'text-[12px] sm:text-[14px]'
                        } leading-[1.2]`}
                      style={{ color: tracklistColor }}
                    >
                      <span className="font-normal mr-1.5 sm:mr-2 opacity-60 tabular-nums select-none flex-shrink-0">
                        {t.number}.
                      </span>
                      <span className="font-semibold leading-[1.18] break-words min-w-0 flex-1">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Columna 2 */}
                <div className={tracks.length > 14 ? 'space-y-[1.5px] sm:space-y-[2.5px]' : 'space-y-[2px] sm:space-y-[3.5px]'}>
                  {col2Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start tracking-normal ${tracks.length > 14
                        ? 'text-[10px] sm:text-[13px]'
                        : 'text-[12px] sm:text-[14px]'
                        } leading-[1.2]`}
                      style={{ color: tracklistColor }}
                    >
                      <span className="font-normal mr-1.5 sm:mr-2 opacity-60 tabular-nums select-none flex-shrink-0">
                        {t.number}.
                      </span>
                      <span className="font-semibold leading-[1.18] break-words min-w-0 flex-1">
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

          {/* Columna Derecha: Bloque de Metadatos (Release Date y Album Length) */}
          <div className="w-[28%] min-w-[80px] max-w-[30%] flex-shrink-0 text-right space-y-2 sm:space-y-3 pl-1">            {/* Release Date */}
            {formattedDate && (
              <div>
                <div
                  className="text-[8px] sm:text-[10.5px] font-bold uppercase tracking-wider opacity-65"
                  style={{ color: artistColor }}
                >
                  Release Date
                </div>
                <div
                  className="text-[9.5px] sm:text-[12.5px] font-extrabold mt-0.5 tracking-tight"
                  style={{ color: titleColor }}
                >
                  {formattedDate}
                </div>
              </div>
            )}

            {/* Album Length */}
            {formattedDuration && (
              <div>
                <div
                  className="text-[8px] sm:text-[10.5px] font-bold uppercase tracking-wider opacity-65"
                  style={{ color: artistColor }}
                >
                  Album Length
                </div>
                <div
                  className="text-[9.5px] sm:text-[12.5px] font-extrabold mt-0.5 tracking-tight"
                  style={{ color: titleColor }}
                >
                  {formattedDuration}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie: Código de Spotify Scannable Centrado (Siempre anclado al fondo sin colisión) */}
        <div className="w-full flex-shrink-0 flex justify-end items-end">
          <div className="h-[32px] sm:h-[38px] flex items-center justify-center">
            <SpotifyCode
              uri={album.spotifyUri || 'spotify:album:4m2880jivSbbyEGAKfITCa'}
              color={album.soundwaveColor || textColor || '#FFFFFF'}
              className="h-full w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
