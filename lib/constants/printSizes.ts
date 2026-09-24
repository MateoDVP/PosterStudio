import { PrintSize, PrintSizeKey, PresetPrintSizeKey, CustomSizeConfig } from '@/types/poster';

/**
 * High-Resolution 300 DPI Physical Print Specifications
 * Formula: Pixels = Math.round((mm / 25.4) * 300)
 * 1 cm = 10 mm
 */
export const PRINT_SIZES: Record<PresetPrintSizeKey, PrintSize> = {
  '24.8x29.8': {
    id: '24.8x29.8',
    name: '24.8 × 29.8 cm',
    category: 'Poster Art',
    widthMm: 248,
    heightMm: 298,
    widthPx300Dpi: 2929,
    heightPx300Dpi: 3520,
    aspectRatioClass: 'aspect-[248/298]',
    aspectRatioRatio: 248 / 298,
  },
  '29.8x39.8': {
    id: '29.8x39.8',
    name: '29.8 × 39.8 cm',
    category: 'Poster Art',
    widthMm: 298,
    heightMm: 398,
    widthPx300Dpi: 3520,
    heightPx300Dpi: 4701,
    aspectRatioClass: 'aspect-[298/398]',
    aspectRatioRatio: 298 / 398,
  },
  '39.8x49.8': {
    id: '39.8x49.8',
    name: '39.8 × 49.8 cm',
    category: 'Poster Art',
    widthMm: 398,
    heightMm: 498,
    widthPx300Dpi: 4701,
    heightPx300Dpi: 5882,
    aspectRatioClass: 'aspect-[398/498]',
    aspectRatioRatio: 398 / 498,
  },
  '49.8x69.8': {
    id: '49.8x69.8',
    name: '49.8 × 69.8 cm',
    category: 'Poster Art',
    widthMm: 498,
    heightMm: 698,
    widthPx300Dpi: 5882,
    heightPx300Dpi: 8244,
    aspectRatioClass: 'aspect-[498/698]',
    aspectRatioRatio: 498 / 698,
  },
};

export const PRESET_PRINT_SIZE_KEYS: PresetPrintSizeKey[] = [
  '24.8x29.8',
  '29.8x39.8',
  '39.8x49.8',
  '49.8x69.8',
];

export const DEFAULT_PRINT_SIZE: PresetPrintSizeKey = '29.8x39.8';

export const DEFAULT_CUSTOM_SIZE: CustomSizeConfig = {
  widthCm: 29.8,
  heightCm: 39.8,
};

/**
 * Genera una especificación PrintSize dinámica a partir de medidas en centímetros
 */
export function createCustomPrintSize(widthCm: number, heightCm: number): PrintSize {
  const clampedW = Math.max(5, Math.min(300, Number(widthCm) || DEFAULT_CUSTOM_SIZE.widthCm));
  const clampedH = Math.max(5, Math.min(300, Number(heightCm) || DEFAULT_CUSTOM_SIZE.heightCm));
  const widthMm = Math.round(clampedW * 10);
  const heightMm = Math.round(clampedH * 10);
  const widthPx300Dpi = Math.round((widthMm / 25.4) * 300);
  const heightPx300Dpi = Math.round((heightMm / 25.4) * 300);

  return {
    id: 'custom',
    name: `Personalizado (${clampedW} × ${clampedH} cm)`,
    category: 'Personalizado',
    widthMm,
    heightMm,
    widthPx300Dpi,
    heightPx300Dpi,
    aspectRatioClass: `aspect-[${widthMm}/${heightMm}]`,
    aspectRatioRatio: widthMm / heightMm,
  };
}

/**
 * Resuelve el PrintSize activo considerando tanto formatos predefinidos como personalizados
 */
export function getActivePrintSize(config: {
  sizeKey: PrintSizeKey;
  customSize?: CustomSizeConfig;
}): PrintSize {
  if (config.sizeKey === 'custom') {
    return createCustomPrintSize(
      config.customSize?.widthCm ?? DEFAULT_CUSTOM_SIZE.widthCm,
      config.customSize?.heightCm ?? DEFAULT_CUSTOM_SIZE.heightCm
    );
  }
  return PRINT_SIZES[config.sizeKey as PresetPrintSizeKey] || PRINT_SIZES[DEFAULT_PRINT_SIZE];
}
