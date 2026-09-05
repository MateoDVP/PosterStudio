import { NextRequest, NextResponse } from 'next/server';
import {
  parseSpotifyUrl,
  getSpotifyAccessToken,
  fetchViaSpotifyApi,
  fetchViaSpotifyEmbed,
  fetchViaSpotifyOEmbed,
  formatDuration,
  ExtractedMusicData,
} from '@/lib/spotify';
import { fetchITunesHighResArtwork, fetchITunesByUpc, fetchITunesByIsrc } from '@/lib/itunes';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inputUrl = searchParams.get('url');

  if (!inputUrl) {
    return NextResponse.json(
      { success: false, error: 'URL or URI parameter is required' },
      { status: 400 }
    );
  }

  try {
    const parsed = parseSpotifyUrl(inputUrl);
    if (parsed.type === 'unknown') {
      return NextResponse.json(
        { success: false, error: 'Invalid Spotify URL or URI. Example: https://open.spotify.com/album/...' },
        { status: 400 }
      );
    }

    let extracted: ExtractedMusicData | null = null;

    // 1. Try Spotify Web API if credentials configured
    const token = await getSpotifyAccessToken();
    if (token) {
      extracted = await fetchViaSpotifyApi(token, parsed.type as 'album' | 'track', parsed.id);
    }

    // 2. Fallback to Spotify Embed scraper (complete tracklist, artist & 640px cover without API keys)
    if (!extracted && (parsed.type === 'album' || parsed.type === 'track')) {
      extracted = await fetchViaSpotifyEmbed(parsed.type, parsed.id);
    }

    // 3. Fallback to oEmbed if embed scraper failed
    if (!extracted) {
      extracted = await fetchViaSpotifyOEmbed(inputUrl, parsed.type as 'album' | 'track', parsed.id);
    }


    if (!extracted) {
      return NextResponse.json(
        { success: false, error: 'Could not extract music data from Spotify' },
        { status: 404 }
      );
    }

    // 3. Exact High-Resolution Cover Matching
    const originalSpotifyCover = extracted.coverUrl;
    extracted.spotifyCoverUrl = originalSpotifyCover;

    let highResCover: string | null = null;
    if (extracted.type === 'album' && extracted.upc) {
      highResCover = await fetchITunesByUpc(extracted.upc);
    } else if (extracted.type === 'track' && extracted.isrc) {
      highResCover = await fetchITunesByIsrc(extracted.isrc);
    }

    // Priority 2: Verified Title + Artist lookup if barcode wasn't available
    if (!highResCover) {
      highResCover = await fetchITunesHighResArtwork(
        extracted.artist,
        extracted.title,
        extracted.type === 'track' ? 'song' : 'album'
      );
    }

    if (highResCover) {
      extracted.itunesCoverUrl = highResCover;
      extracted.highResCoverUrl = highResCover;
      extracted.coverUrl = highResCover; // Default to 3000px Apple Master
    } else {
      extracted.coverUrl = originalSpotifyCover;
    }



    // 4. If album and tracklist has only 1 track (common with oEmbed fallback),
    // try enriching tracklist via iTunes Search API!
    if (extracted.type === 'album' && extracted.tracks.length <= 1) {
      try {
        const itunesSearch = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            `${extracted.artist} ${extracted.title}`
          )}&entity=song&limit=40`
        );
        if (itunesSearch.ok) {
          const itData = await itunesSearch.json();
          if (itData.results && itData.results.length > 0) {
            // Filter songs belonging to the target album
            const targetAlbumLower = extracted.title.toLowerCase();
            const matchingTracks = itData.results.filter(
              (item: any) =>
                item.wrapperType === 'track' &&
                item.collectionName &&
                (item.collectionName.toLowerCase().includes(targetAlbumLower) ||
                  targetAlbumLower.includes(item.collectionName.toLowerCase()))
            );

            const tracksToUse = matchingTracks.length > 0 ? matchingTracks : itData.results.filter((i: any) => i.wrapperType === 'track');

            if (tracksToUse.length > 0) {
              // Sort by trackNumber
              tracksToUse.sort((a: any, b: any) => (a.trackNumber || 0) - (b.trackNumber || 0));
              extracted.tracks = tracksToUse.map((t: any, idx: number) => ({
                id: t.trackId ? String(t.trackId) : `itunes-${idx + 1}`,
                number: t.trackNumber || idx + 1,
                title: t.trackName || `Track ${idx + 1}`,
                duration: t.trackTimeMillis ? formatDuration(t.trackTimeMillis) : undefined,
              }));

              // Also get release year if missing
              if (tracksToUse[0]?.releaseDate) {
                const dateStr = tracksToUse[0].releaseDate.substring(0, 10);
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  extracted.releaseDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('iTunes tracklist enrichment error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (error: any) {
    console.error('Album API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
