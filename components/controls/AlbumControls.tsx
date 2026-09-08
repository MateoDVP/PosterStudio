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
        if (config.template === 'album-gallery') {
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
  const activeCoverUrl = config.template === 'album-gallery' ? album.coverUrl : player.coverUrl;
  const activeItunesUrl =
    config.template === 'album-gallery' ? album.itunesCoverUrl : player.itunesCoverUrl;
  const activeSpotifyUrl =
    config.template === 'album-gallery' ? album.spotifyCoverUrl : player.spotifyCoverUrl;

  const handleSelectOfficialCover = (url: string) => {
    if (config.template === 'album-gallery') {
      updateAlbum({ coverUrl: url });
    } else {
      updatePlayer({ coverUrl: url });
    }
  };

  const activeSoundwaveColor =
    config.template === 'album-gallery'
      ? album.soundwaveColor || '#000000'
      : player.soundwaveColor || '#000000';

  const handleSoundwaveColor = (color: string) => {
    if (config.template === 'album-gallery') {
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
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                openSections.includes('caratula') ? 'rotate-180' : ''
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
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      activeCoverUrl === activeItunesUrl
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
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      activeCoverUrl === activeSpotifyUrl
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
                      className={`w-full h-full object-cover ${
                        config.template === 'song-player' && player.isBlackAndWhite ? 'grayscale' : ''
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
                      if (config.template === 'album-gallery') {
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
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              openSections.includes('tipografia') ? 'rotate-180' : ''
            }`}
          />
        </Accordion.ItemTrigger>

        <Accordion.ItemContent>
          <Accordion.ItemBody className="px-4 pb-4 pt-1 space-y-3.5 text-xs">
            {/* Título */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                {config.template === 'album-gallery' ? 'Título del Álbum' : 'Título de la Canción'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.template === 'album-gallery' ? album.title : player.title}
                  onChange={(e) => {
                    if (config.template === 'album-gallery') {
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
                    config.template === 'album-gallery'
                      ? album.titleColor || '#000000'
                      : player.titleColor || '#000000'
                  }
                  onChange={(c) => {
                    if (config.template === 'album-gallery') {
                      updateAlbum({ titleColor: c });
                    } else {
                      updatePlayer({ titleColor: c });
                    }
                  }}
                />
              </div>
            </div>

            {/* Uppercase Switch (para Álbum) */}
            {config.template === 'album-gallery' && (
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
                  value={config.template === 'album-gallery' ? album.artist : player.artist}
                  onChange={(e) => {
                    if (config.template === 'album-gallery') {
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
                    config.template === 'album-gallery'
                      ? album.artistColor || album.titleColor || '#404040'
                      : player.artistColor || '#737373'
                  }
                  onChange={(c) => {
                    if (config.template === 'album-gallery') {
                      updateAlbum({ artistColor: c });
                    } else {
                      updatePlayer({ artistColor: c });
                    }
                  }}
                />
              </div>
            </div>

            {/* Fecha / Año y Duración */}
            {config.template === 'album-gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Fecha de Lanzamiento
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Septiembre 07, 2026"
                    value={album.releaseDate}
                    onChange={(e) => updateAlbum({ releaseDate: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Duración del Álbum
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 54 min 20 seg o 1 h 14 min"
                    value={album.totalDuration || ''}
                    onChange={(e) => updateAlbum({ totalDuration: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Paleta de Colores en Póster (5 Cuadros de la carátula) */}
            {config.template === 'album-gallery' && (
              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-300 font-medium">Paleta de Colores en Póster</span>
                    <p className="text-[10px] text-neutral-500">5 cuadros encima del artista</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={album.showPalette !== false}
                    onChange={(e) => updateAlbum({ showPalette: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
                {album.palette && album.palette.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {album.palette.slice(0, 5).map((hex, idx) => (
                      <div
                        key={`${hex}-${idx}`}
                        className="w-5 h-5 rounded flex-shrink-0 border border-neutral-700"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: PISTAS & TRACKLIST (solo en Galería Álbum) */}
      {/* ========================================================================= */}
      {config.template === 'album-gallery' && (
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
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  openSections.includes('pistas') ? 'rotate-180' : ''
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
                    className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                      album.trackColumns === 1
                        ? 'bg-neutral-800 border-emerald-500 text-emerald-400 font-semibold'
                        : 'bg-transparent border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    1 Columna
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAlbum({ trackColumns: 2 })}
                    className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                      album.trackColumns === 2
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
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                openSections.includes('reproductor') ? 'rotate-180' : ''
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

            {/* Controles específicos del Reproductor: Minutero, Like, Progreso */}
            {config.template === 'song-player' && (
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                {/* Interruptor de canción favorita (Corazón Like) */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        player.isLiked ? 'text-rose-500 fill-rose-500' : 'text-neutral-500'
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
