'use client';

import React from 'react';

import { PlayerData, PrintSize } from '@/types/poster';
import { SpotifyCode } from '../SpotifyCode';
import { Heart, Shuffle, SkipBack, SkipForward, Repeat } from 'lucide-react';

interface SongPlayerTemplateProps {
  player: PlayerData;
  printSize: PrintSize;
  backgroundColor?: string;
  textColor?: string;
  enableBlurredBackground?: boolean;
  blurredBackgroundOpacity?: number;
  blurredBackgroundBlur?: number;
  blurredBackgroundOverlay?: 'dark' | 'light' | 'paper';
}

export const SongPlayerTemplate: React.FC<SongPlayerTemplateProps> = ({
  player,
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

  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74;
  const titleColor = player.titleColor || textColor || '#FFFFFF';
  const artistColor = player.artistColor || textColor || '#D4D4D4';

  const isLightBackground =
    backgroundColor === '#FFFFFF' ||
    backgroundColor.toLowerCase() === '#fff' ||
    backgroundColor.toLowerCase() === 'white' ||
    (backgroundColor.startsWith('#') &&
      backgroundColor.length === 7 &&
      parseInt(backgroundColor.slice(1, 3), 16) * 0.299 +
        parseInt(backgroundColor.slice(3, 5), 16) * 0.587 +
        parseInt(backgroundColor.slice(5, 7), 16) * 0.114 >
        180);

  return (
    <div
      className="w-full h-full flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isSquarerFormat ? '5.5% 6.5%' : '7% 7.5%',
      }}
    >
      {/* Capa de fondo con portada desenfocada ambiental */}
      {enableBlurredBackground && player.coverUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <img
            src={getSafeImageUrl(player.coverUrl)}
            alt="Fondo desenfocado del reproductor"
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
                opacity: 0.4,
              }}
            />
          )}
        </div>
      )}

      {/* 1. FOTO / CARÁTULA CUADRADA SUPERIOR */}
      <div
        className="w-full aspect-square relative z-10 flex-shrink-0 bg-neutral-900 shadow-xl overflow-hidden"
        style={{
          borderRadius: `${player.coverBorderRadius ?? 8}px`,
        }}
      >
        {player.coverUrl ? (
          <img
            src={getSafeImageUrl(player.coverUrl)}
            alt={player.title}
            crossOrigin="anonymous"
            className={`w-full h-full object-cover block ${
              player.isBlackAndWhite ? 'grayscale contrast-105' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/60 border border-dashed border-neutral-700">
            <span className="text-sm font-medium">Sube una foto o carátula</span>
          </div>
        )}
      </div>

      {/* 2. TÍTULO, ARTISTA Y CÓDIGO SPOTIFY ALINEADOS EN LA MISMA FILA */}
      <div className="w-full flex items-center justify-between gap-3 relative z-10 my-2.5 sm:my-3">
        {/* Izquierda: Título y Artista */}
        <div className="min-w-0 flex-1 pr-2">
          <h2
            className="text-sm sm:text-base md:text-lg font-black tracking-tight uppercase truncate leading-tight"
            style={{ color: titleColor }}
          >
            {player.title || 'Título de la Canción'}
          </h2>
          <p
            className="text-xs sm:text-sm font-semibold truncate mt-0.5 opacity-80"
            style={{ color: artistColor }}
          >
            {player.artist || 'Artista'}
          </p>
        </div>

        {/* Derecha: Código de Spotify Scannable */}
        <div className="flex-shrink-0 flex items-center justify-end h-7 sm:h-8 md:h-9 max-w-[48%]">
          <SpotifyCode
            uri={player.spotifyUri || 'spotify:track:4cOdK2wGLETKBW3PvgPWqT'}
            color={player.soundwaveColor || titleColor || '#FFFFFF'}
            className="h-full w-auto"
          />
        </div>
      </div>

      {/* 3. LÍNEA DE PROGRESO Y MINUTERO */}
      <div className="w-full relative z-10 mb-2 sm:mb-2.5">
        {/* Barra de progreso */}
        <div
          className="relative w-full h-[3px] sm:h-[3.5px] rounded-full flex items-center overflow-visible"
          style={{
            backgroundColor: isLightBackground ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.22)',
          }}
        >
          {/* Progreso reproducido */}
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, player.progressPercent))}%`,
              backgroundColor: titleColor,
            }}
          />
          {/* Indicador / Perilla circular */}
          <div
            className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-md -ml-1 sm:-ml-1.5"
            style={{
              left: `${Math.min(100, Math.max(0, player.progressPercent))}%`,
              backgroundColor: titleColor,
            }}
          />
        </div>

        {/* Indicadores de tiempo transcurrido y total */}
        <div
          className="flex justify-between items-center text-[10px] sm:text-[11px] font-medium mt-1.5 tabular-nums opacity-80"
          style={{ color: artistColor }}
        >
          <span>{player.currentTime || '0:58'}</span>
          <span>{player.totalTime || '3:27'}</span>
        </div>
      </div>

      {/* 4. CONTROLES DEL REPRODUCTOR */}
      <div
        className="w-full flex items-center justify-between px-1 relative z-10 my-1 sm:my-2"
        style={{ color: titleColor }}
      >
        {/* Shuffle */}
        <button type="button" className="opacity-75 hover:opacity-100 transition-opacity">
          <Shuffle className="w-4 sm:w-5 h-4 sm:h-5 stroke-[2.2]" />
        </button>

        {/* Anterior */}
        <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
          <SkipBack className="w-5 sm:w-6 h-5 sm:h-6 fill-current" />
        </button>

        {/* Botón Circular Central de Play/Pausa */}
        <button
          type="button"
          className={`${
            isSquarerFormat ? 'w-10 h-10 sm:w-11 sm:h-11' : 'w-11 h-11 sm:w-12 sm:h-12'
          } rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 flex-shrink-0`}
          style={{
            backgroundColor: titleColor,
            color: isLightBackground ? '#FFFFFF' : '#000000',
          }}
          title={player.isPlaying !== false ? 'Pausar' : 'Reproducir'}
        >
          {player.isPlaying !== false ? (
            /* Icono Pausa (||) - perfectamente simétrico */
            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
              <span className="w-1 sm:w-1.2 h-3.5 sm:h-4 bg-current rounded-[1px] block" />
              <span className="w-1 sm:w-1.2 h-3.5 sm:h-4 bg-current rounded-[1px] block" />
            </div>
          ) : (
            /* Icono Play (▶) - compensación óptica exacta en el centro de gravedad */
            <svg
              viewBox="0 0 24 24"
              className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current"
              style={{ marginLeft: '2px' }}
            >
              <polygon points="6 4 20 12 6 20" />
            </svg>
          )}
        </button>

        {/* Siguiente */}
        <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
          <SkipForward className="w-5 sm:w-6 h-5 sm:h-6 fill-current" />
        </button>

        {/* Repetir y Favorito agrupados a la derecha */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button type="button" className="opacity-75 hover:opacity-100 transition-opacity">
            <Repeat className="w-4 sm:w-4.5 h-4 sm:h-4.5 stroke-[2.2]" />
          </button>
          <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
            <Heart
              className="w-4 sm:w-4.5 h-4 sm:h-4.5 transition-colors"
              style={{
                color: player.isLiked ? titleColor : 'currentColor',
                fill: player.isLiked ? titleColor : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* 5. PALETA DE COLORES (5 Rectángulos horizontales como en la placa de referencia) */}
      {player.showPalette !== false && (
        <div className="w-full flex items-center gap-2 sm:gap-2.5 pt-1.5 pb-0.5 relative z-10">
          {(player.palette && player.palette.length > 0
            ? player.palette
            : ['#D6C6B6', '#B0A296', '#696058', '#403A36', '#1E1B19']
          )
            .slice(0, 5)
            .map((hex, i) => (
              <div
                key={`${hex}-${i}`}
                className="flex-1 h-3 sm:h-3.5 rounded-[2px] shadow-sm transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
        </div>
      )}
    </div>
  );
};
