'use client';

import React from 'react';

import { PosterConfig, TemplateType, PrintSizeKey } from '@/types/poster';
import { PRINT_SIZES } from '@/lib/constants/printSizes';
import { Disc3, Music2, Eye, Palette, Sparkles } from 'lucide-react';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';

interface LayoutControlsProps {
  config: PosterConfig;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
  showGuides: boolean;
  onToggleGuides: () => void;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({
  config,
  onChange,
  showGuides,
  onToggleGuides,
}) => {
  const handleTemplateChange = (template: TemplateType) => {
    onChange((prev) => ({
      ...prev,
      template,
    }));
  };

  const handleSizeChange = (sizeKey: PrintSizeKey) => {
    onChange((prev) => ({
      ...prev,
      sizeKey,
    }));
  };

  const handleBgColor = (backgroundColor: string) => {
    onChange((prev) => ({
      ...prev,
      backgroundColor,
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Template Selector */}
      <div>
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
          Plantilla de Diseño
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleTemplateChange('album-gallery')}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              config.template === 'album-gallery'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium shadow-sm ring-1 ring-emerald-500/30'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <Disc3 className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold">Galería Álbum</div>
              <div className="text-[11px] opacity-70">Tracklist + Suizo minimalista</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTemplateChange('song-player')}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              config.template === 'song-player'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium shadow-sm ring-1 ring-emerald-500/30'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <Music2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold">Placa Canción</div>
              <div className="text-[11px] opacity-70">Timeline + Foto + Player SVG</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Physical Size & 300 DPI Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Formato Físico (300 DPI Reales)
          </label>
          <span className="text-[11px] text-emerald-400 font-mono font-medium">
            {PRINT_SIZES[config.sizeKey].widthPx300Dpi} × {PRINT_SIZES[config.sizeKey].heightPx300Dpi} px
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(PRINT_SIZES) as PrintSizeKey[]).map((key) => {
            const size = PRINT_SIZES[key];
            const isSelected = config.sizeKey === key;
            const isSquarer = size.aspectRatioRatio >= 0.74;

            const usageDescriptions: Record<PrintSizeKey, string> = {
              a5: 'Portarretratos y placas acrílicas',
              a4: 'Escritorio y diplomas estándar',
              a3: 'Póster de pared mediano',
              '30x40': 'Marcos de cuadro tipo IKEA (3:4)',
              '50x70': 'Póster grande de galería / museo',
            };

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSizeChange(key)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                }`}
              >
                {/* Visual miniature silhouette of the physical paper */}
                <div className="w-8 h-10 flex items-center justify-center flex-shrink-0 bg-neutral-950/60 rounded border border-neutral-800 p-0.5 mt-0.5">
                  <div
                    className={`border transition-colors ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500/20'
                        : 'border-neutral-600 bg-neutral-800/40'
                    }`}
                    style={{
                      aspectRatio: `${size.widthMm} / ${size.heightMm}`,
                      height: '100%',
                      maxHeight: '32px',
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-neutral-200 truncate">{size.name}</span>
                    <span
                      className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {size.id}
                    </span>
                  </div>

                  <div className="text-[10.5px] font-mono text-neutral-400 mt-0.5">
                    {size.widthMm} × {size.heightMm} mm
                    <span className="text-neutral-600 ml-1">
                      ({isSquarer ? 'Ratio 3:4' : 'Ratio 1:1.41'})
                    </span>
                  </div>

                  <div className="text-[10px] text-neutral-500 mt-1 truncate">
                    {usageDescriptions[key]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Poster Canvas Background & Ambient Cover Blur */}
      <div className="pt-4 border-t border-neutral-800/80 space-y-5">
        {/* Paper Background Color */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-neutral-400" />
              Fondo del Papel
            </div>
            {/* Quick swatches */}
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Blanco Galería', color: '#FFFFFF' },
                { label: 'Off-White / Crema', color: '#FBFBFA' },
                { label: 'Gris Estudio', color: '#F3F4F6' },
                { label: 'Negro Mate', color: '#121212' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  title={swatch.label}
                  onClick={() => handleBgColor(swatch.color)}
                  className={`w-5 h-5 rounded-full border shadow-sm transition-transform ${
                    config.backgroundColor?.toUpperCase() === swatch.color.toUpperCase()
                      ? 'scale-110 border-emerald-500 ring-2 ring-emerald-500/40'
                      : 'border-neutral-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          </div>

          {/* Direct Hex Input + ColorPicker Popover */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono">
                #
              </span>
              <input
                type="text"
                value={(config.backgroundColor || '#FFFFFF').replace(/^#/, '')}
                onChange={(e) => {
                  const cleanHex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                  handleBgColor(`#${cleanHex}`);
                }}
                placeholder="FFFFFF"
                maxLength={6}
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg pl-6 pr-3 py-2 text-xs font-mono text-neutral-200 uppercase focus:border-neutral-700 focus:outline-none"
              />
            </div>
            <ColorPickerPopover
              color={config.backgroundColor || '#FFFFFF'}
              onChange={(hex) => handleBgColor(hex)}
              title="Color de Fondo del Papel"
              presets={[
                { label: 'Blanco Galería', hex: '#FFFFFF' },
                { label: 'Off-White / Crema', hex: '#FBFBFA' },
                { label: 'Gris Estudio', hex: '#F3F4F6' },
                { label: 'Negro Mate', hex: '#121212' },
                { label: 'Azul Noche', hex: '#0B132B' },
                { label: 'Borgoña', hex: '#1C0D13' },
                { label: 'Verde Pino', hex: '#0A1C14' },
              ]}
            />
          </div>
        </div>

        {/* 4. Ambient Blurred Album Cover Background */}
        <div className="pt-3 border-t border-neutral-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Fondo de Carátula Difuminado
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.enableBlurredBackground}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    enableBlurredBackground: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Crea un fondo ambiental y cinematográfico proyectando la portada desenfocada detrás del póster.
          </p>

          {config.enableBlurredBackground && (
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-3.5 animate-fadeIn">
              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Opacidad / Intensidad</span>
                  <span className="font-mono text-emerald-400">
                    {Math.round((config.blurredBackgroundOpacity ?? 0.65) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={config.blurredBackgroundOpacity ?? 0.65}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      blurredBackgroundOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
              </div>

              {/* Blur Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Nivel de Desenfoque</span>
                  <span className="font-mono text-emerald-400">
                    {config.blurredBackgroundBlur ?? 35} px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="2"
                  value={config.blurredBackgroundBlur ?? 35}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      blurredBackgroundBlur: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
              </div>

              {/* Overlay Contrast Tint */}
              <div>
                <label className="block text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1.5">
                  Capa de Contraste
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'dark', label: 'Oscura' },
                    { id: 'light', label: 'Clara' },
                    { id: 'paper', label: 'Color Papel' },
                  ].map((tint) => (
                    <button
                      key={tint.id}
                      type="button"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          blurredBackgroundOverlay: tint.id as 'dark' | 'light' | 'paper',
                        }))
                      }
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        (config.blurredBackgroundOverlay || 'dark') === tint.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {tint.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Text Contrast Presets */}
              <div className="pt-2 border-t border-neutral-800/80">
                <span className="block text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1.5">
                  Contraste Rápido de Textos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        textColor: '#FFFFFF',
                        album: {
                          ...prev.album,
                          titleColor: '#FFFFFF',
                          artistColor: '#E5E7EB',
                          tracklistColor: '#F3F4F6',
                          soundwaveColor: '#FFFFFF',
                        },
                        player: {
                          ...prev.player,
                          titleColor: '#FFFFFF',
                          artistColor: '#E5E7EB',
                          soundwaveColor: '#FFFFFF',
                        },
                      }))
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-medium text-white hover:bg-neutral-700 transition-colors shadow-sm"
                  >
                    <span>⚪ Textos Blancos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        textColor: '#000000',
                        album: {
                          ...prev.album,
                          titleColor: '#000000',
                          artistColor: '#374151',
                          tracklistColor: '#1F2937',
                          soundwaveColor: '#000000',
                        },
                        player: {
                          ...prev.player,
                          titleColor: '#000000',
                          artistColor: '#4B5563',
                          soundwaveColor: '#000000',
                        },
                      }))
                    }
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors shadow-sm"
                  >
                    <span>⚫ Textos Negros</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guides toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
            Guías de corte y sangría (Pre-prensa)
          </span>
          <button
            type="button"
            onClick={onToggleGuides}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
              showGuides
                ? 'bg-neutral-800 text-neutral-200 border-neutral-700'
                : 'bg-transparent text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
          >
            {showGuides ? 'Ocultar guías' : 'Mostrar guías'}
          </button>
        </div>
      </div>
    </div>
  );
};
