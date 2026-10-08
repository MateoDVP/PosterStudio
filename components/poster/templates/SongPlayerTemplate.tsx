'use client';

import React from 'react';

import { PlayerData, PrintSize } from '@/types/poster';
import { SpotifyCode } from '../SpotifyCode';
import { Heart, Shuffle, SkipBack, SkipForward } from 'lucide-react';

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

  const isUltraSquarer = printSize.aspectRatioRatio >= 0.81;
  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74;
  const titleColor = player.titleColor || textColor || '#FFFFFF';
  const artistColor = player.artistColor || textColor || '#D4D4D4';

  const getContrastColor = (hexColor: string) => {
    if (!hexColor) return '#000000';
    const clean = hexColor.replace('#', '');
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#FFFFFF';
    }
    if (clean.length === 6) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#FFFFFF';
    }
    return '#000000';
  };

  const playIconColor = getContrastColor(titleColor);

  return (
    <div
      className="w-full h-full flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isUltraSquarer
          ? '2.2% 6.5% 4.2% 6.5%'
          : isSquarerFormat
            ? '3.5% 6.5% 4.8% 6.5%'
            : '5.5% 7.5% 6.5% 7.5%',
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
                opacity: 0.35,
              }}
            />
          )}
        </div>
      )}

      {/* 1. FOTO PRINCIPAL / CARÁTULA CUADRADA (100% íntegra) */}
      <div
        className="w-full aspect-square relative z-10 flex-shrink-0 bg-neutral-900/60 shadow-2xl overflow-hidden"
        style={{ borderRadius: `${player.coverBorderRadius ?? 8}px` }}
      >
        {player.coverUrl ? (
          <img
            src={getSafeImageUrl(player.coverUrl)}
            alt={player.title}
            crossOrigin="anonymous"
            className={`w-full h-full object-cover block ${player.isBlackAndWhite ? 'grayscale contrast-105' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-900/40 border border-dashed border-neutral-700">
            <span className="text-sm font-medium">Sin imagen</span>
          </div>
        )}
      </div>

      {/* 2. FILA DE INFORMACIÓN (TÍTULO + ARTISTA A LA IZQUIERDA | CÓDIGO SPOTIFY A LA DERECHA) */}
      <div className="w-full flex items-center justify-between gap-3 pt-3 relative z-10">
        <div className="flex-1 min-w-0 pr-2">
          <h1
            className="font-extrabold tracking-tight truncate leading-tight"
            style={{
              color: titleColor,
              fontSize: player.titleFontSize ? `${player.titleFontSize}px` : undefined,
            }}
          >
            {player.title || 'Título de Canción'}
          </h1>
          <p
            className="font-semibold truncate mt-0.5 tracking-normal opacity-90"
            style={{
              color: artistColor,
              fontSize: player.artistFontSize ? `${player.artistFontSize}px` : undefined,
            }}
          >
            {player.artist || 'Nombre del Artista'}
          </p>
        </div>

        {/* Código Escaneable de Spotify a la derecha */}
        <div
          className={`flex-shrink-0 flex items-center justify-end max-w-[52%] ${player.spotifyCodeSize ? '' : 'h-9 sm:h-11 md:h-12'}`}
          style={{
            height: player.spotifyCodeSize ? `${player.spotifyCodeSize}px` : undefined,
          }}
        >
          <SpotifyCode
            uri={player.spotifyUri || 'spotify:track:4cOdK2wGLETKBW3PvgPWqT'}
            color={player.soundwaveColor || titleColor || '#FFFFFF'}
            className="h-full w-auto"
          />
        </div>
      </div>

      {/* 3. BARRA DE PROGRESO DE SPOTIFY */}
      <div className="w-full pt-5 relative z-10">
        {/* Línea de pista completa */}
        <div
          className="w-full h-[3px] sm:h-[4px] rounded-full relative flex items-center cursor-default"
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
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

        {/* Indicadores de tiempo transcurrido y total (Minutos con mayor tamaño) */}
        <div
          className="flex justify-between items-center text-[12px] sm:text-[13.5px] font-semibold mt-2 tabular-nums opacity-90 tracking-tight"
          style={{ color: artistColor }}
        >
          <span>{player.currentTime || '0:58'}</span>
          <span>{player.totalTime || '3:27'}</span>
        </div>
      </div>

      {/* 4. SECCIÓN INFERIOR: CONTROLES DEL REPRODUCTOR Y PALETA DE COLORES */}
      <div className="w-full flex flex-col relative z-10">
        {/* Controles del Reproductor (Play/Pausa 100% Centrado + 4 Iconos Equidistantes) */}
        <div
          className="w-full flex items-center justify-between px-1 sm:px-2 mb-2 sm:mb-5"
          style={{ color: titleColor }}
        >
          {/* Bloque Izquierdo (Shuffle + Anterior uniformemente separados) */}
          <div className="flex-1 flex items-center justify-around">
            <button type="button" className="opacity-80 hover:opacity-100 transition-opacity p-1">
              <Shuffle className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.2]" />
            </button>
            <button type="button" className="opacity-95 hover:opacity-100 transition-opacity p-1">
              <SkipBack className="w-6 sm:w-7 h-6 sm:h-7 fill-current" />
            </button>
          </div>

          {/* Botón Circular Central de Play/Pausa (Matemáticamente Centrado al 50%) */}
          <div className="flex-shrink-0 flex items-center justify-center mx-2 sm:mx-4">
            <button
              type="button"
              className={`${isSquarerFormat ? 'w-11 h-11 sm:w-13 sm:h-13' : 'w-12 h-12 sm:w-14 sm:h-14'
                } rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 flex-shrink-0`}
              style={{
                backgroundColor: titleColor,
              }}
              title={player.isPlaying !== false ? 'Pausar' : 'Reproducir'}
            >
              {player.isPlaying !== false ? (
                /* Icono Pausa (||) - perfectamente simétrico y con alto contraste garantizado */
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <span
                    className="w-1.2 sm:w-1.5 h-4 sm:h-5 rounded-[1.5px] block"
                    style={{ backgroundColor: playIconColor }}
                  />
                  <span
                    className="w-1.2 sm:w-1.5 h-4 sm:h-5 rounded-[1.5px] block"
                    style={{ backgroundColor: playIconColor }}
                  />
                </div>
              ) : (
                /* Icono Play (▶) - compensación óptica exacta en el centro de gravedad */
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ fill: playIconColor, marginLeft: '3px' }}
                >
                  <polygon points="6 4 20 12 6 20" />
                </svg>
              )}
            </button>
          </div>

          {/* Bloque Derecho (Siguiente + Favorito Corazón uniformemente separados) */}
          <div className="flex-1 flex items-center justify-around">
            <button type="button" className="opacity-95 hover:opacity-100 transition-opacity p-1">
              <SkipForward className="w-6 sm:w-7 h-6 sm:h-7 fill-current" />
            </button>
            <button type="button" className="opacity-95 hover:opacity-100 transition-opacity p-1">
              <Heart
                className="w-5 sm:w-6 h-5 sm:h-6 transition-colors"
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
          <div className="w-full flex items-center gap-2 sm:gap-2.5 pt-0.5">
            {(player.palette && player.palette.length > 0
              ? player.palette
              : ['#D6C6B6', '#B0A296', '#696058', '#403A36', '#1E1B19']
            )
              .slice(0, 5)
              .map((hex, i) => {
                const hasBorder = player.paletteBorder !== false;
                const borderColor = player.paletteBorderColor || '#FFFFFF';

                return (
                  <div
                    key={`${hex}-${i}`}
                    className={`flex-1 rounded-[3px] shadow-sm transition-transform hover:scale-[1.02] ${player.paletteSize ? '' : 'h-3 sm:h-3.5'}`}
                    style={{
                      backgroundColor: hex,
                      height: player.paletteSize ? `${player.paletteSize}px` : undefined,
                      border: hasBorder ? `1.5px solid ${borderColor}` : '1px solid rgba(0,0,0,0.2)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                    title={hex}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
