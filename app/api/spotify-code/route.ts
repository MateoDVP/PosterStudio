import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uri = searchParams.get('uri') || 'spotify:album:3RQQmkQEvNCY4prGKE6oc5';
  let bgColor = (searchParams.get('bgColor') || 'ffffff').replace('#', '').toLowerCase();
  let codeColor = (searchParams.get('codeColor') || '000000').replace('#', '').toLowerCase();

  // Normalize color to 6-char hex
  const targetHex = codeColor.length === 6 ? `#${codeColor}` : `#${codeColor.padEnd(6, '0')}`;

  try {
    // 1. Fetch the 100% AUTHENTIC, SCANNABLE official SVG from Spotify in black & white
    // Spotify scannables API strictly requires "white" and "black" to generate valid scannable bars.
    const spotifySvgUrl = `https://scannables.scdn.co/uri/plain/svg/ffffff/black/640/${encodeURIComponent(uri)}`;

    const response = await fetch(spotifySvgUrl, {
      headers: {
        'User-Agent': 'PosterStudio/1.0',
      },
      next: { revalidate: 86400 },
    });

    if (response.ok) {
      let svg = await response.text();

      // 2. Handle background color FIRST before recoloring elements
      if (bgColor === 'transparent') {
        // Remove background rect so it's transparent and blends onto any poster background
        svg = svg.replace(/<rect\s+[^>]*width="400"[^>]*height="100"[^>]*\/?>/gi, '');
      } else if (bgColor !== 'ffffff') {
        const bgHex = `#${bgColor}`;
        svg = svg.replace(
          /<rect\s+[^>]*width="400"[^>]*height="100"[^>]*\/?>/gi,
          `<rect x="0" y="0" width="400" height="100" fill="${bgHex}"/>`
        );
      }

      // 3. Dynamically recolor the official scannable bars & official Spotify vector logo
      // In Spotify's official SVG, all bars and the logo path have fill="#000000"
      svg = svg.replace(/fill="#000000"/gi, `fill="${targetHex}"`);
      svg = svg.replace(/fill="black"/gi, `fill="${targetHex}"`);

      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Fallback if Spotify CDN is temporarily unreachable
    return new NextResponse('Error fetching official Spotify code', { status: 502 });
  } catch (err: any) {
    console.error('Spotify code proxy error:', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
