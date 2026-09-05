'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Palette, X } from 'lucide-react';

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  title?: string;
  presets?: { label: string; hex: string }[];
  align?: 'auto' | 'left' | 'right';
}

const DEFAULT_PRESETS = [
  { label: 'Negro', hex: '#000000' },
  { label: 'Blanco', hex: '#FFFFFF' },
  { label: 'Verde Spotify', hex: '#1DB954' },
  { label: 'Naranja', hex: '#FF6B00' },
  { label: 'Rojo', hex: '#E50914' },
  { label: 'Azul', hex: '#0070F3' },
  { label: 'Oro', hex: '#C69214' },
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color = '#000000',
  onChange,
  title = 'Editar Color',
  presets = DEFAULT_PRESETS,
  align = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute position relative to viewport and container
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    // If button has scrolled out of view, close popover
    if (rect.bottom < 50 || rect.top > window.innerHeight - 20) {
      setIsOpen(false);
      return;
    }

    const popoverWidth = popoverRef.current?.offsetWidth || 264;
    const popoverHeight = popoverRef.current?.offsetHeight || 220;

    // Determine vertical position (below or above)
    const spaceBelow = window.innerHeight - rect.bottom;
    let top: number;
    if (spaceBelow < popoverHeight + 12 && rect.top > popoverHeight + 12) {
      top = rect.top - popoverHeight - 8;
    } else {
      top = rect.bottom + 8;
    }

    // Determine horizontal position
    const aside = buttonRef.current.closest('aside');
    const asideRect = aside ? aside.getBoundingClientRect() : null;

    let idealLeft: number;
    if (align === 'left') {
      idealLeft = rect.left;
    } else if (align === 'right') {
      idealLeft = rect.right - popoverWidth;
    } else {
      // Auto: if button is in the left portion of the container, align left
      if (asideRect && rect.left < asideRect.left + asideRect.width / 2) {
        idealLeft = rect.left;
      } else {
        idealLeft = rect.right - popoverWidth;
      }
    }

    // Determine bounds to prevent any clipping or overflow
    const minLeft = asideRect ? Math.max(12, asideRect.left + 12) : 12;
    const maxLeft = (asideRect ? asideRect.right : window.innerWidth) - popoverWidth - 12;

    const left = Math.max(minLeft, Math.min(idealLeft, maxLeft));

    setPosition({
      top: Math.max(12, Math.min(top, window.innerHeight - popoverHeight - 12)),
      left: Math.max(12, left),
    });
  }, [align]);

  // Update position on open, window resize or container scroll
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true); // capture phase catches internal sidebar scroll

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const currentColor = color || '#000000';

  return (
    <>
      {/* Compact Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        title={title}
        className={`h-9 px-2.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-medium flex-shrink-0 ${
          isOpen
            ? 'border-emerald-500 bg-neutral-800 text-neutral-100 ring-2 ring-emerald-500/30'
            : 'border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800'
        }`}
      >
        {/* Live Color Swatch Indicator */}
        <span
          className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex-shrink-0"
          style={{ backgroundColor: currentColor }}
        />
        <Palette className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {/* Floating Popover rendered in document.body via Portal to prevent any parent container clipping */}
      {isOpen && mounted && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
          }}
          className="w-64 p-3 bg-[#16181f] border border-neutral-700/90 rounded-xl shadow-2xl backdrop-blur-md space-y-3 select-none transition-opacity duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-semibold text-neutral-200">{title}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[10px] text-neutral-400 font-medium mb-1.5 uppercase tracking-wider">
              Paleta Rápida
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {presets.map((p) => {
                const isSelected = currentColor.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.label}
                    onClick={() => onChange(p.hex)}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      isSelected
                        ? 'scale-110 border-white ring-2 ring-emerald-500'
                        : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.hex }}
                  />
                );
              })}
            </div>
          </div>

          {/* Native Color Picker & Hex Input */}
          <div>
            <span className="block text-[10px] text-neutral-400 font-medium mb-1.5 uppercase tracking-wider">
              Color Personalizado (Hex)
            </span>
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onChange(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
                title="Selector de color"
              />
              <input
                type="text"
                value={currentColor}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 bg-transparent text-xs font-mono text-neutral-200 uppercase focus:outline-none"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
