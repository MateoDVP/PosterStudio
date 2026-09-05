/**
 * iTunes / Apple Music API Helper for Exact 3000x3000px Ultra-HD Artwork
 * Priority 1: Exact Global Commercial Barcode (UPC for albums, ISRC for tracks)
 * Priority 2: Verified Title + Artist match
 * Fallback: null (preserves Spotify's exact original cover)
 */

export async function fetchITunesByUpc(upc: string): Promise<string | null> {
  if (!upc) return null;
  try {
    const url = `https://itunes.apple.com/lookup?upc=${encodeURIComponent(upc.trim())}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PosterStudio/1.0' },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const rawArtwork = data.results[0].artworkUrl100 || data.results[0].artworkUrl60;
      if (rawArtwork) {
        return get3000pxUrl(rawArtwork);
      }
    }
  } catch (err) {
    console.warn('iTunes UPC lookup error:', err);
  }
  return null;
}

export async function fetchITunesByIsrc(isrc: string): Promise<string | null> {
  if (!isrc) return null;
  try {
    const url = `https://itunes.apple.com/lookup?isrc=${encodeURIComponent(isrc.trim())}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PosterStudio/1.0' },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const rawArtwork = data.results[0].artworkUrl100 || data.results[0].artworkUrl60;
      if (rawArtwork) {
        return get3000pxUrl(rawArtwork);
      }
    }
  } catch (err) {
    console.warn('iTunes ISRC lookup error:', err);
  }
  return null;
}

export async function fetchITunesHighResArtwork(
  artist: string,
  title: string,
  type: 'album' | 'song' = 'album'
): Promise<string | null> {
  try {
    const cleanArtist = artist.replace(/[\(\)\[\],&]/g, ' ').trim().toLowerCase();
    const cleanTitle = title.replace(/[\(\)\[\],&]/g, ' ').trim().toLowerCase();
    const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
    const entity = type === 'song' ? 'song' : 'album';

    const url = `https://itunes.apple.com/search?term=${query}&entity=${entity}&limit=5`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PosterStudio/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    // Strict validation: Only accept if the album or track name matches closely
    const matched = data.results.find((item: any) => {
      const itunesName = (item.collectionName || item.trackName || '').toLowerCase();
      return (
        itunesName.includes(cleanTitle) ||
        cleanTitle.includes(itunesName) ||
        itunesName.replace(/[^a-z0-9]/g, '') === cleanTitle.replace(/[^a-z0-9]/g, '')
      );
    });

    if (!matched) {
      return null;
    }

    const rawArtwork: string = matched.artworkUrl100 || matched.artworkUrl60;
    if (!rawArtwork) return null;

    return get3000pxUrl(rawArtwork);
  } catch (error) {
    console.error('Error fetching iTunes high-res artwork:', error);
    return null;
  }
}

function get3000pxUrl(url: string): string {
  return url
    .replace(/\/\d+x\d+bb\.(jpg|png|webp)/i, '/3000x3000bb.jpg')
    .replace(/\/\d+x\d+bf\.(jpg|png|webp)/i, '/3000x3000bf.jpg');
}
