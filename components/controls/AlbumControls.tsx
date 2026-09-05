'use client';

import React, { useRef } from 'react';

import { PosterConfig, TrackItem } from '@/types/poster';
import { Upload, Plus, Trash2, SlidersHorizontal, Image as ImageIcon, Check } from 'lucide-react';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';

interface AlbumControlsProps {
  config: PosterConfig;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
}

export const AlbumControls: React.FC<AlbumControlsProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const album = config.album;

  const updateAlbum = (partial: Partial<typeof album>) => {
    onChange((prev) => ({
      ...prev,
      album: {
        ...prev.album,
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
        updateAlbum({ coverUrl: base64 });
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

  const soundwavePresets = [
    { label: 'Negro', hex: '#000000' },
    { label: 'Blanco', hex: '#FFFFFF' },
    { label: 'Verde Spotify', hex: '#1DB954' },
    { label: 'Naranja Verano', hex: '#FF6B00' },
    { label: 'Rojo Pasión', hex: '#E50914' },
    { label: 'Azul Eléctrico', hex: '#0070F3' },
    { label: 'Oro / Bronce', hex: '#C69214' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Cover Image Upload & Source Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Carátula del Álbum
        </label>

        {/* Dual Source Selector (Apple Music 3000px vs Spotify 640px) */}
        {(album.itunesCoverUrl || album.spotifyCoverUrl) && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-neutral-400">
              Selecciona la fuente de la carátula:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Apple Music Option */}
              <button
                type="button"
                disabled={!album.itunesCoverUrl}
                onClick={() => album.itunesCoverUrl && updateAlbum({ coverUrl: album.itunesCoverUrl })}
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  album.coverUrl === album.itunesCoverUrl
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                    : album.itunesCoverUrl
                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    : 'border-neutral-900 bg-neutral-950/40 text-neutral-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-950 flex-shrink-0 overflow-hidden border border-neutral-800">
                  {album.itunesCoverUrl ? (
                    <img src={album.itunesCoverUrl} alt="Apple Music Master" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600">N/A</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span>Apple Music</span>
                    {album.coverUrl === album.itunesCoverUrl && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">3000 × 3000 px</div>
                </div>
              </button>

              {/* Spotify Option */}
              <button
                type="button"
                disabled={!album.spotifyCoverUrl}
                onClick={() => album.spotifyCoverUrl && updateAlbum({ coverUrl: album.spotifyCoverUrl })}
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  album.coverUrl === album.spotifyCoverUrl
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                    : album.spotifyCoverUrl
                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    : 'border-neutral-900 bg-neutral-950/40 text-neutral-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-950 flex-shrink-0 overflow-hidden border border-neutral-800">
                  {album.spotifyCoverUrl ? (
                    <img src={album.spotifyCoverUrl} alt="Spotify Original" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600">N/A</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span>Spotify</span>
                    {album.coverUrl === album.spotifyCoverUrl && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">640 × 640 px</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Upload or Custom URL */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex-shrink-0 relative group">
            {album.coverUrl ? (
              <img
                src={album.coverUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Subir Imagen Local (Archivo HD)
            </button>
            <input
              type="text"
              placeholder="O pega URL de imagen..."
              value={album.coverUrl.startsWith('data:') ? 'Imagen local cargada' : album.coverUrl}
              onChange={(e) => updateAlbum({ coverUrl: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Technical Quality Inspector */}
        {album.coverUrl && (
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800">
            <span className="text-neutral-400 font-medium">Resolución en lienzo:</span>
            <div className="flex items-center gap-2">
              {album.coverUrl.includes('mzstatic.com') || album.coverUrl.includes('3000x3000') ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3000 × 3000 px (Apple Master)
                </span>
              ) : album.coverUrl.includes('scdn.co') ? (
                <span className="text-amber-400 font-semibold font-mono">
                  640 × 640 px (Spotify)
                </span>
              ) : (
                <span className="text-teal-400 font-semibold">
                  Archivo Local
                </span>
              )}

              {!album.coverUrl.startsWith('data:') && (
                <a
                  href={album.coverUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-500 hover:text-neutral-300 underline text-[10px]"
                  title="Abrir imagen original para verificar dimensiones"
                >
                  Ver original ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Metadata Inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Título del Álbum</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={album.title}
              onChange={(e) => updateAlbum({ title: e.target.value })}
              className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 font-medium"
            />
            <ColorPickerPopover
              title="Color del Título"
              color={album.titleColor || '#000000'}
              onChange={(c) => updateAlbum({ titleColor: c })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Artista</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={album.artist}
                onChange={(e) => updateAlbum({ artist: e.target.value })}
                className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
              />
              <ColorPickerPopover
                title="Color del Artista"
                color={album.artistColor || album.titleColor || '#404040'}
                onChange={(c) => updateAlbum({ artistColor: c })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Fecha / Año</label>
            <input
              type="text"
              placeholder="e.g. 05/06/2022 o 2022"
              value={album.releaseDate}
              onChange={(e) => updateAlbum({ releaseDate: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Typography & Styling Toggles */}
      <div className="pt-2 border-t border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Mayúsculas en Título (Uppercase)</span>
          <input
            type="checkbox"
            checked={album.uppercaseTitle}
            onChange={(e) => updateAlbum({ uppercaseTitle: e.target.checked })}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Columnas de Tracklist</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateAlbum({ trackColumns: 1 })}
              className={`px-2.5 py-1 text-xs rounded border ${
                album.trackColumns === 1
                  ? 'bg-neutral-800 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-transparent border-neutral-800 text-neutral-400'
              }`}
            >
              1 Columna
            </button>
            <button
              type="button"
              onClick={() => updateAlbum({ trackColumns: 2 })}
              className={`px-2.5 py-1 text-xs rounded border ${
                album.trackColumns === 2
                  ? 'bg-neutral-800 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-transparent border-neutral-800 text-neutral-400'
              }`}
            >
              2 Columnas
            </button>
          </div>
        </div>

        {/* Soundwave Code Color Popover */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-neutral-400">Color Código Spotify (Soundwave & Logo)</span>
          <ColorPickerPopover
            title="Color del Código Spotify"
            color={album.soundwaveColor || '#000000'}
            onChange={(c) => updateAlbum({ soundwaveColor: c })}
          />
        </div>
      </div>

      {/* 4. Tracklist Editor */}
      <div className="pt-2 border-t border-neutral-800/80">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Tracklist ({album.tracks.length} canciones)
          </label>
          <div className="flex items-center gap-2">
            <ColorPickerPopover
              title="Color de Canciones"
              color={album.tracklistColor || '#000000'}
              onChange={(c) => updateAlbum({ tracklistColor: c })}
            />
            <button
              type="button"
              onClick={handleAddTrack}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Pista
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {album.tracks.map((track, idx) => (
            <div key={track.id} className="flex items-center gap-2 group">
              <span className="w-5 text-right text-xs font-mono text-neutral-500">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={track.title}
                onChange={(e) => handleTrackChange(idx, e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveTrack(idx)}
                className="opacity-40 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1"
                title="Eliminar pista"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
