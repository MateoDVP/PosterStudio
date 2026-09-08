'use client';

import React, { forwardRef } from 'react';

import { PosterConfig } from '@/types/poster';
import { PRINT_SIZES } from '@/lib/constants/printSizes';
import { AlbumGalleryTemplate } from './templates/AlbumGalleryTemplate';
import { SongPlayerTemplate } from './templates/SongPlayerTemplate';
import { Disc3, ArrowUp, Sparkles } from 'lucide-react';

interface PosterRendererProps {
  config: PosterConfig;
  showGuides?: boolean;
}

export const PosterRenderer = forwardRef<HTMLDivElement, PosterRendererProps>(
  ({ config, showGuides = false }, ref) => {
    const printSize = PRINT_SIZES[config.sizeKey] || PRINT_SIZES.a3;

    const isAlbumEmpty =
      config.template === 'album-gallery' &&
      !config.album.title.trim() &&
      !config.album.coverUrl.trim();

    const isPlayerEmpty =
      config.template === 'song-player' &&
      !config.player.title.trim() &&
      !config.player.coverUrl.trim();

    const isEmpty = isAlbumEmpty || isPlayerEmpty;

    return (
      <div className="w-full h-full flex items-center justify-center p-1 sm:p-2">
        {/* Contenedor principal imprimible con relación de aspecto matemática exacta */}
        <div
          ref={ref}
          id="poster-canvas"
          className="relative shadow-2xl transition-all duration-300 overflow-hidden flex flex-col select-none"
          style={{
            backgroundColor: config.backgroundColor || '#FFFFFF',
            aspectRatio: `${printSize.widthMm} / ${printSize.heightMm}`,
            height: '100%',
            maxHeight: 'calc(100vh - 5.5rem)',
            maxWidth: '100%',
            width: 'auto',
          }}
        >
          {/* Guías de margen seguro y sangrado de pre-prensa (simulación de 3mm, se ignora al exportar) */}
          {showGuides && (
            <div
              data-export-ignore="true"
              className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-red-500/70 p-2"
            >
              <div className="w-full h-full border border-dashed border-emerald-500/50 flex flex-col justify-between p-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-red-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                  <span>Línea de corte: {printSize.widthMm} × {printSize.heightMm} mm</span>
                  <span className="text-emerald-700 font-semibold">Margen seguro imprenta: 3mm</span>
                </div>
                <div className="text-right text-[8px] font-mono text-neutral-500 bg-white/90 px-1 rounded self-end">
                  Pre-prensa 300 DPI
                </div>
              </div>
            </div>
          )}

          {/* Vista cuando el póster está vacío (Estado inicial) */}
          {isEmpty ? (
            <div className="w-full h-full p-[8%] flex flex-col items-center justify-center text-center select-none box-border">
              <div className="w-full aspect-square border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-6 bg-neutral-50/70">
                <div className="w-16 h-16 rounded-full bg-neutral-200/80 flex items-center justify-center mb-4 text-neutral-600 shadow-sm">
                  <Disc3 className="w-8 h-8 animate-[spin_10s_linear_infinite]" />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5">
                  <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                  Barra superior
                </div>

                <h2 className="text-base sm:text-lg font-bold text-neutral-800 tracking-tight">
                  Pon el link de tu {config.template === 'album-gallery' ? 'álbum' : 'canción'} para empezar
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
                <span>{printSize.name}</span>
                <span>{printSize.widthMm} × {printSize.heightMm} mm @ 300 DPI</span>
              </div>
            </div>
          ) : (
            /* Renderizado de la plantilla activa */
            config.template === 'album-gallery' ? (
              <AlbumGalleryTemplate
                album={config.album}
                printSize={printSize}
                backgroundColor={config.backgroundColor}
                textColor={config.textColor}
                enableBlurredBackground={config.enableBlurredBackground}
                blurredBackgroundOpacity={config.blurredBackgroundOpacity}
                blurredBackgroundBlur={config.blurredBackgroundBlur}
                blurredBackgroundOverlay={config.blurredBackgroundOverlay}
              />
            ) : (
              <SongPlayerTemplate
                player={config.player}
                printSize={printSize}
                backgroundColor={config.backgroundColor}
                textColor={config.textColor}
                enableBlurredBackground={config.enableBlurredBackground}
                blurredBackgroundOpacity={config.blurredBackgroundOpacity}
                blurredBackgroundBlur={config.blurredBackgroundBlur}
                blurredBackgroundOverlay={config.blurredBackgroundOverlay}
              />
            )
          )}
        </div>
      </div>
    );
  }
);

PosterRenderer.displayName = 'PosterRenderer';
