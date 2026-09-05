import { PrintSize, PrintSizeKey } from '@/types/poster';

/**
 * High-Resolution 300 DPI Physical Print Specifications
 * Formula: Pixels = Math.round((mm / 25.4) * 300)
 */
export const PRINT_SIZES: Record<PrintSizeKey, PrintSize> = {
  a5: {
    id: 'a5',
    name: 'A5 (148 × 210 mm)',
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
    name: 'A4 (210 × 297 mm)',
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
    name: 'A3 (297 × 420 mm)',
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
    name: '30 × 40 cm (300 × 400 mm)',
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
    name: '50 × 70 cm (500 × 700 mm)',
    category: 'Poster Art',
    widthMm: 500,
    heightMm: 700,
    widthPx300Dpi: 5906,
    heightPx300Dpi: 8268,
    aspectRatioClass: 'aspect-[5/7]',
    aspectRatioRatio: 500 / 700,
  },
};

export const DEFAULT_PRINT_SIZE: PrintSizeKey = 'a3';
