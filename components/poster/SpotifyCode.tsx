'use client';

import React, { useEffect, useState } from 'react';

interface SpotifyCodeProps {
  uri?: string;
  color?: string;
  className?: string;
}

// Caché global en memoria para evitar peticiones repetidas entre cambios de plantilla o re-renderizados
const svgCache = new Map<string, string>();

/**
 * Componente vectorial de alto rendimiento para el Código de Spotify.
 * - Descarga el SVG oficial de Spotify una sola vez por cada URI.
 * - Cambia el color de las barras y el logo en el cliente mediante CSS currentColor (0ms de latencia, 0 peticiones de red).
 * - Gráfico vectorial ultra-nítido para exportaciones de imprenta a 300 DPI.
 */
export const SpotifyCode: React.FC<SpotifyCodeProps> = ({
  uri = 'spotify:album:3RQQmkQEvNCY4prGKE6oc5',
  color = '#000000',
  className = 'h-full w-auto',
}) => {
  const cleanUri = (uri || '').trim() || 'spotify:album:3RQQmkQEvNCY4prGKE6oc5';
  const [svgContent, setSvgContent] = useState<string>(() => svgCache.get(cleanUri) || '');

  useEffect(() => {
    if (!cleanUri) return;

    if (svgCache.has(cleanUri)) {
      setSvgContent(svgCache.get(cleanUri)!);
      return;
    }

    let isCancelled = false;

    async function loadSvg() {
      try {
        const response = await fetch(`/api/spotify-code?uri=${encodeURIComponent(cleanUri)}`);
        if (!response.ok) return;

        let svgText = await response.text();

        // 1. Quitar el rectángulo de fondo para que sea 100% transparente
        svgText = svgText.replace(/<rect\s+[^>]*width="400"[^>]*height="100"[^>]*\/?>/gi, '');

        // 2. Cambiar rellenos fijos por currentColor para que style={{ color }} controle el color en 0ms
        svgText = svgText
          .replace(/fill="#000000"/gi, 'fill="currentColor"')
          .replace(/fill="black"/gi, 'fill="currentColor"');

        // 3. Hacer que el SVG escale proporcionalmente a la altura de su contenedor
        svgText = svgText.replace(
          /<svg\s+([^>]*)>/i,
          (_match, attrs) => {
            const cleanAttrs = attrs.replace(/\b(width|height)="[^"]*"/gi, '').trim();
            return `<svg ${cleanAttrs} style="width: auto; height: 100%; max-height: 100%; display: block;" preserveAspectRatio="xMidYMid meet">`;
          }
        );

        svgCache.set(cleanUri, svgText);

        if (!isCancelled) {
          setSvgContent(svgText);
        }
      } catch (err) {
        console.warn('Could not fetch Spotify scannable SVG:', err);
      }
    }

    loadSvg();

    return () => {
      isCancelled = true;
    };
  }, [cleanUri]);

  if (!svgContent) {
    return (
      <div
        className={`${className} opacity-30 animate-pulse flex items-center`}
        style={{ color }}
      >
        <div className="h-3 w-32 bg-current rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ color, display: 'inline-flex', alignItems: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
