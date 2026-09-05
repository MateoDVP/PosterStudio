'use client';

import React from 'react';

import { AlbumData, PrintSize } from '@/types/poster';

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

  // Safe Spotify Scannable Code proxy URL
  const codeColorParam = album.soundwaveColor ? album.soundwaveColor.replace('#', '') : '000000';
  const scannableCodeUrl = `/api/spotify-code?uri=${encodeURIComponent(
    album.spotifyUri || 'spotify:album:4czdORirvZFserUR9azmmC'
  )}&bgColor=transparent&codeColor=${codeColorParam}&size=1280`;

  const tracks = album.tracks || [];
  const isSquarerFormat = printSize.aspectRatioRatio >= 0.74; // 30x40 cm (0.75) vs ISO A-series (0.707)
  const useTwoColumns =
    album.trackColumns === 2 ||
    (album.trackColumns !== 1 && (tracks.length > 7 || (isSquarerFormat && tracks.length > 5)));

  // Divide tracks if 2 columns
  const half = Math.ceil(tracks.length / 2);
  const col1Tracks = useTwoColumns ? tracks.slice(0, half) : tracks;
  const col2Tracks = useTwoColumns ? tracks.slice(half) : [];

  const titleColor = album.titleColor || textColor || '#0a0a0a';
  const artistColor = album.artistColor || album.titleColor || textColor || '#404040';
  const tracklistColor = album.tracklistColor || textColor || '#262626';

  return (
    <div
      className="w-full h-full flex flex-col justify-between select-none box-border relative overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
        padding: isSquarerFormat ? '5.5% 6%' : '7%',
      }}
    >
      {/* Ambient Blurred Background Cover Layer */}
      {enableBlurredBackground && album.coverUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <img
            src={getSafeImageUrl(album.coverUrl)}
            alt="Blurred Album Backdrop"
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

      {/* 1. TOP: Ultra-HD Square Artwork */}
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

      {/* 2. BOTTOM GROUP: Compact Tracklist & Typography / Scannable Code */}
      <div
        className={`w-full mt-auto flex justify-between items-start gap-3.5 sm:gap-4 relative z-10 ${
          isSquarerFormat ? 'pt-3.5 sm:pt-4' : 'pt-5 sm:pt-6'
        }`}
      >
        {/* Left Column: Numbered Tracklist */}
        <div className="flex-1 min-w-0 pr-1.5 sm:pr-2">
          {tracks.length > 0 ? (
            <div className={`grid ${useTwoColumns ? 'grid-cols-2 gap-x-4 sm:gap-x-5' : 'grid-cols-1'} gap-y-[2.5px]`}>
              {/* Column 1 */}
              <div className={tracks.length > 12 ? 'space-y-[1.8px]' : 'space-y-[2.5px]'}>
                {col1Tracks.map((t) => (
                  <div
                    key={t.id}
                    className={`${
                      tracks.length > 12 ? 'text-[7px]' : 'text-[8px]'
                    } leading-[1.2] font-semibold tracking-wide truncate uppercase`}
                    style={{ color: tracklistColor }}
                  >
                    <span className="font-normal mr-1" style={{ opacity: 0.6 }}>
                      {t.number}.
                    </span>
                    {t.title}
                  </div>
                ))}
              </div>

              {/* Column 2 */}
              {useTwoColumns && (
                <div className={tracks.length > 12 ? 'space-y-[1.8px]' : 'space-y-[2.5px]'}>
                  {col2Tracks.map((t) => (
                    <div
                      key={t.id}
                      className={`${
                        tracks.length > 12 ? 'text-[7px]' : 'text-[8px]'
                      } leading-[1.2] font-semibold tracking-wide truncate uppercase`}
                      style={{ color: tracklistColor }}
                    >
                      <span className="font-normal mr-1" style={{ opacity: 0.6 }}>
                        {t.number}.
                      </span>
                      {t.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[9px] text-neutral-400 uppercase tracking-widest">
              Lista de pistas
            </div>
          )}
        </div>

        {/* Right Column: Spotify Code + Artist + Big Title + Year */}
        <div className="flex flex-col items-end text-right flex-shrink-0 max-w-[50%]">
          {/* Spotify Scannable Code */}
          <div
            className={`flex items-center justify-end overflow-hidden ${
              isSquarerFormat ? 'h-6 sm:h-6.5 w-32 sm:w-38 mb-1.5' : 'h-7 w-36 sm:w-44 mb-2'
            }`}
          >
            <img
              src={scannableCodeUrl}
              alt="Spotify Scannable Code"
              crossOrigin="anonymous"
              className="h-full w-auto object-contain block"
            />
          </div>

          {/* Artist Name */}
          <div
            className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5"
            style={{ color: artistColor }}
          >
            {album.artist || 'ARTISTA'}
          </div>

          {/* Huge Album Title */}
          <h1
            className={`font-black tracking-tight leading-[1.05] text-right ${
              isSquarerFormat
                ? album.title.length > 20
                  ? 'text-sm'
                  : 'text-base sm:text-lg'
                : album.title.length > 20
                ? 'text-lg'
                : 'text-xl'
            } ${album.uppercaseTitle ? 'uppercase' : ''}`}
            style={{ color: titleColor, wordBreak: 'break-word' }}
          >
            {album.title || 'TÍTULO DEL ÁLBUM'}
          </h1>

          {/* Release Date / Year */}
          {album.releaseDate && (
            <div
              className="text-[7.5px] sm:text-[8px] font-medium tracking-widest mt-1"
              style={{ color: artistColor, opacity: 0.8 }}
            >
              {album.releaseDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
