'use client';

import React, { useState } from 'react';
import { PosterConfig } from '@/types/poster';
import { LayoutControls } from './LayoutControls';
import { AlbumControls } from './AlbumControls';
import {
  Layers,
  Edit3,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarInspectorProps {
  config: PosterConfig;
  onChange: (updater: (prev: PosterConfig) => PosterConfig) => void;
  showGuides: boolean;
  onToggleGuides: () => void;
}

export const SidebarInspector: React.FC<SidebarInspectorProps> = ({
  config,
  onChange,
  showGuides,
  onToggleGuides,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'layout'>('content');

  return (
    <div className="flex flex-col h-full bg-[#12141a] text-neutral-100">
      {/* 1. TOP HEADER & TABS BAR */}
      <div className="border-b border-neutral-800/80 flex-shrink-0 bg-[#12141a]">
        {/* Top title */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Inspector de Diseño
            </span>
          </div>
          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
            Figma UI
          </span>
        </div>

        {/* The 2 Navigation Tabs */}
        <div className="flex px-4 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`pb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'content'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Contenido & Textos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`pb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'layout'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Plantilla & Formato
          </button>
        </div>
      </div>

      {/* 2. MODULAR INSPECTOR CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'content' ? (
          <AlbumControls config={config} onChange={onChange} />
        ) : (
          <LayoutControls
            config={config}
            onChange={onChange}
            showGuides={showGuides}
            onToggleGuides={onToggleGuides}
          />
        )}
      </div>
    </div>
  );
};
