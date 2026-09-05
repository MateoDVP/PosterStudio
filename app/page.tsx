'use client';

import React, { useState, useRef } from 'react';
import { PosterConfig } from '@/types/poster';
import { PRINT_SIZES, DEFAULT_PRINT_SIZE } from '@/lib/constants/printSizes';
import { PosterRenderer } from '@/components/poster/PosterRenderer';
import { LayoutControls } from '@/components/controls/LayoutControls';
import { AlbumControls } from '@/components/controls/AlbumControls';
import { PlayerControls } from '@/components/controls/PlayerControls';
import { UrlInputBar } from '@/components/ui/UrlInputBar';
import { exportToPng } from '@/lib/export/exportToPng';
import { exportToPdf } from '@/lib/export/exportToPdf';
import {
  Download,
  FileText,
  Printer,
  Layers,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const INITIAL_POSTER_CONFIG: PosterConfig = {
  template: 'album-gallery',
  sizeKey: DEFAULT_PRINT_SIZE,
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  accentColor: '#1DB954',
  enableBlurredBackground: false,
  blurredBackgroundOpacity: 0.65,
  blurredBackgroundBlur: 35,
  blurredBackgroundOverlay: 'dark',
  album: {
    title: '',
    artist: '',
    releaseDate: '',
    coverUrl: '',
    spotifyUri: '',
    soundwaveColor: '#000000',
    soundwaveBgColor: 'ffffff',
    trackColumns: 2,
    uppercaseTitle: true,
    tracks: [],
  },
  player: {
    title: '',
    artist: '',
    coverUrl: '',
    spotifyUri: '',
    currentTime: '0:00',
    totalTime: '-0:00',
    progressPercent: 25,
    isLiked: true,
    isBlackAndWhite: false,
    coverBorderRadius: 10,
    soundwaveColor: '#000000',
  },
};

export default function PosterStudioPage() {
  const [config, setConfig] = useState<PosterConfig>(INITIAL_POSTER_CONFIG);
  const [activeTab, setActiveTab] = useState<'content' | 'layout'>('content');
  const [showGuides, setShowGuides] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);
  const activePrintSize = PRINT_SIZES[config.sizeKey];

  const handleDataExtracted = (data: any, type: 'album' | 'track') => {
    if (type === 'album') {
      setConfig((prev) => {
        const defaultCover = data.itunesCoverUrl || data.coverUrl || data.spotifyCoverUrl || prev.album.coverUrl;
        return {
          ...prev,
          template: 'album-gallery',
          album: {
            ...prev.album,
            title: data.title || prev.album.title,
            artist: data.artist || prev.album.artist,
            releaseDate: data.releaseDate || prev.album.releaseDate,
            coverUrl: defaultCover,
            spotifyCoverUrl: data.spotifyCoverUrl || data.coverUrl,
            itunesCoverUrl: data.itunesCoverUrl,
            spotifyUri: data.spotifyUri || prev.album.spotifyUri,
            tracks: data.tracks && data.tracks.length > 0 ? data.tracks : prev.album.tracks,
          },
        };
      });
      showNotification(`Álbum "${data.title}" extraído con éxito`, 'success');
    } else {
      setConfig((prev) => {
        const defaultCover = data.itunesCoverUrl || data.coverUrl || data.spotifyCoverUrl || prev.player.coverUrl;
        return {
          ...prev,
          template: 'song-player',
          player: {
            ...prev.player,
            title: data.title || prev.player.title,
            artist: data.artist || prev.player.artist,
            coverUrl: defaultCover,
            spotifyCoverUrl: data.spotifyCoverUrl || data.coverUrl,
            itunesCoverUrl: data.itunesCoverUrl,
            spotifyUri: data.spotifyUri || prev.player.spotifyUri,
            totalTime: data.tracks?.[0]?.duration || '3:30',
            currentTime: '0:45',
            progressPercent: 22,
          },
        };
      });
      showNotification(`Canción "${data.title}" extraída con éxito`, 'success');
    }
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleExportPng = async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      await exportToPng(
        posterRef.current,
        activePrintSize,
        `poster-${config.template}`,
        (status) => setExportStatus(status)
      );
      showNotification('Póster PNG a 300 DPI descargado con éxito', 'success');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Error al exportar PNG', 'error');
    } finally {
      setExporting(false);
      setExportStatus(null);
    }
  };

  const handleExportPdf = async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      await exportToPdf(
        posterRef.current,
        activePrintSize,
        `poster-${config.template}`,
        (status) => setExportStatus(status)
      );
      showNotification('PDF de preprensa generado en milímetros', 'success');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Error al exportar PDF', 'error');
    } finally {
      setExporting(false);
      setExportStatus(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0e12] text-neutral-100">
      {/* 1. TOP NAVBAR: Brand + UrlInputBar + Export Actions */}
      <header className="h-16 flex-shrink-0 z-40 bg-[#12141a] border-b border-neutral-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="font-black text-neutral-950 text-base tracking-tighter">P</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">PosterStudio</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hidden md:inline-block">
                300 DPI
              </span>
            </div>
          </div>
        </div>

        {/* Center: Spotify URL Input Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <UrlInputBar
            onDataLoaded={handleDataExtracted}
            onError={(msg) => showNotification(msg, 'error')}
          />
        </div>

        {/* Right: Export Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleExportPng}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition-all disabled:opacity-50"
            title="Descargar imagen PNG sin compresión a 300 DPI"
          >
            {exporting && exportStatus?.includes('PNG') ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">Exportar PNG (300 DPI)</span>
            <span className="sm:hidden">PNG</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
            title="Generar PDF a escala milimétrica para imprenta"
          >
            {exporting && exportStatus?.includes('PDF') ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">PDF Imprenta (mm)</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-neutral-700/60 transition-colors"
            title="Imprimir directamente desde el navegador"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Export status toast banner */}
      {exportStatus && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 font-medium flex-shrink-0">
          <Loader2 className="w-3 h-3 animate-spin" />
          {exportStatus}
        </div>
      )}

      {/* 2. MAIN APP BODY: Scrollable Poster Canvas (Left) + Fixed Menu (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER COLUMN: Scrollable poster canvas */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-start p-4 sm:p-8 bg-neutral-950/70 relative">
          {/* Format specifications indicator */}
          <div className="sticky top-0 z-10 mb-4 px-4 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur border border-neutral-800 flex flex-wrap items-center justify-center gap-2.5 text-xs text-neutral-400 shadow-sm">
            <span className="font-semibold text-neutral-200">{activePrintSize.name}</span>
            <span>•</span>
            <span className="font-mono">
              {activePrintSize.widthMm} × {activePrintSize.heightMm} mm
            </span>
            <span>•</span>
            <span className="font-mono text-emerald-400">
              {activePrintSize.widthPx300Dpi} × {activePrintSize.heightPx300Dpi} px @ 300 DPI
            </span>
          </div>

          {/* Printable Poster Canvas */}
          <div className="w-full flex-1 flex items-center justify-center">
            <PosterRenderer ref={posterRef} config={config} showGuides={showGuides} />
          </div>
        </main>

        {/* RIGHT COLUMN: Fixed Inspector / Controls Menu */}
        <aside className="w-80 sm:w-96 lg:w-[410px] bg-[#12141a] border-l border-neutral-800/80 flex flex-col flex-shrink-0 h-full overflow-hidden z-20 shadow-xl">
          {/* Tabs fixed at top of the sidebar */}
          <div className="flex border-b border-neutral-800/80 px-6 pt-3 flex-shrink-0 bg-[#12141a]">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 mr-6 ${
                activeTab === 'content'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Contenido & Textos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'layout'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Plantilla & Formato
            </button>
          </div>

          {/* Controls Form Area - Scrollable internally */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
            {activeTab === 'content' ? (
              config.template === 'album-gallery' ? (
                <AlbumControls config={config} onChange={setConfig} />
              ) : (
                <PlayerControls config={config} onChange={setConfig} />
              )
            ) : (
              <LayoutControls
                config={config}
                onChange={setConfig}
                showGuides={showGuides}
                onToggleGuides={() => setShowGuides(!showGuides)}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border ${
            toastMessage.type === 'success'
              ? 'bg-neutral-900/95 text-emerald-400 border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-neutral-900/95 text-rose-400 border-rose-500/50 shadow-rose-950/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
