'use client';

import React from 'react';

import { PlayerData, PrintSize } from '@/types/poster';
import { Heart, Shuffle, SkipBack, Play, SkipForward, Repeat } from 'lucide-react';

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

  const codeColorParam = player.soundwaveColor ? player.soundwaveColor.replace('#', '') : '000000';
  const scannableCodeUrl = `/api/spotify-code?uri=${encodeURIComponent(
    player.spotifyUri || 'spotify:track:4cOdK2wGLETKBW3PvgPWqT'
  )}&bgColor=transparent&codeColor=${codeColorParam}&size=1280`;

  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74;
  const titleColor = player.titleColor || textColor || '#0a0a0a';
  const artistColor = player.artistColor || textColor || '#737373';

  return (
    <div
      className="w-full h-full flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isSquarerFormat ? '6% 7%' : '8%',
      }}
    >
      {/* Ambient Blurred Background Cover Layer */}
      {enableBlurredBackground && player.coverUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <img
            src={getSafeImageUrl(player.coverUrl)}
            alt="Blurred Player Backdrop"
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

      {/* 1. PHOTO / ARTWORK (Upper half) */}
      <div
        className="w-full aspect-square relative z-10 flex-shrink-0 bg-neutral-100 shadow-md overflow-hidden"
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
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 border border-dashed border-neutral-300">
            <span className="text-sm font-medium">Sube una foto o carátula</span>
          </div>
        )}
      </div>

      {/* 2. SPOTIFY SCANNABLE CODE (Centered) */}
      <div
        className={`w-full flex justify-center items-center overflow-hidden relative z-10 ${
          isSquarerFormat ? 'my-2.5 h-8' : 'my-3.5 sm:my-4 h-9 sm:h-10'
        }`}
      >
        <img
          src={scannableCodeUrl}
          alt="Spotify Scannable Code"
          crossOrigin="anonymous"
          className="h-full w-auto max-w-[100%] object-contain block"
        />
      </div>

      {/* 3. SONG TITLE & ARTIST + LIKE HEART */}
      <div className="w-full flex items-center justify-between gap-4 relative z-10">
        <div className="min-w-0 flex-1">
          <h2
            className="text-sm sm:text-base font-bold tracking-tight truncate leading-tight"
            style={{ color: titleColor }}
          >
            {player.title || 'Título de la Canción'}
          </h2>
          <p
            className="text-xs font-medium truncate mt-0.5"
            style={{ color: artistColor }}
          >
            {player.artist || 'Artista'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Heart
            className="w-4 sm:w-5 h-4 sm:h-5 transition-colors"
            style={{
              color: player.isLiked ? titleColor : '#a3a3a3',
              fill: player.isLiked ? titleColor : 'none',
            }}
          />
        </div>
      </div>

      {/* 4. PROGRESS TIMELINE WITH KNOB */}
      <div className={`w-full relative z-10 ${isSquarerFormat ? 'my-2' : 'my-2.5 sm:my-3'}`}>
        {/* Track Line */}
        <div className="relative w-full h-[3px] bg-neutral-200 rounded-full flex items-center">
          {/* Played progress */}
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, player.progressPercent))}%`,
              backgroundColor: titleColor,
            }}
          />
          {/* Scrubber Knob */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full shadow-sm -ml-1"
            style={{
              left: `${Math.min(100, Math.max(0, player.progressPercent))}%`,
              backgroundColor: titleColor,
            }}
          />
        </div>

        {/* Timestamp indicators */}
        <div
          className="flex justify-between items-center text-[9px] sm:text-[10px] font-medium mt-1 tabular-nums"
          style={{ color: artistColor }}
        >
          <span>{player.currentTime || '0:00'}</span>
          <span>{player.totalTime || '-0:00'}</span>
        </div>
      </div>

      {/* 5. PLAYER CONTROLS (Shuffle, Prev, Play/Pause circle, Next, Repeat) */}
      <div className="w-full flex items-center justify-between px-2 pt-0.5 pb-1 relative z-10" style={{ color: titleColor }}>
        <button type="button" className="opacity-80 hover:opacity-100 transition-opacity">
          <Shuffle className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.2]" />
        </button>

        <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
          <SkipBack className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
        </button>

        {/* Circular Play Button */}
        <button
          type="button"
          className={`${
            isSquarerFormat ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-11 sm:h-11'
          } rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform`}
          style={{
            backgroundColor: titleColor,
            color: backgroundColor === '#000000' || titleColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
          }}
        >
          <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current translate-x-0.5" />
        </button>

        <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
          <SkipForward className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
        </button>

        <button type="button" className="opacity-80 hover:opacity-100 transition-opacity">
          <Repeat className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
