/**
 * Spotify Integration Helper
 * Official Spotify Web API integration via Client Credentials Flow.
 */

export interface ParsedSpotifyUrl {
  type: 'album' | 'track' | 'playlist' | 'unknown';
  id: string;
  uri: string;
}

export function parseSpotifyUrl(input: string): ParsedSpotifyUrl {
  const trimmed = input.trim();

  // Check Spotify URI format: spotify:album:xxx
  const uriMatch = trimmed.match(/^spotify:(album|track|playlist):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    return {
      type: uriMatch[1].toLowerCase() as 'album' | 'track' | 'playlist',
      id: uriMatch[2],
      uri: `spotify:${uriMatch[1].toLowerCase()}:${uriMatch[2]}`,
    };
  }

  // Check Web URL format: https://open.spotify.com/album/xxx, https://open.spotify.com/intl-es/album/xxx, etc.
  const urlMatch = trimmed.match(/spotify\.com\/(?:[a-zA-Z0-9_-]+\/)*(album|track|playlist)\/([a-zA-Z0-9]+)/i);
  if (urlMatch) {
    return {
      type: urlMatch[1].toLowerCase() as 'album' | 'track' | 'playlist',
      id: urlMatch[2],
      uri: `spotify:${urlMatch[1].toLowerCase()}:${urlMatch[2]}`,
    };
  }

  return { type: 'unknown', id: '', uri: '' };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Spotify token fetch failed with status', res.status, errText);
      return null;
    }

    const data = await res.json();
    console.log('Spotify token obtained successfully! Expires in:', data.expires_in);
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    console.warn('Spotify auth error:', err);
    return null;
  }
}

import { ExtractedMusicData } from '@/types/poster';
export type { ExtractedMusicData };


/**
 * Format milliseconds to MM:SS
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Extract data via Spotify Web API
 */
export async function fetchViaSpotifyApi(
  token: string,
  type: 'album' | 'track',
  id: string
): Promise<ExtractedMusicData | null> {
  const headers = { Authorization: `Bearer ${token}` };

  if (type === 'album') {
    let albumRes = await fetch(`https://api.spotify.com/v1/albums/${id}`, { headers });
    if (!albumRes.ok && albumRes.status === 404) {
      // Try with market=US or market=ES for region-locked albums
      albumRes = await fetch(`https://api.spotify.com/v1/albums/${id}?market=US`, { headers });
    }
    if (!albumRes.ok) {
      const errText = await albumRes.text();
      console.warn(`Spotify API /v1/albums/${id} failed:`, albumRes.status, errText);
      return null;
    }
    const album = await albumRes.json();



    // Collect all tracks (handle pagination if > 50)
    let tracks = album.tracks.items.map((t: any, i: number) => ({
      id: t.id || `track-${i + 1}`,
      number: t.track_number || i + 1,
      title: t.name,
      duration: t.duration_ms ? formatDuration(t.duration_ms) : undefined,
    }));

    let nextUrl = album.tracks.next;
    while (nextUrl && tracks.length < 100) {
      const nextRes = await fetch(nextUrl, { headers });
      if (!nextRes.ok) break;
      const nextData = await nextRes.json();
      const moreTracks = nextData.items.map((t: any, i: number) => ({
        id: t.id || `track-${tracks.length + i + 1}`,
        number: t.track_number || tracks.length + i + 1,
        title: t.name,
        duration: t.duration_ms ? formatDuration(t.duration_ms) : undefined,
      }));
      tracks = [...tracks, ...moreTracks];
      nextUrl = nextData.next;
    }

    const coverUrl = album.images?.[0]?.url || '';
    const artist = album.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';

    // Format release date (YYYY-MM-DD to DD/MM/YYYY)
    let releaseDate = album.release_date || '';
    if (releaseDate.includes('-')) {
      const parts = releaseDate.split('-');
      if (parts.length === 3) {
        releaseDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else if (parts.length === 1) {
        releaseDate = parts[0];
      }
    }

    return {
      type: 'album',
      title: album.name,
      artist,
      releaseDate,
      coverUrl,
      upc: album.external_ids?.upc,
      spotifyUri: album.uri || `spotify:album:${id}`,
      tracks,
    };
  } else if (type === 'track') {
    const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${id}`, { headers });
    if (!trackRes.ok) return null;
    const track = await trackRes.json();

    const artist = track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
    const coverUrl = track.album?.images?.[0]?.url || '';

    let releaseDate = track.album?.release_date || '';
    if (releaseDate.includes('-')) {
      const parts = releaseDate.split('-');
      if (parts.length === 3) {
        releaseDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    return {
      type: 'track',
      title: track.name,
      artist,
      releaseDate,
      coverUrl,
      isrc: track.external_ids?.isrc,
      spotifyUri: track.uri || `spotify:track:${id}`,
      durationMs: track.duration_ms,
      tracks: [
        {
          id: track.id,
          number: 1,
          title: track.name,
          duration: track.duration_ms ? formatDuration(track.duration_ms) : undefined,
        },
      ],
    };
  }

  return null;
}


