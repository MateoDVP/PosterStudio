export type PrintSizeKey = 'a5' | 'a4' | 'a3' | '30x40' | '50x70';

export interface PrintSize {
  id: PrintSizeKey;
  name: string;
  category: 'ISO Standard' | 'Poster Art';
  widthMm: number;
  heightMm: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
  aspectRatioClass: string;
  aspectRatioRatio: number; // width / height
}

export type TemplateType = 'album-gallery' | 'song-player';

export interface TrackItem {
  id: string;
  number: number;
  title: string;
  duration?: string;
}

export interface AlbumData {
  title: string;
  artist: string;
  releaseDate: string; // e.g. "05/06/2022"
  totalDuration?: string;
  coverUrl: string;
  spotifyCoverUrl?: string;
  itunesCoverUrl?: string;
  spotifyUri: string; // e.g. "spotify:album:123..."
  tracks: TrackItem[];
  soundwaveColor: string; // hex color for code
  soundwaveBgColor: string; // 'transparent' | 'ffffff' | '000000'
  trackColumns: 1 | 2;
  uppercaseTitle: boolean;
  titleColor?: string;
  artistColor?: string;
  tracklistColor?: string;
}

export interface PlayerData {
  title: string;
  artist: string;
  coverUrl: string;
  spotifyCoverUrl?: string;
  itunesCoverUrl?: string;
  spotifyUri: string; // e.g. "spotify:track:123..."
  currentTime: string; // e.g. "0:50"
  totalTime: string; // e.g. "-2:53"
  progressPercent: number; // 0 to 100
  isLiked: boolean;
  isBlackAndWhite: boolean;
  coverBorderRadius: number; // 0 to 24px
  soundwaveColor: string;
  titleColor?: string;
  artistColor?: string;
}

export interface PosterConfig {
  template: TemplateType;
  sizeKey: PrintSizeKey;
  backgroundColor: string; // default "#FFFFFF"
  textColor: string; // default "#000000"
  accentColor: string; // default "#1DB954" (Spotify green) or album dominant
  enableBlurredBackground?: boolean;
  blurredBackgroundOpacity?: number; // 0.1 to 1, default 0.65
  blurredBackgroundBlur?: number; // 10 to 60px, default 35
  blurredBackgroundOverlay?: 'dark' | 'light' | 'paper'; // default 'dark'
  album: AlbumData;
  player: PlayerData;
}

export interface ExtractedMusicData {
  type: 'album' | 'track';
  title: string;
  artist: string;
  releaseDate: string;
  coverUrl: string;
  spotifyCoverUrl?: string;
  itunesCoverUrl?: string;
  highResCoverUrl?: string;
  upc?: string;
  isrc?: string;
  spotifyUri: string;
  tracks: {
    id: string;
    number: number;
    title: string;
    duration?: string;
  }[];
  durationMs?: number;
}



