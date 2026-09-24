'use client';

import React, { useState, useEffect } from 'react';
import { Accordion } from '@chakra-ui/react';
import { PosterConfig, TemplateType, PrintSizeKey, PresetPrintSizeKey } from '@/types/poster';
import {
  PRINT_SIZES,
  PRESET_PRINT_SIZE_KEYS,
  DEFAULT_CUSTOM_SIZE,
  getActivePrintSize,
} from '@/lib/constants/printSizes';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';
import { DEFAULT_PALETTE } from '@/lib/colorPalette';
import {
  Layers,
  Disc3,
  Music2,
  LayoutTemplate,
  Palette,
  Sparkles,
  Eye,
  ChevronDown,
  Sliders,
  ArrowLeftRight,
} from 'lucide-react';

interface LayoutControlsProps {
  config: PosterConfig;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
  showGuides: boolean;
  onToggleGuides: () => void;
}

const ALL_SECTIONS = ['formato', 'fondo'];

interface CustomSizeEditorProps {
  config: PosterConfig;
  activePrintSize: any;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
}

const CustomSizeEditor: React.FC<CustomSizeEditorProps> = ({
  config,
  activePrintSize,
  onChange,
}) => {
  const currentW = config.customSize?.widthCm ?? DEFAULT_CUSTOM_SIZE.widthCm;
  const currentH = config.customSize?.heightCm ?? DEFAULT_CUSTOM_SIZE.heightCm;

  const [widthStr, setWidthStr] = useState<string>(String(currentW));
  const [heightStr, setHeightStr] = useState<string>(String(currentH));

  // Mantener sincronizado cuando se cambian los valores externamente (chips o invertir orientación)
  useEffect(() => {
    setWidthStr(String(currentW));
  }, [currentW]);

  useEffect(() => {
    setHeightStr(String(currentH));
  }, [currentH]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setWidthStr(raw);

    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      onChange((prev) => ({
        ...prev,
        sizeKey: 'custom',
        customSize: {
          widthCm: Math.min(500, parsed),
          heightCm: prev.customSize?.heightCm ?? DEFAULT_CUSTOM_SIZE.heightCm,
        },
      }));
    }
  };

  const handleWidthBlur = () => {
    const parsed = parseFloat(widthStr.replace(',', '.'));
    if (isNaN(parsed) || parsed < 5) {
      const fallback = isNaN(parsed) ? DEFAULT_CUSTOM_SIZE.widthCm : 5;
      setWidthStr(String(fallback));
      onChange((prev) => ({
        ...prev,
        sizeKey: 'custom',
        customSize: {
          widthCm: fallback,
          heightCm: prev.customSize?.heightCm ?? DEFAULT_CUSTOM_SIZE.heightCm,
        },
      }));
    } else if (parsed > 300) {
      setWidthStr('300');
      onChange((prev) => ({
        ...prev,
        sizeKey: 'custom',
        customSize: {
          widthCm: 300,
          heightCm: prev.customSize?.heightCm ?? DEFAULT_CUSTOM_SIZE.heightCm,
        },
      }));
    } else {
      setWidthStr(String(parsed));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHeightStr(raw);

    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      onChange((prev) => ({
        ...prev,
        sizeKey: 'custom',
        customSize: {
          widthCm: prev.customSize?.widthCm ?? DEFAULT_CUSTOM_SIZE.widthCm,
          heightCm: Math.min(500, parsed),
        },
      }));
    }
  };

  const handleHeightBlur = () => {
    const parsed = parseFloat(heightStr.replace(',', '.'));
    if (isNaN(parsed) || parsed < 5) {
      const fallback = isNaN(parsed) ? DEFAULT_CUSTOM_SIZE.heightCm : 5;
      setHeightStr(String(fallback));
      onChange((prev) => ({
        ...prev,
        sizeKey: 'custom',
        customSize: {
          widthCm: prev.customSize?.widthCm ?? DEFAULT_CUSTOM_SIZE.widthCm,
          heightCm: fallback,
        },
      }));
    } else if (parsed > 300) {
      setHeightStr('300');
      onChange((prev) => ({
        ...prev,
        sizeKey: 'custom',
        customSize: {
          widthCm: prev.customSize?.widthCm ?? DEFAULT_CUSTOM_SIZE.widthCm,
          heightCm: 300,
        },
      }));
    } else {
      setHeightStr(String(parsed));
    }
  };

  const handleSwap = () => {
    onChange((prev) => ({
      ...prev,
      sizeKey: 'custom',
      customSize: {
        widthCm: currentH,
        heightCm: currentW,
      },
    }));
  };

  return (
    <div className="mt-2 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3 shadow-inner">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            Ancho (cm)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={widthStr}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
              placeholder="40"
              className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono pointer-events-none">
              cm
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            Alto (cm)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={heightStr}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
              placeholder="50"
              className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono pointer-events-none">
              cm
            </span>
          </div>
        </div>
      </div>

      {/* Botón de invertir orientación + Ratio */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleSwap}
          className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-300 hover:text-emerald-300 px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 transition-colors border border-neutral-700/70"
          title="Intercambiar ancho y alto"
        >
          <ArrowLeftRight className="w-3 h-3 text-emerald-400" />
          <span>Invertir orientación</span>
        </button>

        <div className="text-[10px] font-mono text-neutral-400">
          Ratio: <span className="text-emerald-400 font-semibold">{activePrintSize.aspectRatioRatio.toFixed(2)}</span>
        </div>
      </div>

      {/* Atajos de marcos populares en cm */}
      <div>
        <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
          Medidas frecuentes (cm)
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { label: '24.8 × 29.8', w: 24.8, h: 29.8 },
            { label: '29.8 × 39.8', w: 29.8, h: 39.8 },
            { label: '39.8 × 49.8', w: 39.8, h: 49.8 },
            { label: '49.8 × 69.8', w: 49.8, h: 69.8 },
            { label: '30 × 30', w: 30, h: 30 },
            { label: '50 × 50', w: 50, h: 50 },
          ].map((preset) => {
            const isPresetActive = currentW === preset.w && currentH === preset.h;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange((prev) => ({
                    ...prev,
                    sizeKey: 'custom',
                    customSize: {
                      widthCm: preset.w,
                      heightCm: preset.h,
                    },
                  }));
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${isPresetActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const LayoutControls: React.FC<LayoutControlsProps> = ({
  config,
  onChange,
  showGuides,
  onToggleGuides,
}) => {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const activePrintSize = getActivePrintSize(config);

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
    <Accordion.Root
      multiple
      collapsible
      value={openSections}
      onValueChange={(e) => setOpenSections(e.value)}
      className="w-full divide-y divide-neutral-800/70"
    >
      {/* ========================================================================= */}
      {/* SECCIÓN 1: FORMATO & MEDIDAS */}
      {/* ========================================================================= */}
      <Accordion.Item value="formato" className="border-none">
        <Accordion.ItemTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-850/50 transition-colors cursor-pointer group text-left">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Formato & Medidas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {config.template === 'album-gallery'
                ? 'Galería'
                : config.template === 'album-classic'
                  ? 'Clásico'
                  : 'Placa'} • {activePrintSize.id === 'custom' ? `${activePrintSize.widthMm / 10} × ${activePrintSize.heightMm / 10} cm` : activePrintSize.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${openSections.includes('formato') ? 'rotate-180' : ''
                }`}
            />
          </div>
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-4 text-xs">
            {/* Plantilla de Diseño */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Plantilla de Diseño
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateChange('album-gallery')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${config.template === 'album-gallery'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30 font-medium'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                >
                  <Disc3 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold">Galería Álbum</div>
                    <div className="text-[10px] opacity-70">Tracklist + Suizo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTemplateChange('album-classic')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${config.template === 'album-classic'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30 font-medium'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                >
                  <LayoutTemplate className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold">Álbum Clásico</div>
                    <div className="text-[10px] opacity-70">Línea + Metadata</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTemplateChange('song-player')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${config.template === 'song-player'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30 font-medium'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                >
                  <Music2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold">Placa Canción</div>
                    <div className="text-[10px] opacity-70">Timeline + Player</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Formato Físico (300 DPI) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Formato Físico (300 DPI Reales)
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  {activePrintSize.widthPx300Dpi} × {activePrintSize.heightPx300Dpi} px
                </span>
              </div>

              {/* Presets estándar */}
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_PRINT_SIZE_KEYS.map((key) => {
                  const size = PRINT_SIZES[key];
                  const isSelected = config.sizeKey === key;
                  const usageMap: Record<PresetPrintSizeKey, string> = {
                    '24.8x29.8': 'Marco 25 × 30 cm estándar',
                    '29.8x39.8': 'Marco 30 × 40 cm estándar',
                    '39.8x49.8': 'Marco 40 × 50 cm estándar',
                    '49.8x69.8': 'Marco 50 × 70 cm estándar',
                  };

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSizeChange(key)}
                      className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2.5 ${isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                    >
                      {/* Miniature Paper Silhouette */}
                      <div className="w-6 h-8 flex items-center justify-center flex-shrink-0 bg-neutral-950/80 rounded border border-neutral-800 p-0.5">
                        <div
                          className={`border transition-colors ${isSelected
                              ? 'border-emerald-400 bg-emerald-500/30'
                              : 'border-neutral-600 bg-neutral-800/40'
                            }`}
                          style={{
                            aspectRatio: `${size.widthMm} / ${size.heightMm}`,
                            height: '100%',
                            maxHeight: '24px',
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-200">{size.name}</span>
                          <span className="text-[9px] font-mono text-neutral-400 font-semibold">
                            {(size.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × {(size.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {usageMap[key]} • Ratio {size.aspectRatioRatio.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Opción Tamaño Personalizado */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onChange((prev) => ({
                        ...prev,
                        sizeKey: 'custom',
                        customSize: prev.customSize || DEFAULT_CUSTOM_SIZE,
                      }));
                    }}
                    className={`w-full p-2 rounded-lg border text-left transition-all flex items-center gap-2.5 ${config.sizeKey === 'custom'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                  >
                    {/* Miniature Custom Icon */}
                    <div className="w-6 h-8 flex items-center justify-center flex-shrink-0 bg-neutral-950/80 rounded border border-neutral-800 p-0.5">
                      <Sliders
                        className={`w-3.5 h-3.5 transition-colors ${config.sizeKey === 'custom' ? 'text-emerald-400' : 'text-neutral-500'
                          }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-200">Personalizado</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                          {config.sizeKey === 'custom'
                            ? `${(activePrintSize.widthMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} × ${(activePrintSize.heightMm / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm`
                            : 'A tu medida'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                        Elige ancho y alto libre en centímetros
                      </div>
                    </div>
                  </button>

                  {/* Panel expandible de controles para tamaño personalizado */}
                  {config.sizeKey === 'custom' && (
                    <CustomSizeEditor
                      config={config}
                      activePrintSize={activePrintSize}
                      onChange={onChange}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Prepress Cutting Guides Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                Guías de corte y sangría (Pre-prensa)
              </span>
              <button
                type="button"
                onClick={onToggleGuides}
                className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${showGuides
                    ? 'bg-neutral-800 text-neutral-200 border-neutral-700'
                    : 'bg-transparent text-neutral-500 border-neutral-800 hover:text-neutral-300'
                  }`}
              >
                {showGuides ? 'Ocultar guías' : 'Mostrar guías'}
              </button>
            </div>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: FONDO & ATMÓSFERA */}
      {/* ========================================================================= */}
      <Accordion.Item value="fondo" className="border-none">
        <Accordion.ItemTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-850/50 transition-colors cursor-pointer group text-left">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Fondo & Atmósfera
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm border border-neutral-700 shadow-sm"
              style={{ backgroundColor: config.backgroundColor || '#FFFFFF' }}
              title={`Color actual: ${config.backgroundColor || '#FFFFFF'}`}
            />
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              {config.backgroundColor || '#FFFFFF'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${openSections.includes('fondo') ? 'rotate-180' : ''
                }`}
            />
          </div>
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-4 text-xs">
            {/* Paper Color Swatches & Hex */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Color de Fondo del Papel
                </label>
                {/* Paleta dinámica de 5 colores del álbum para el Fondo */}
                <div className="flex items-center gap-1.5">
                  {(config.album.palette && config.album.palette.length > 0
                    ? config.album.palette.slice(0, 5)
                    : DEFAULT_PALETTE
                  ).map((colorHex, idx) => (
                    <button
                      key={`${colorHex}-${idx}`}
                      type="button"
                      title={`Color del álbum ${idx + 1}: ${colorHex}`}
                      onClick={() => handleBgColor(colorHex)}
                      className={`w-4 h-4 rounded-full border shadow-sm transition-transform ${config.backgroundColor?.toUpperCase() === colorHex.toUpperCase()
                          ? 'scale-125 border-emerald-500 ring-2 ring-emerald-500/40'
                          : 'border-neutral-700 hover:scale-110'
                        }`}
                      style={{ backgroundColor: colorHex }}
                    />
                  ))}
                </div>
              </div>

              {/* Direct Hex Input + Popover */}
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
                    className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono text-neutral-200 uppercase focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <ColorPickerPopover
                  color={config.backgroundColor || '#FFFFFF'}
                  onChange={(hex) => handleBgColor(hex)}
                  title="Color de Fondo del Papel"
                  presets={[
                    ...(config.album.palette?.slice(0, 5).map((hex, i) => ({
                      label: `Color Álbum ${i + 1}`,
                      hex,
                    })) || []),
                    { label: 'Blanco Galería', hex: '#FFFFFF' },
                    { label: 'Off-White / Crema', hex: '#FBFBFA' },
                    { label: 'Gris Estudio', hex: '#F3F4F6' },
                    { label: 'Negro Mate', hex: '#121212' },
                  ]}
                />
              </div>
            </div>

            {/* Ambient Blurred Album Cover Background */}
            <div className="pt-3 border-t border-neutral-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Fondo de Portada Difuminado
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
                  <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Genera un aura cinematográfica proyectando la portada desenfocada en el lienzo.
              </p>

              {config.enableBlurredBackground && (
                <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-3 animate-fadeIn">
                  {/* Opacity */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Opacidad / Intensidad</span>
                      <span className="font-mono text-emerald-400 font-semibold">
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

                  {/* Blur Level */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Desenfoque (Blur)</span>
                      <span className="font-mono text-emerald-400 font-semibold">
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

                  {/* Contrast Tint */}
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">
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
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${(config.blurredBackgroundOverlay || 'dark') === tint.id
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                              : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                          {tint.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Contrast Presets */}
                  <div className="pt-2 border-t border-neutral-800/80">
                    <span className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">
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
                        className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-[11px] font-medium text-white hover:bg-neutral-700 transition-colors shadow-sm"
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
                        className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-[11px] font-medium text-neutral-200 hover:bg-neutral-700 transition-colors shadow-sm"
                      >
                        <span>⚫ Textos Negros</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
};
