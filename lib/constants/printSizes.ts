import {
  PrintSize,
  PrintSizeKey,
  PresetPrintSizeKey,
  CustomSizeConfig,
  FinishType,
} from '@/types/poster';

/**
 * High-Resolution 300 DPI Physical Print Specifications
 * Formula: Pixels = Math.round((mm / 25.4) * 300)
 * 1 cm = 10 mm
 */
export const PRINT_SIZES: Record<PresetPrintSizeKey, PrintSize> = {
  '23x30': {
    id: '23x30',
    name: '23 × 30 cm',
    category: 'Poster Art',
    widthMm: 230,
    heightMm: 300,
    widthPx300Dpi: 2717,
    heightPx300Dpi: 3543,
    aspectRatioClass: 'aspect-[23/30]',
    aspectRatioRatio: 230 / 300,
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
  '23x30',
  '29.8x39.8',
  '39.8x49.8',
  '49.8x69.8',
];

export const DEFAULT_PRINT_SIZE: PresetPrintSizeKey = '29.8x39.8';

export const DEFAULT_CUSTOM_SIZE: CustomSizeConfig = {
  widthCm: 29.8,
  heightCm: 39.8,
};

export const DEFAULT_MDF_BLEED_CM = 2; // 2 cm por cada lado para doblar sobre el canto del MDF

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
 * Resuelve el tamaño base del póster (la medida del marco o de la cara frontal de la tabla MDF)
 */
export function getBasePrintSize(config: {
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

export interface ResolvedPrintDimensions {
  baseSize: PrintSize; // Medida física de la tabla MDF o del marco
  sheetSize: PrintSize; // Medida total de la lámina a imprimir (incluyendo sangrado si es MDF)
  isMdf: boolean;
  bleedCm: number;
  bleedMm: number;
}

/**
 * Devuelve tanto las dimensiones de la madera/marco como las dimensiones totales de la lámina
 */
export function getResolvedPrintDimensions(config: {
  sizeKey: PrintSizeKey;
  customSize?: CustomSizeConfig;
  finishType?: FinishType;
  mdfBleedCm?: number;
}): ResolvedPrintDimensions {
  const baseSize = getBasePrintSize(config);
  const isMdf = config.finishType === 'mdf';
  const bleedCm = isMdf ? (config.mdfBleedCm ?? DEFAULT_MDF_BLEED_CM) : 0;
  const bleedMm = Math.round(bleedCm * 10);

  if (!isMdf || bleedMm <= 0) {
    return {
      baseSize,
      sheetSize: baseSize,
      isMdf: false,
      bleedCm: 0,
      bleedMm: 0,
    };
  }

  const sheetWidthMm = baseSize.widthMm + bleedMm * 2;
  const sheetHeightMm = baseSize.heightMm + bleedMm * 2;
  const widthPx300Dpi = Math.round((sheetWidthMm / 25.4) * 300);
  const heightPx300Dpi = Math.round((sheetHeightMm / 25.4) * 300);

  const sheetSize: PrintSize = {
    id: baseSize.id,
    name: `MDF ${baseSize.name} (+${bleedCm}cm sangrado)`,
    category: 'Personalizado',
    widthMm: sheetWidthMm,
    heightMm: sheetHeightMm,
    widthPx300Dpi,
    heightPx300Dpi,
    aspectRatioClass: `aspect-[${sheetWidthMm}/${sheetHeightMm}]`,
    aspectRatioRatio: sheetWidthMm / sheetHeightMm,
  };

  return {
    baseSize,
    sheetSize,
    isMdf: true,
    bleedCm,
    bleedMm,
  };
}

/**
 * Resuelve el PrintSize activo.
 * Si es acabado MDF, devuelve las dimensiones totales de la lámina de impresión física (con 2 cm de sangrado por lado).
 * Si es marco tradicional, devuelve las dimensiones del marco.
 */
export function getActivePrintSize(config: {
  sizeKey: PrintSizeKey;
  customSize?: CustomSizeConfig;
  finishType?: FinishType;
  mdfBleedCm?: number;
}): PrintSize {
  return getResolvedPrintDimensions(config).sheetSize;
}

