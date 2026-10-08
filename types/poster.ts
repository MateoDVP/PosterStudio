export type PresetPrintSizeKey = '23x30' | '29.8x39.8' | '39.8x49.8' | '49.8x69.8';
export type PrintSizeKey = PresetPrintSizeKey | 'custom';

export interface CustomSizeConfig {
  widthCm: number;
  heightCm: number;
}

export interface PrintSize {
  id: PrintSizeKey;
  name: string;
  category: 'ISO Standard' | 'Poster Art' | 'Personalizado';
  widthMm: number;
  heightMm: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
  aspectRatioClass: string;
  aspectRatioRatio: number; // width / height
}

export type TemplateType = 'album-gallery' | 'song-player' | 'album-classic';

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
  col1TrackCount?: number; // Cantidad de canciones asignadas al bloque 1 (el resto va al bloque 2)
  uppercaseTitle: boolean;
  titleColor?: string;
  artistColor?: string;
  tracklistColor?: string;
  releaseDateColor?: string;
  durationColor?: string;
  palette?: string[]; // 5 colores dominantes extraídos con ColorThief
  showPalette?: boolean; // Alternar visibilidad de los cuadritos de paleta en el póster
  titleFontSize?: number; // Tamaño numérico del título en px
  artistFontSize?: number; // Tamaño numérico del artista en px
  tracklistFontSize?: number; // Tamaño numérico del tracklist en px
  metadataFontSize?: number; // Tamaño numérico de fecha y duración en px (etiquetas se escalan proporcionalmente)
  spotifyCodeSize?: number; // Altura numérica del código Spotify en px
  paletteSize?: number; // Tamaño numérico de los cuadros/muestras de la paleta en px
  paletteBorder?: boolean; // Alternar si los cuadros de paleta tienen borde exterior (por defecto true)
  paletteBorderColor?: string; // Color del borde exterior de los cuadros (por defecto '#FFFFFF')
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
  isPlaying?: boolean; // true = icono Pausa (||) como en la referencia, false = icono Play (▶)
  isBlackAndWhite: boolean;
  coverBorderRadius: number; // 0 to 24px
  soundwaveColor: string;
  titleColor?: string;
  artistColor?: string;
  palette?: string[]; // 5 colores dominantes de la carátula
  showPalette?: boolean; // visibilidad de los 5 rectángulos de paleta al pie
  titleFontSize?: number; // Tamaño numérico del título en px
  artistFontSize?: number; // Tamaño numérico del artista en px
  spotifyCodeSize?: number; // Altura numérica del código Spotify en px
  paletteSize?: number; // Tamaño numérico / altura de los rectángulos de la paleta en px
  paletteBorder?: boolean; // Alternar si los cuadros de paleta tienen borde exterior (por defecto true)
  paletteBorderColor?: string; // Color del borde exterior de los cuadros (por defecto '#FFFFFF')
}

export type FinishType = 'frame' | 'mdf';

export interface PosterConfig {
  template: TemplateType;
  finishType?: FinishType; // 'frame' (Cuadro con Marco) | 'mdf' (Retablo MDF con sangrado)
  mdfBleedCm?: number; // Sangrado perimetral por cada lado en cm (por defecto 2)
  sizeKey: PrintSizeKey;
  customSize?: CustomSizeConfig;
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
  totalDuration?: string;
}



