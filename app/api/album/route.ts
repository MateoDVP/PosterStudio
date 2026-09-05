import { NextRequest, NextResponse } from 'next/server';
import {
  parseSpotifyUrl,
  getSpotifyAccessToken,
  fetchViaSpotifyApi,
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

    // 1. Authenticate with official Spotify Web API
    const token = await getSpotifyAccessToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Credenciales de Spotify no configuradas o inválidas. Configura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en tu archivo .env.local para consultar la API oficial.',
        },
        { status: 401 }
      );
    }

    // 2. Fetch official data from Spotify Web API
    const extracted: ExtractedMusicData | null = await fetchViaSpotifyApi(
      token,
      parsed.type as 'album' | 'track',
      parsed.id
    );

    if (!extracted) {
      return NextResponse.json(
        { success: false, error: 'No se encontró el álbum o canción en la API oficial de Spotify.' },
        { status: 404 }
      );
    }

    // 3. Exact High-Resolution Cover Matching for dual selector (Apple Music 3000px vs Spotify 640px)
    const originalSpotifyCover = extracted.coverUrl;
    extracted.spotifyCoverUrl = originalSpotifyCover;

    let highResCover: string | null = null;
    if (extracted.type === 'album' && extracted.upc) {
      highResCover = await fetchITunesByUpc(extracted.upc);
    } else if (extracted.type === 'track' && extracted.isrc) {
      highResCover = await fetchITunesByIsrc(extracted.isrc);
    }

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
      extracted.coverUrl = highResCover; // Default to 3000px Apple Master for printing
    } else {
      extracted.coverUrl = originalSpotifyCover;
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
