'use client';

import React, { forwardRef } from 'react';

import { PosterConfig } from '@/types/poster';
import { getResolvedPrintDimensions } from '@/lib/constants/printSizes';
import { AlbumGalleryTemplate } from './templates/AlbumGalleryTemplate';
import { SongPlayerTemplate } from './templates/SongPlayerTemplate';
import { AlbumClassicTemplate } from './templates/AlbumClassicTemplate';
import { Disc3, ArrowUp, Sparkles } from 'lucide-react';

interface PosterRendererProps {
  config: PosterConfig;
  showGuides?: boolean;
}

function getSafeImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export const PosterRenderer = forwardRef<HTMLDivElement, PosterRendererProps>(
  ({ config, showGuides = false }, ref) => {
    const { baseSize, sheetSize, isMdf, bleedCm } = getResolvedPrintDimensions(config);

    const activeCoverUrl =
      config.template === 'song-player' ? config.player?.coverUrl : config.album?.coverUrl;

    const isAlbumEmpty =
      (config.template === 'album-gallery' || config.template === 'album-classic') &&
      !config.album?.title?.trim() &&
      !config.album?.coverUrl?.trim();

    const isPlayerEmpty =
      config.template === 'song-player' &&
      !config.player?.title?.trim() &&
      !config.player?.coverUrl?.trim();

    const isEmpty = isAlbumEmpty || isPlayerEmpty;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2">
        {/* Contenedor principal imprimible con relación de aspecto matemática exacta */}
        <div
          ref={ref}
          id="poster-canvas"
          className="relative shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col items-center justify-center select-none"
          style={{
            backgroundColor: config.backgroundColor || '#FFFFFF',
            aspectRatio: `${sheetSize.widthMm} / ${sheetSize.heightMm}`,
            height: '100%',
            maxHeight: 'calc(100vh - 5.5rem)',
            maxWidth: '100%',
            width: 'auto',
          }}
        >
          {/* Capa de fondo con portada desenfocada ambiental (Solo en modo MDF para cubrir el sangrado exterior) */}
          {isMdf && config.enableBlurredBackground && activeCoverUrl && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden z-0"
              aria-hidden="true"
            >
              <img
                src={getSafeImageUrl(activeCoverUrl)}
                alt="Fondo desenfocado ambiental"
                crossOrigin="anonymous"
                className="w-full h-full object-cover scale-125"
                style={{
                  filter: `blur(${config.blurredBackgroundBlur ?? 35}px)`,
                  opacity: config.blurredBackgroundOpacity ?? 0.65,
                }}
              />
              {config.blurredBackgroundOverlay === 'dark' ? (
                <div className="absolute inset-0 bg-black/50" />
              ) : config.blurredBackgroundOverlay === 'light' ? (
                <div className="absolute inset-0 bg-white/40" />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: config.backgroundColor || '#000000',
                    opacity: 0.35,
                  }}
                />
              )}
            </div>
          )}

          {/* Guías de pre-prensa y doblado de MDF / corte */}
          {showGuides && (
            <div
              data-export-ignore="true"
              className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center"
            >
              {isMdf ? (
                <>
                  {/* Borde exterior de corte del papel impreso con sangrado */}
                  <div className="absolute inset-0 border-2 border-dashed border-red-500/80 p-1 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[9px] font-mono text-red-600 bg-white/95 px-2 py-0.5 rounded shadow-sm border border-red-200">
                      <span>
                        Línea de corte exterior: {(sheetSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × {(sheetSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm
                      </span>
                      <span className="text-amber-700 font-bold">🪵 Sangrado cantos: {bleedCm} cm</span>
                    </div>
                    <div className="text-right text-[8px] font-mono text-neutral-600 bg-white/90 px-1 rounded self-end">
                      Pre-prensa 300 DPI (Retablo MDF)
                    </div>
                  </div>

                  {/* Línea de doblado sobre los cantos de la tabla MDF */}
                  <div
                    className="border-2 border-dashed border-amber-500/90 relative flex flex-col justify-between p-1"
                    style={{
                      width: `${(baseSize.widthMm / sheetSize.widthMm) * 100}%`,
                      height: `${(baseSize.heightMm / sheetSize.heightMm) * 100}%`,
                    }}
                  >
                    <div className="text-[8.5px] font-mono font-bold text-amber-900 bg-amber-100/95 px-1.5 py-0.5 rounded self-start shadow-sm border border-amber-300">
                      Cara frontal MDF: {(baseSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × {(baseSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm
                    </div>
                    <div className="text-right text-[8px] font-mono font-semibold text-amber-800 bg-white/90 px-1 rounded self-end">
                      Línea de doblado sobre la madera
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full border-2 border-dashed border-red-500/70 p-2">
                  <div className="w-full h-full border border-dashed border-emerald-500/50 flex flex-col justify-between p-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-red-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                      <span>
                        Línea de corte: {(baseSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × {(baseSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm
                      </span>
                      <span className="text-emerald-700 font-semibold">Margen seguro: 3 mm</span>
                    </div>
                    <div className="text-right text-[8px] font-mono text-neutral-500 bg-white/90 px-1 rounded self-end">
                      Pre-prensa 300 DPI (Cuadro con Marco)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista cuando el póster está vacío (Estado inicial) */}
          {isEmpty ? (
            <div className="relative z-10 w-full h-full p-[8%] flex flex-col items-center justify-center text-center select-none box-border">
              <div className="w-full aspect-square border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-6 bg-neutral-50/70">
                <div className="w-16 h-16 rounded-full bg-neutral-200/80 flex items-center justify-center mb-4 text-neutral-600 shadow-sm">
                  <Disc3 className="w-8 h-8 animate-[spin_10s_linear_infinite]" />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5">
                  <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                  Barra superior
                </div>

                <h2 className="text-base sm:text-lg font-bold text-neutral-800 tracking-tight">
                  Pon el link de tu {config.template === 'song-player' ? 'canción' : 'álbum'} para empezar
                </h2>

                <p className="text-xs text-neutral-500 max-w-xs mt-2 leading-relaxed">
                  Pega cualquier enlace de Spotify en el buscador del menú superior para extraer la carátula a 3000px y las canciones automáticamente.
                </p>

                <div className="mt-4 pt-3 border-t border-neutral-200/80 text-[11px] text-neutral-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-neutral-400" />
                  O edita los textos directamente en el menú lateral derecho
                </div>
              </div>

              <div className="w-full mt-6 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                <span>{isMdf ? `Tabla MDF ${baseSize.name}` : baseSize.name}</span>
                <span>
                  {(sheetSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × {(sheetSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm @ 300 DPI
                </span>
              </div>
            </div>
          ) : (
            /* Contenedor del área de diseño (Frontal de madera MDF o póster completo) */
            <div
              className={`relative z-10 flex flex-col items-center justify-center transition-all ${
                isMdf
                  ? 'flex-shrink-0'
                  : 'w-full h-full flex-1'
              }`}
              style={
                isMdf
                  ? {
                      width: `${(baseSize.widthMm / sheetSize.widthMm) * 100}%`,
                      height: `${(baseSize.heightMm / sheetSize.heightMm) * 100}%`,
                    }
                  : undefined
              }
            >
              {/* Línea guía sutil para indicar visualmente el frontal del MDF en pantalla */}
              {isMdf && !showGuides && (
                <div
                  data-export-ignore="true"
                  className="absolute inset-0 pointer-events-none border border-neutral-400/20 border-dashed z-20"
                />
              )}

              {config.template === 'album-gallery' ? (
                <AlbumGalleryTemplate
                  album={config.album}
                  printSize={baseSize}
                  backgroundColor={isMdf ? 'transparent' : config.backgroundColor}
                  textColor={config.textColor}
                  enableBlurredBackground={isMdf ? false : config.enableBlurredBackground}
                  blurredBackgroundOpacity={config.blurredBackgroundOpacity}
                  blurredBackgroundBlur={config.blurredBackgroundBlur}
                  blurredBackgroundOverlay={config.blurredBackgroundOverlay}
                />
              ) : config.template === 'album-classic' ? (
                <AlbumClassicTemplate
                  album={config.album}
                  printSize={baseSize}
                  backgroundColor={isMdf ? 'transparent' : config.backgroundColor}
                  textColor={config.textColor}
                  enableBlurredBackground={isMdf ? false : config.enableBlurredBackground}
                  blurredBackgroundOpacity={config.blurredBackgroundOpacity}
                  blurredBackgroundBlur={config.blurredBackgroundBlur}
                  blurredBackgroundOverlay={config.blurredBackgroundOverlay}
                />
              ) : (
                <SongPlayerTemplate
                  player={config.player}
                  printSize={baseSize}
                  backgroundColor={isMdf ? 'transparent' : config.backgroundColor}
                  textColor={config.textColor}
                  enableBlurredBackground={isMdf ? false : config.enableBlurredBackground}
                  blurredBackgroundOpacity={config.blurredBackgroundOpacity}
                  blurredBackgroundBlur={config.blurredBackgroundBlur}
                  blurredBackgroundOverlay={config.blurredBackgroundOverlay}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PosterRenderer.displayName = 'PosterRenderer';

