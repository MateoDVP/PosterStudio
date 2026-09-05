'use client';

import React, { useState, useRef } from 'react';

import { Search, Loader2, Sparkles } from 'lucide-react';

interface UrlInputBarProps {
  onDataLoaded: (data: any, type: 'album' | 'track') => void;
  onError?: (err: string) => void;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({ onDataLoaded, onError }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFetch = async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) {
      setInlineError('Por favor pega un enlace de Spotify antes de extraer.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setInlineError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second safety timeout

    try {
      const res = await fetch(`/api/album?url=${encodeURIComponent(cleanUrl)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo extraer la información del álbum o canción');
      }

      onDataLoaded(json.data, json.data.type);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', err);
      const errMsg =
        err.name === 'AbortError'
          ? 'La consulta tardó demasiado tiempo. Por favor intenta de nuevo.'
          : err.message || 'Error al conectar con la API de Spotify';
      setInlineError(errMsg);
      onError?.(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetch(url);
  };

  return (
    <div className="w-full max-w-xl relative">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-4 h-4 text-neutral-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (inlineError) setInlineError(null);
            }}
            placeholder="Pega el link de tu álbum o canción de Spotify..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-900/90 border border-neutral-700/80 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
          title="Consultar y extraer información en Spotify"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Extrayendo...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extraer</span>
            </>
          )}
        </button>
      </form>

      {inlineError && (
        <div className="absolute top-full left-0 mt-1.5 z-50 text-[11px] text-rose-300 bg-rose-950/95 border border-rose-800/90 rounded-lg px-3 py-1.5 shadow-xl backdrop-blur flex items-center gap-1.5">
          <span>⚠️ {inlineError}</span>
        </div>
      )}
    </div>
  );
};
