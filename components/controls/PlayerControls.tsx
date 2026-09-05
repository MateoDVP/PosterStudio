'use client';

import React, { useRef } from 'react';

import { PosterConfig } from '@/types/poster';
import { Upload, Heart, Image as ImageIcon, Sliders, Check } from 'lucide-react';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';

interface PlayerControlsProps {
  config: PosterConfig;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const player = config.player;

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
        updatePlayer({ coverUrl: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* 1. Custom Photo / Cover Upload & Source Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Fotografía Personal o Carátula
        </label>

        {/* Dual Source Selector (Apple Music 3000px vs Spotify 640px) */}
        {(player.itunesCoverUrl || player.spotifyCoverUrl) && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-neutral-400">
              Selecciona la fuente de la carátula:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Apple Music Option */}
              <button
                type="button"
                disabled={!player.itunesCoverUrl}
                onClick={() => player.itunesCoverUrl && updatePlayer({ coverUrl: player.itunesCoverUrl })}
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  player.coverUrl === player.itunesCoverUrl
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                    : player.itunesCoverUrl
                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    : 'border-neutral-900 bg-neutral-950/40 text-neutral-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-950 flex-shrink-0 overflow-hidden border border-neutral-800">
                  {player.itunesCoverUrl ? (
                    <img src={player.itunesCoverUrl} alt="Apple Music Master" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600">N/A</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span>Apple Music</span>
                    {player.coverUrl === player.itunesCoverUrl && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">3000 × 3000 px</div>
                </div>
              </button>

              {/* Spotify Option */}
              <button
                type="button"
                disabled={!player.spotifyCoverUrl}
                onClick={() => player.spotifyCoverUrl && updatePlayer({ coverUrl: player.spotifyCoverUrl })}
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  player.coverUrl === player.spotifyCoverUrl
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                    : player.spotifyCoverUrl
                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    : 'border-neutral-900 bg-neutral-950/40 text-neutral-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-950 flex-shrink-0 overflow-hidden border border-neutral-800">
                  {player.spotifyCoverUrl ? (
                    <img src={player.spotifyCoverUrl} alt="Spotify Original" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600">N/A</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <span>Spotify</span>
                    {player.coverUrl === player.spotifyCoverUrl && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">640 × 640 px</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Upload or Custom URL */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex-shrink-0 relative">
            {player.coverUrl ? (
              <img
                src={player.coverUrl}
                alt="Cover preview"
                className={`w-full h-full object-cover ${
                  player.isBlackAndWhite ? 'grayscale' : ''
                }`}
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
              Cargar Foto Local (Tus Recuerdos)
            </button>
            <input
              type="text"
              placeholder="O pega URL de imagen..."
              value={player.coverUrl.startsWith('data:') ? 'Foto local cargada' : player.coverUrl}
              onChange={(e) => updatePlayer({ coverUrl: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Technical Quality Inspector */}
        {player.coverUrl && (
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800">
            <span className="text-neutral-400 font-medium">Resolución en lienzo:</span>
            <div className="flex items-center gap-2">
              {player.coverUrl.includes('mzstatic.com') || player.coverUrl.includes('3000x3000') ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3000 × 3000 px (Apple Master)
                </span>
              ) : player.coverUrl.includes('scdn.co') ? (
                <span className="text-amber-400 font-semibold font-mono">
                  640 × 640 px (Spotify)
                </span>
              ) : (
                <span className="text-teal-400 font-semibold">
                  Foto Local
                </span>
              )}

              {!player.coverUrl.startsWith('data:') && (
                <a
                  href={player.coverUrl}
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

      {/* 2. Photo Filters & Radius */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
        <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={player.isBlackAndWhite}
            onChange={(e) => updatePlayer({ isBlackAndWhite: e.target.checked })}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
          <span>Filtro Blanco y Negro</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
          <Heart className={`w-4 h-4 ${player.isLiked ? 'text-rose-500 fill-rose-500' : 'text-neutral-500'}`} />
          <input
            type="checkbox"
            checked={player.isLiked}
            onChange={(e) => updatePlayer({ isLiked: e.target.checked })}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
          <span>Canción Favorita (Like)</span>
        </label>
      </div>

      {/* Radius Slider */}
      <div>
        <div className="flex justify-between text-xs text-neutral-400 mb-1">
          <span>Bordes de la Foto</span>
          <span className="font-mono text-neutral-200">{player.coverBorderRadius ?? 8}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="28"
          value={player.coverBorderRadius ?? 8}
          onChange={(e) => updatePlayer({ coverBorderRadius: Number(e.target.value) })}
          className="w-full accent-emerald-500"
        />
      </div>

      {/* 3. Song Details */}
      <div className="space-y-3 pt-2 border-t border-neutral-800/80">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Título de la Canción</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={player.title}
              onChange={(e) => updatePlayer({ title: e.target.value })}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 font-semibold"
            />
            <ColorPickerPopover
              title="Color del Título"
              color={player.titleColor || '#000000'}
              onChange={(c) => updatePlayer({ titleColor: c })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Artista</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={player.artist}
              onChange={(e) => updatePlayer({ artist: e.target.value })}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
            />
            <ColorPickerPopover
              title="Color del Artista"
              color={player.artistColor || '#737373'}
              onChange={(c) => updatePlayer({ artistColor: c })}
            />
          </div>
        </div>

        {/* Soundwave Code Color Popover */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-neutral-400">Color Código Spotify (Soundwave & Logo)</span>
          <ColorPickerPopover
            title="Color del Código Spotify"
            color={player.soundwaveColor || '#000000'}
            onChange={(c) => updatePlayer({ soundwaveColor: c })}
          />
        </div>
      </div>

      {/* 4. Timeline & Scrubber Editor */}
      <div className="space-y-3 pt-2 border-t border-neutral-800/80">
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          Línea de Tiempo y Minutos
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Minuto Inicial</label>
            <input
              type="text"
              value={player.currentTime}
              onChange={(e) => updatePlayer({ currentTime: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Minuto Final / Restante</label>
            <input
              type="text"
              value={player.totalTime}
              onChange={(e) => updatePlayer({ totalTime: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Posición del Reproductor</span>
            <span className="font-mono text-neutral-200">{player.progressPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={player.progressPercent}
            onChange={(e) => updatePlayer({ progressPercent: Number(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
