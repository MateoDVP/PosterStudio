'use client';

import React, { useRef, useState } from 'react';
import { Accordion } from '@chakra-ui/react';
import { PosterConfig, TrackItem } from '@/types/poster';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';
import {
  Type,
  Image as ImageIcon,
  ListMusic,
  Radio,
  Upload,
  Plus,
  Trash2,
  Heart,
  Check,
  ChevronDown,
  Sliders,
  Play,
  Pause,
} from 'lucide-react';

interface AlbumControlsProps {
  config: PosterConfig;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
}

export const AlbumControls: React.FC<AlbumControlsProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const album = config.album;
  const player = config.player;
  const isAlbum = config.template === 'album-gallery' || config.template === 'album-classic';

  const updateAlbum = (partial: Partial<typeof album>) => {
    onChange((prev) => ({
      ...prev,
      album: {
        ...prev.album,
        ...partial,
      },
    }));
  };

  const updatePlayer = (partial: Partial<typeof player>) => {
    onChange((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        ...partial,
      },
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        if (isAlbum) {
          updateAlbum({ coverUrl: base64 });
        } else {
          updatePlayer({ coverUrl: base64 });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTrackChange = (index: number, title: string) => {
    const updatedTracks = [...album.tracks];
    updatedTracks[index] = {
      ...updatedTracks[index],
      title,
    };
    updateAlbum({ tracks: updatedTracks });
  };

  const handleAddTrack = () => {
    const nextNumber = album.tracks.length + 1;
    const newTrack: TrackItem = {
      id: `custom-track-${Date.now()}`,
      number: nextNumber,
      title: `Pista ${nextNumber}`,
    };
    updateAlbum({ tracks: [...album.tracks, newTrack] });
  };

  const handleRemoveTrack = (index: number) => {
    const updatedTracks = album.tracks
      .filter((_, i) => i !== index)
      .map((t, idx) => ({ ...t, number: idx + 1 }));
    updateAlbum({ tracks: updatedTracks });
  };

  // Current cover info
  const activeCoverUrl = isAlbum ? album.coverUrl : player.coverUrl;
  const activeItunesUrl = isAlbum ? album.itunesCoverUrl : player.itunesCoverUrl;
  const activeSpotifyUrl = isAlbum ? album.spotifyCoverUrl : player.spotifyCoverUrl;

  const handleSelectOfficialCover = (url: string) => {
    if (isAlbum) {
      updateAlbum({ coverUrl: url });
    } else {
      updatePlayer({ coverUrl: url });
    }
  };

  const activeSoundwaveColor = isAlbum
    ? album.soundwaveColor || '#000000'
    : player.soundwaveColor || '#000000';

  const handleSoundwaveColor = (color: string) => {
    if (isAlbum) {
      updateAlbum({ soundwaveColor: color });
    } else {
      updatePlayer({ soundwaveColor: color });
    }
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
      {/* SECCIÓN 1: CARÁTULA & ARTE */}
      {/* ========================================================================= */}
      <Accordion.Item value="caratula" className="border-none">
        <Accordion.ItemTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-850/50 transition-colors cursor-pointer group text-left">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Carátula & Arte
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeCoverUrl ? (
              activeCoverUrl.includes('mzstatic.com') || activeCoverUrl.includes('3000x3000') ? (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  3000px
                </span>
              ) : activeCoverUrl.includes('scdn.co') ? (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  640px
                </span>
              ) : (
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                  HD
                </span>
              )
            ) : null}
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${openSections.includes('caratula') ? 'rotate-180' : ''
                }`}
            />
          </div>
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-4 text-xs">
            {/* Selector oficial de fuente dual (Apple Music 3000px vs Spotify 640px) */}
            {(activeItunesUrl || activeSpotifyUrl) && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Fuente Oficial de Imagen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Opción Apple Music */}
                  <button
                    type="button"
                    disabled={!activeItunesUrl}
                    onClick={() => activeItunesUrl && handleSelectOfficialCover(activeItunesUrl)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${activeCoverUrl === activeItunesUrl
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                        : activeItunesUrl
                          ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          : 'border-neutral-900 bg-neutral-950/40 text-neutral-600 opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-950 flex-shrink-0 overflow-hidden border border-neutral-800">
                      {activeItunesUrl ? (
                        <img src={activeItunesUrl} alt="Apple Music Master" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600">N/A</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold flex items-center gap-1">
                        <span>Apple Music</span>
                        {activeCoverUrl === activeItunesUrl && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="text-[9.5px] font-mono text-emerald-400 font-semibold">3000 × 3000 px</div>
                    </div>
                  </button>

                  {/* Opción Spotify */}
                  <button
                    type="button"
                    disabled={!activeSpotifyUrl}
                    onClick={() => activeSpotifyUrl && handleSelectOfficialCover(activeSpotifyUrl)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${activeCoverUrl === activeSpotifyUrl
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                        : activeSpotifyUrl
                          ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          : 'border-neutral-900 bg-neutral-950/40 text-neutral-600 opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-950 flex-shrink-0 overflow-hidden border border-neutral-800">
                      {activeSpotifyUrl ? (
                        <img src={activeSpotifyUrl} alt="Spotify Original" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600">N/A</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold flex items-center gap-1">
                        <span>Spotify</span>
                        {activeCoverUrl === activeSpotifyUrl && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="text-[9.5px] font-mono text-amber-400 font-semibold">640 × 640 px</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Subida personalizada de archivo o URL */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {config.template === 'song-player' ? 'Foto Personal o Carátula' : 'Cargar Archivo Local'}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex-shrink-0 relative">
                  {activeCoverUrl ? (
                    <img
                      src={activeCoverUrl}
                      alt="Cover preview"
                      className={`w-full h-full object-cover ${config.template === 'song-player' && player.isBlackAndWhite ? 'grayscale' : ''
                        }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Subir Imagen Local (HD)</span>
                  </button>
                  <input
                    type="text"
                    placeholder="O pega URL de imagen..."
                    value={activeCoverUrl?.startsWith('data:') ? 'Imagen local cargada' : activeCoverUrl || ''}
                    onChange={(e) => {
                      if (isAlbum) {
                        updateAlbum({ coverUrl: e.target.value });
                      } else {
                        updatePlayer({ coverUrl: e.target.value });
                      }
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Song Player Photo Controls */}
            {config.template === 'song-player' && (
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300">Filtro Blanco y Negro</span>
                  <input
                    type="checkbox"
                    checked={player.isBlackAndWhite}
                    onChange={(e) => updatePlayer({ isBlackAndWhite: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Radio de Esquinas de la Foto</span>
                    <span className="font-mono text-neutral-200 font-semibold">{player.coverBorderRadius ?? 8}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    value={player.coverBorderRadius ?? 8}
                    onChange={(e) => updatePlayer({ coverBorderRadius: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                  />
                </div>
              </div>
            )}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: TIPOGRAFÍA & TEXTOS */}
      {/* ========================================================================= */}
      <Accordion.Item value="tipografia" className="border-none">
        <Accordion.ItemTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-850/50 transition-colors cursor-pointer group text-left">
          <div className="flex items-center gap-2.5">
            <Type className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Tipografía & Textos
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${openSections.includes('tipografia') ? 'rotate-180' : ''
              }`}
          />
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-3.5 text-xs">
            {/* Título */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                {isAlbum ? 'Título del Álbum' : 'Título de la Canción'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={isAlbum ? album.title : player.title}
                  onChange={(e) => {
                    if (isAlbum) {
                      updateAlbum({ title: e.target.value });
                    } else {
                      updatePlayer({ title: e.target.value });
                    }
                  }}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 font-semibold focus:outline-none focus:border-emerald-500"
                />
                <ColorPickerPopover
                  title="Color del Título"
                  color={
                    isAlbum
                      ? album.titleColor || '#000000'
                      : player.titleColor || '#000000'
                  }
                  onChange={(c) => {
                    if (isAlbum) {
                      updateAlbum({ titleColor: c });
                    } else {
                      updatePlayer({ titleColor: c });
                    }
                  }}
                />
              </div>
            </div>

            {/* Control numérico de Tamaño del Título (px) */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-300">
                  Tamaño del Título
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={12}
                    max={72}
                    value={
                      isAlbum
                        ? (album.titleFontSize ?? (config.template === 'album-classic' ? 26 : 24))
                        : (player.titleFontSize ?? 18)
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        const clamped = Math.max(10, Math.min(80, val));
                        if (isAlbum) {
                          updateAlbum({ titleFontSize: clamped });
                        } else {
                          updatePlayer({ titleFontSize: clamped });
                        }
                      }
                    }}
                    className="w-14 bg-neutral-950 border border-neutral-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">px</span>
                </div>
              </div>

              {/* Slider interactivo */}
              <input
                type="range"
                min="14"
                max="60"
                step="1"
                value={
                  isAlbum
                    ? (album.titleFontSize ?? (config.template === 'album-classic' ? 26 : 24))
                    : (player.titleFontSize ?? 18)
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (isAlbum) {
                    updateAlbum({ titleFontSize: val });
                  } else {
                    updatePlayer({ titleFontSize: val });
                  }
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />

              {/* Atajos rápidos en px */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                {[
                  { label: 'Normal', size: 20 },
                  { label: 'Medio', size: 26 },
                  { label: 'Grande', size: 32 },
                  { label: 'Extra', size: 40 },
                ].map((preset) => {
                  const currentSize = isAlbum
                    ? (album.titleFontSize ?? (config.template === 'album-classic' ? 26 : 24))
                    : (player.titleFontSize ?? 18);
                  const isSelected = currentSize === preset.size;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (isAlbum) {
                          updateAlbum({ titleFontSize: preset.size });
                        } else {
                          updatePlayer({ titleFontSize: preset.size });
                        }
                      }}
                      className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors ${isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                        }`}
                    >
                      {preset.label} ({preset.size})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uppercase Switch (para Álbum) */}
            {isAlbum && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Mayúsculas en Título (Uppercase)</span>
                <input
                  type="checkbox"
                  checked={album.uppercaseTitle}
                  onChange={(e) => updateAlbum({ uppercaseTitle: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Artista */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Artista
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={isAlbum ? album.artist : player.artist}
                  onChange={(e) => {
                    if (isAlbum) {
                      updateAlbum({ artist: e.target.value });
                    } else {
                      updatePlayer({ artist: e.target.value });
                    }
                  }}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
                <ColorPickerPopover
                  title="Color del Artista"
                  color={
                    isAlbum
                      ? album.artistColor || album.titleColor || '#404040'
                      : player.artistColor || '#737373'
                  }
                  onChange={(c) => {
                    if (isAlbum) {
                      updateAlbum({ artistColor: c });
                    } else {
                      updatePlayer({ artistColor: c });
                    }
                  }}
                />
              </div>
            </div>

            {/* Control numérico de Tamaño del Artista (px) */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-300">
                  Tamaño del Artista
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={8}
                    max={40}
                    value={
                      isAlbum
                        ? (album.artistFontSize ?? 14)
                        : (player.artistFontSize ?? 13)
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        const clamped = Math.max(6, Math.min(50, val));
                        if (isAlbum) {
                          updateAlbum({ artistFontSize: clamped });
                        } else {
                          updatePlayer({ artistFontSize: clamped });
                        }
                      }
                    }}
                    className="w-14 bg-neutral-950 border border-neutral-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">px</span>
                </div>
              </div>

              {/* Slider interactivo */}
              <input
                type="range"
                min="8"
                max="36"
                step="1"
                value={
                  isAlbum
                    ? (album.artistFontSize ?? 14)
                    : (player.artistFontSize ?? 13)
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (isAlbum) {
                    updateAlbum({ artistFontSize: val });
                  } else {
                    updatePlayer({ artistFontSize: val });
                  }
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />

              {/* Atajos rápidos en px */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                {[
                  { label: 'Sutil', size: 11 },
                  { label: 'Normal', size: 14 },
                  { label: 'Medio', size: 18 },
                  { label: 'Grande', size: 24 },
                ].map((preset) => {
                  const currentSize = isAlbum
                    ? (album.artistFontSize ?? 14)
                    : (player.artistFontSize ?? 13);
                  const isSelected = currentSize === preset.size;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (isAlbum) {
                          updateAlbum({ artistFontSize: preset.size });
                        } else {
                          updatePlayer({ artistFontSize: preset.size });
                        }
                      }}
                      className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors ${isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                        }`}
                    >
                      {preset.label} ({preset.size})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha / Año y Duración con Colores Independientes */}
            {isAlbum && (
              <div className="space-y-3 pt-1">
                {/* Fecha de Lanzamiento */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Fecha de Lanzamiento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Septiembre 07, 2026"
                      value={album.releaseDate}
                      onChange={(e) => updateAlbum({ releaseDate: e.target.value })}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                    />
                    <ColorPickerPopover
                      title="Color de Fecha de Lanzamiento"
                      color={album.releaseDateColor || album.titleColor || '#000000'}
                      onChange={(c) => updateAlbum({ releaseDateColor: c })}
                    />
                  </div>
                </div>

                {/* Duración del Álbum */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Duración del Álbum
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 54 min 20 seg o 1 h 14 min"
                      value={album.totalDuration || ''}
                      onChange={(e) => updateAlbum({ totalDuration: e.target.value })}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                    />
                    <ColorPickerPopover
                      title="Color de Duración del Álbum"
                      color={album.durationColor || album.titleColor || '#000000'}
                      onChange={(c) => updateAlbum({ durationColor: c })}
                    />
                  </div>
                </div>

                {/* Control numérico de Tamaño de Fecha y Duración (Metadatos) */}
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-neutral-300">
                        Tamaño de Fecha y Duración
                      </span>
                      <p className="text-[9.5px] text-neutral-500">
                        El título (Release Date) se ajusta proporcionalmente
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={7}
                        max={26}
                        value={album.metadataFontSize ?? 12}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            const clamped = Math.max(7, Math.min(30, val));
                            updateAlbum({ metadataFontSize: clamped });
                          }
                        }}
                        className="w-14 bg-neutral-950 border border-neutral-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-neutral-500 font-mono">px</span>
                    </div>
                  </div>

                  {/* Slider interactivo */}
                  <input
                    type="range"
                    min="8"
                    max="22"
                    step="1"
                    value={album.metadataFontSize ?? 12}
                    onChange={(e) => updateAlbum({ metadataFontSize: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                  />

                  {/* Atajos rápidos en px */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {[
                      { label: 'Compacto', size: 10 },
                      { label: 'Normal', size: 12 },
                      { label: 'Medio', size: 15 },
                      { label: 'Grande', size: 18 },
                    ].map((preset) => {
                      const currentSize = album.metadataFontSize ?? 12;
                      const isSelected = currentSize === preset.size;

                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateAlbum({ metadataFontSize: preset.size })}
                          className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors ${isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                            }`}
                        >
                          {preset.label} ({preset.size}px)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Paleta de Colores en Póster / Placa (5 Cuadros de la carátula) */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-300 font-medium">
                    {config.template === 'song-player'
                      ? 'Paleta de Colores (5 Rectángulos al pie)'
                      : 'Paleta de Colores en Póster'}
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {config.template === 'song-player'
                      ? '5 franjas de color al pie de la placa'
                      : '5 cuadros encima del artista'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={
                    config.template === 'song-player'
                      ? player.showPalette !== false
                      : album.showPalette !== false
                  }
                  onChange={(e) => {
                    if (config.template === 'song-player') {
                      updatePlayer({ showPalette: e.target.checked });
                    } else {
                      updateAlbum({ showPalette: e.target.checked });
                    }
                  }}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              {((config.template === 'song-player' ? player.palette || album.palette : album.palette) || []).length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {(config.template === 'song-player' ? player.palette || album.palette : album.palette)!
                    .slice(0, 5)
                    .map((hex, idx) => {
                      const hasBorder = isAlbum ? album.paletteBorder !== false : player.paletteBorder !== false;
                      const borderColor = (isAlbum ? album.paletteBorderColor : player.paletteBorderColor) || '#FFFFFF';

                      return (
                        <div
                          key={`${hex}-${idx}`}
                          className="w-5 h-5 rounded-[3px] flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: hex,
                            border: hasBorder ? `1.5px solid ${borderColor}` : 'none',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                          }}
                          title={hex}
                        />
                      );
                    })}
                </div>
              )}

              {/* Control de Borde en Cuadros de Paleta */}
              {((config.template === 'song-player' ? player.showPalette !== false : album.showPalette !== false)) && (
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-neutral-300">
                        Borde en los Cuadros
                      </span>
                      <p className="text-[9.5px] text-neutral-500">
                        Línea perimetral alrededor de cada muestra
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        config.template === 'song-player'
                          ? player.paletteBorder !== false
                          : album.paletteBorder !== false
                      }
                      onChange={(e) => {
                        if (config.template === 'song-player') {
                          updatePlayer({ paletteBorder: e.target.checked });
                        } else {
                          updateAlbum({ paletteBorder: e.target.checked });
                        }
                      }}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Opciones de Color del Borde (Visible solo si el borde está activado) */}
                  {(config.template === 'song-player' ? player.paletteBorder !== false : album.paletteBorder !== false) && (
                    <div className="pt-2 border-t border-neutral-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-medium text-neutral-400">
                          Color del Borde:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Botón rápido Blanco (Por defecto) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (config.template === 'song-player') {
                                updatePlayer({ paletteBorderColor: '#FFFFFF' });
                              } else {
                                updateAlbum({ paletteBorderColor: '#FFFFFF' });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                              ((config.template === 'song-player' ? player.paletteBorderColor : album.paletteBorderColor) || '#FFFFFF').toUpperCase() === '#FFFFFF'
                                ? 'bg-white text-neutral-950 border-white shadow-sm'
                                : 'bg-neutral-950/60 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-white border border-neutral-400 inline-block" />
                            Blanco
                          </button>

                          {/* Botón rápido Negro */}
                          <button
                            type="button"
                            onClick={() => {
                              if (config.template === 'song-player') {
                                updatePlayer({ paletteBorderColor: '#000000' });
                              } else {
                                updateAlbum({ paletteBorderColor: '#000000' });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                              (config.template === 'song-player' ? player.paletteBorderColor : album.paletteBorderColor) === '#000000'
                                ? 'bg-neutral-900 text-white border-neutral-400 shadow-sm'
                                : 'bg-neutral-950/60 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-black border border-neutral-600 inline-block" />
                            Negro
                          </button>

                          {/* ColorPickerPopover para cualquier color personalizado */}
                          <ColorPickerPopover
                            title="Color del Borde de la Paleta"
                            color={
                              (config.template === 'song-player'
                                ? player.paletteBorderColor
                                : album.paletteBorderColor) || '#FFFFFF'
                            }
                            onChange={(c) => {
                              if (config.template === 'song-player') {
                                updatePlayer({ paletteBorderColor: c });
                              } else {
                                updateAlbum({ paletteBorderColor: c });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Control numérico y slider de Tamaño de la Paleta */}
              {((config.template === 'song-player' ? player.showPalette !== false : album.showPalette !== false)) && (
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-neutral-300">
                        {config.template === 'song-player' ? 'Altura de la Paleta' : 'Tamaño de los Cuadros de Color'}
                      </span>
                      <p className="text-[9.5px] text-neutral-500">
                        {config.template === 'song-player' ? 'Grosor de las franjas al pie' : 'Escala de las muestras de color'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={config.template === 'song-player' ? 6 : 14}
                        max={config.template === 'song-player' ? 36 : 60}
                        value={
                          config.template === 'song-player'
                            ? (player.paletteSize ?? 14)
                            : (album.paletteSize ?? 24)
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            const minVal = config.template === 'song-player' ? 6 : 12;
                            const maxVal = config.template === 'song-player' ? 40 : 70;
                            const clamped = Math.max(minVal, Math.min(maxVal, val));
                            if (config.template === 'song-player') {
                              updatePlayer({ paletteSize: clamped });
                            } else {
                              updateAlbum({ paletteSize: clamped });
                            }
                          }
                        }}
                        className="w-14 bg-neutral-950 border border-neutral-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-neutral-500 font-mono">px</span>
                    </div>
                  </div>

                  {/* Slider interactivo */}
                  <input
                    type="range"
                    min={config.template === 'song-player' ? 6 : 14}
                    max={config.template === 'song-player' ? 32 : 54}
                    step="1"
                    value={
                      config.template === 'song-player'
                        ? (player.paletteSize ?? 14)
                        : (album.paletteSize ?? 24)
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (config.template === 'song-player') {
                        updatePlayer({ paletteSize: val });
                      } else {
                        updateAlbum({ paletteSize: val });
                      }
                    }}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                  />

                  {/* Atajos rápidos en px */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {(config.template === 'song-player'
                      ? [
                          { label: 'Fino', size: 10 },
                          { label: 'Normal', size: 14 },
                          { label: 'Medio', size: 18 },
                          { label: 'Grueso', size: 24 },
                        ]
                      : [
                          { label: 'Compacto', size: 18 },
                          { label: 'Normal', size: 24 },
                          { label: 'Medio', size: 28 },
                          { label: 'Grande', size: 36 },
                        ]
                    ).map((preset) => {
                      const currentSize = config.template === 'song-player'
                        ? (player.paletteSize ?? 14)
                        : (album.paletteSize ?? 24);
                      const isSelected = currentSize === preset.size;

                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (config.template === 'song-player') {
                              updatePlayer({ paletteSize: preset.size });
                            } else {
                              updateAlbum({ paletteSize: preset.size });
                            }
                          }}
                          className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors ${isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                            }`}
                        >
                          {preset.label} ({preset.size}px)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: PISTAS & TRACKLIST */}
      {/* ========================================================================= */}
      {isAlbum && (
        <Accordion.Item value="pistas" className="border-none">
          <Accordion.ItemTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-850/50 transition-colors cursor-pointer group text-left">
            <div className="flex items-center gap-2.5">
              <ListMusic className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Pistas & Tracklist
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                {album.tracks.length} pistas
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${openSections.includes('pistas') ? 'rotate-180' : ''
                  }`}
              />
            </div>
          </Accordion.ItemTrigger>

          <Accordion.ItemContent>
            <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-3.5 text-xs">
              {/* Columnas y Color */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400">Columnas:</span>
                  <button
                    type="button"
                    onClick={() => updateAlbum({ trackColumns: 1 })}
                    className={`px-2 py-1 text-[11px] rounded border transition-colors ${album.trackColumns === 1
                        ? 'bg-neutral-800 border-emerald-500 text-emerald-400 font-semibold'
                        : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                  >
                    1 Columna
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAlbum({ trackColumns: 2 })}
                    className={`px-2 py-1 text-[11px] rounded border transition-colors ${album.trackColumns === 2
                        ? 'bg-neutral-800 border-emerald-500 text-emerald-400 font-semibold'
                        : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                  >
                    2 Columnas
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400">Color:</span>
                  <ColorPickerPopover
                    title="Color de Pistas"
                    color={album.tracklistColor || '#000000'}
                    onChange={(c) => updateAlbum({ tracklistColor: c })}
                  />
                </div>
              </div>

              {/* Distribución personalizada de canciones por columna (Bloque 1 y Bloque 2) */}
              {album.trackColumns === 2 && album.tracks && album.tracks.length > 1 && (() => {
                const totalTracks = album.tracks.length;
                const defaultHalf = Math.ceil(totalTracks / 2);
                const currentCol1 = (album.col1TrackCount !== undefined && album.col1TrackCount > 0 && album.col1TrackCount < totalTracks)
                  ? album.col1TrackCount
                  : defaultHalf;
                const currentCol2 = totalTracks - currentCol1;

                return (
                  <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-neutral-300">
                        Canciones por Columna
                      </span>
                      <button
                        type="button"
                        onClick={() => updateAlbum({ col1TrackCount: undefined })}
                        className="text-[10px] text-neutral-400 hover:text-emerald-400 transition-colors"
                        title="Restablecer a 50/50 equilibrado"
                      >
                        Auto (50/50)
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-neutral-950/70 px-2.5 py-1.5 rounded border border-neutral-800/60">
                      <span className="text-emerald-400 font-semibold">
                        Bloque 1: {currentCol1} {currentCol1 === 1 ? 'canción' : 'canciones'}
                      </span>
                      <span className="text-neutral-600">|</span>
                      <span className="text-emerald-400 font-semibold">
                        Bloque 2: {currentCol2} {currentCol2 === 1 ? 'canción' : 'canciones'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => updateAlbum({ col1TrackCount: Math.max(1, currentCol1 - 1) })}
                        disabled={currentCol1 <= 1}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-neutral-200 flex items-center justify-center font-bold text-xs transition-colors"
                        title="Menos en Bloque 1"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min={1}
                        max={totalTracks - 1}
                        step={1}
                        value={currentCol1}
                        onChange={(e) => updateAlbum({ col1TrackCount: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateAlbum({ col1TrackCount: Math.min(totalTracks - 1, currentCol1 + 1) })}
                        disabled={currentCol1 >= totalTracks - 1}
                        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-neutral-200 flex items-center justify-center font-bold text-xs transition-colors"
                        title="Más en Bloque 1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Control numérico de Tamaño del Tracklist (px) */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-300">
                    Tamaño de Canciones (Tracklist)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={8}
                      max={26}
                      value={album.tracklistFontSize ?? 13}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          const clamped = Math.max(7, Math.min(32, val));
                          updateAlbum({ tracklistFontSize: clamped });
                        }
                      }}
                      className="w-14 bg-neutral-950 border border-neutral-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono">px</span>
                  </div>
                </div>

                {/* Slider interactivo */}
                <input
                  type="range"
                  min="9"
                  max="24"
                  step="1"
                  value={album.tracklistFontSize ?? 13}
                  onChange={(e) => updateAlbum({ tracklistFontSize: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />

                {/* Atajos rápidos en px */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {[
                    { label: 'Compacto', size: 10 },
                    { label: 'Normal', size: 13 },
                    { label: 'Medio', size: 15 },
                    { label: 'Grande', size: 18 },
                  ].map((preset) => {
                    const currentSize = album.tracklistFontSize ?? 13;
                    const isSelected = currentSize === preset.size;

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateAlbum({ tracklistFontSize: preset.size })}
                        className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors ${isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                            : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                          }`}
                      >
                        {preset.label} ({preset.size}px)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Track Button */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Lista de Canciones
                </label>
                <button
                  type="button"
                  onClick={handleAddTrack}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Pista
                </button>
              </div>

              {/* Tracks Scrollable List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {album.tracks.map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-2 group">
                    <span className="w-5 text-right text-xs font-mono text-neutral-500">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => handleTrackChange(idx, e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTrack(idx)}
                      className="opacity-40 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition-opacity"
                      title="Eliminar pista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 4: REPRODUCTOR & CÓDIGO SPOTIFY */}
      {/* ========================================================================= */}
      <Accordion.Item value="reproductor" className="border-none">
        <Accordion.ItemTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-850/50 transition-colors cursor-pointer group text-left">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              {config.template === 'song-player' ? 'Reproductor & Spotify Code' : 'Código Spotify'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full border border-neutral-700"
              style={{ backgroundColor: activeSoundwaveColor }}
              title={`Color de código: ${activeSoundwaveColor}`}
            />
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${openSections.includes('reproductor') ? 'rotate-180' : ''
                }`}
            />
          </div>
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-3.5 text-xs">
            {/* Color del Código de Spotify */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-300 font-medium">Color del Código Spotify</span>
                <p className="text-[10px] text-neutral-500">Soundwave scannable y logotipo</p>
              </div>
              <ColorPickerPopover
                title="Color del Código Spotify"
                color={activeSoundwaveColor}
                onChange={(c) => handleSoundwaveColor(c)}
                presets={[
                  { label: 'Negro', hex: '#000000' },
                  { label: 'Blanco', hex: '#FFFFFF' },
                  { label: 'Verde Spotify', hex: '#1DB954' },
                  { label: 'Naranja Verano', hex: '#FF6B00' },
                  { label: 'Rojo Pasión', hex: '#E50914' },
                  { label: 'Azul Eléctrico', hex: '#0070F3' },
                  { label: 'Oro / Bronce', hex: '#C69214' },
                ]}
              />
            </div>

            {/* Control manual de Tamaño del Código Spotify */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-neutral-300">
                    Tamaño del Código Spotify
                  </span>
                  <p className="text-[9.5px] text-neutral-500">
                    Altura y proporción del código escaneable
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={14}
                    max={60}
                    value={
                      isAlbum
                        ? (album.spotifyCodeSize ?? 30)
                        : (player.spotifyCodeSize ?? 42)
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        const clamped = Math.max(12, Math.min(70, val));
                        if (isAlbum) {
                          updateAlbum({ spotifyCodeSize: clamped });
                        } else {
                          updatePlayer({ spotifyCodeSize: clamped });
                        }
                      }
                    }}
                    className="w-14 bg-neutral-950 border border-neutral-700/80 rounded px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">px</span>
                </div>
              </div>

              {/* Slider interactivo */}
              <input
                type="range"
                min="14"
                max="56"
                step="1"
                value={
                  isAlbum
                    ? (album.spotifyCodeSize ?? 30)
                    : (player.spotifyCodeSize ?? 42)
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (isAlbum) {
                    updateAlbum({ spotifyCodeSize: val });
                  } else {
                    updatePlayer({ spotifyCodeSize: val });
                  }
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />

              {/* Atajos rápidos en px */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                {[
                  { label: 'Mini', size: 18 },
                  { label: 'Normal', size: 24 },
                  { label: 'Medio', size: 30 },
                  { label: 'Grande', size: 38 },
                ].map((preset) => {
                  const currentSize = isAlbum
                    ? (album.spotifyCodeSize ?? 30)
                    : (player.spotifyCodeSize ?? 42);
                  const isSelected = currentSize === preset.size;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (isAlbum) {
                          updateAlbum({ spotifyCodeSize: preset.size });
                        } else {
                          updatePlayer({ spotifyCodeSize: preset.size });
                        }
                      }}
                      className={`text-[9.5px] px-2 py-0.5 rounded border transition-colors ${isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                        }`}
                    >
                      {preset.label} ({preset.size}px)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controles específicos del Reproductor: Estado, Minutero, Like, Progreso */}
            {config.template === 'song-player' && (
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                {/* Selector de Estado del Botón Central (Pausa || vs Play ▶) */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Icono del Botón Central
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updatePlayer({ isPlaying: true })}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${player.isPlaying !== false
                          ? 'bg-neutral-800 border-emerald-500 text-emerald-400'
                          : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pausa (||)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePlayer({ isPlaying: false })}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${player.isPlaying === false
                          ? 'bg-neutral-800 border-emerald-500 text-emerald-400'
                          : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play (▶)</span>
                    </button>
                  </div>
                </div>

                {/* Interruptor de canción favorita (Corazón Like) */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <Heart
                      className={`w-3.5 h-3.5 ${player.isLiked ? 'text-rose-500 fill-rose-500' : 'text-neutral-500'
                        }`}
                    />
                    Canción Favorita (Corazón Like)
                  </span>
                  <input
                    type="checkbox"
                    checked={player.isLiked}
                    onChange={(e) => updatePlayer({ isLiked: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Minutero de la Canción */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    Minutero de la Canción
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Minuto Inicial</label>
                      <input
                        type="text"
                        value={player.currentTime}
                        onChange={(e) => updatePlayer({ currentTime: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Minuto Final / Total</label>
                      <input
                        type="text"
                        value={player.totalTime}
                        onChange={(e) => updatePlayer({ totalTime: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Progress Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Progreso de Reproducción</span>
                    <span className="font-mono text-neutral-200 font-semibold">{player.progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={player.progressPercent}
                    onChange={(e) => updatePlayer({ progressPercent: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                  />
                </div>
              </div>
            )}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
};
