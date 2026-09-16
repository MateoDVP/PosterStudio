import { PrintSize, PrintSizeKey, PresetPrintSizeKey, CustomSizeConfig } from '@/types/poster';

/**
 * High-Resolution 300 DPI Physical Print Specifications
 * Formula: Pixels = Math.round((mm / 25.4) * 300)
 * 1 cm = 10 mm
 */
export const PRINT_SIZES: Record<PresetPrintSizeKey, PrintSize> = {
  a5: {
    id: 'a5',
    name: 'A5 (14.8 × 21 cm)',
    category: 'ISO Standard',
    widthMm: 148,
    heightMm: 210,
    widthPx300Dpi: 1748,
    heightPx300Dpi: 2480,
    aspectRatioClass: 'aspect-[148/210]',
    aspectRatioRatio: 148 / 210,
  },
  a4: {
    id: 'a4',
    name: 'A4 (21 × 29.7 cm)',
    category: 'ISO Standard',
    widthMm: 210,
    heightMm: 297,
    widthPx300Dpi: 2480,
    heightPx300Dpi: 3508,
    aspectRatioClass: 'aspect-[210/297]',
    aspectRatioRatio: 210 / 297,
  },
  a3: {
    id: 'a3',
    name: 'A3 (29.7 × 42 cm)',
    category: 'ISO Standard',
    widthMm: 297,
    heightMm: 420,
    widthPx300Dpi: 3508,
    heightPx300Dpi: 4960,
    aspectRatioClass: 'aspect-[297/420]',
    aspectRatioRatio: 297 / 420,
  },
  '30x40': {
    id: '30x40',
    name: '30 × 40 cm',
    category: 'Poster Art',
    widthMm: 300,
    heightMm: 400,
    widthPx300Dpi: 3543,
    heightPx300Dpi: 4724,
    aspectRatioClass: 'aspect-[3/4]',
    aspectRatioRatio: 300 / 400,
  },
  '50x70': {
    id: '50x70',
    name: '50 × 70 cm',
    category: 'Poster Art',
    widthMm: 500,
    heightMm: 700,
    widthPx300Dpi: 5906,
    heightPx300Dpi: 8268,
    aspectRatioClass: 'aspect-[5/7]',
    aspectRatioRatio: 500 / 700,
  },
};

export const PRESET_PRINT_SIZE_KEYS: PresetPrintSizeKey[] = ['a5', 'a4', 'a3', '30x40', '50x70'];

export const DEFAULT_PRINT_SIZE: PresetPrintSizeKey = 'a3';

export const DEFAULT_CUSTOM_SIZE: CustomSizeConfig = {
  widthCm: 40,
  heightCm: 50,
};

/**
 * Genera una especificación PrintSize dinámica a partir de medidas en centímetros
 */
export function createCustomPrintSize(widthCm: number, heightCm: number): PrintSize {
  const clampedW = Math.max(5, Math.min(300, Number(widthCm) || 40));
  const clampedH = Math.max(5, Math.min(300, Number(heightCm) || 50));
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
