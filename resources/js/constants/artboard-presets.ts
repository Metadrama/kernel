/**
 * Artboard Format Presets
 * 
 * Defines standard dimensions for common output formats.
 * All pixel dimensions calculated at appropriate DPI:
 * - Print: 300 DPI
 * - Screen/Web: 96 DPI
 */

import type { ArtboardPreset, ArtboardDimensions } from '@/types/artboard';

/**
 * Convert millimeters to pixels at given DPI
 */
function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

// ============================================================================
// Print Format Presets
// ============================================================================

const PRINT_DPI = 300;

const A4_PORTRAIT: ArtboardDimensions = {
  widthMm: 210,
  heightMm: 297,
  widthPx: mmToPx(210, PRINT_DPI),
  heightPx: mmToPx(297, PRINT_DPI),
  aspectRatio: 210 / 297,
  dpi: PRINT_DPI,
  label: 'A4 Portrait (210×297mm)',
};

const A4_LANDSCAPE: ArtboardDimensions = {
  widthMm: 297,
  heightMm: 210,
  widthPx: mmToPx(297, PRINT_DPI),
  heightPx: mmToPx(210, PRINT_DPI),
  aspectRatio: 297 / 210,
  dpi: PRINT_DPI,
  label: 'A4 Landscape (297×210mm)',
};

const A3_PORTRAIT: ArtboardDimensions = {
  widthMm: 297,
  heightMm: 420,
  widthPx: mmToPx(297, PRINT_DPI),
  heightPx: mmToPx(420, PRINT_DPI),
  aspectRatio: 297 / 420,
  dpi: PRINT_DPI,
  label: 'A3 Portrait (297×420mm)',
};

const A3_LANDSCAPE: ArtboardDimensions = {
  widthMm: 420,
  heightMm: 297,
  widthPx: mmToPx(420, PRINT_DPI),
  heightPx: mmToPx(297, PRINT_DPI),
  aspectRatio: 420 / 297,
  dpi: PRINT_DPI,
  label: 'A3 Landscape (420×297mm)',
};

const A2_PORTRAIT: ArtboardDimensions = {
  widthMm: 420,
  heightMm: 594,
  widthPx: mmToPx(420, PRINT_DPI),
  heightPx: mmToPx(594, PRINT_DPI),
  aspectRatio: 420 / 594,
  dpi: PRINT_DPI,
  label: 'A2 Portrait (420×594mm)',
};

const A2_LANDSCAPE: ArtboardDimensions = {
  widthMm: 594,
  heightMm: 420,
  widthPx: mmToPx(594, PRINT_DPI),
  heightPx: mmToPx(420, PRINT_DPI),
  aspectRatio: 594 / 420,
  dpi: PRINT_DPI,
  label: 'A2 Landscape (594×420mm)',
};

// ============================================================================
// Presentation Format Presets
// ============================================================================

const SCREEN_DPI = 96;

const SLIDE_16_9: ArtboardDimensions = {
  widthPx: 1920,
  heightPx: 1080,
  aspectRatio: 16 / 9,
  dpi: SCREEN_DPI,
  label: '16:9 Slide (1920×1080px)',
};

const SLIDE_4_3: ArtboardDimensions = {
  widthPx: 1024,
  heightPx: 768,
  aspectRatio: 4 / 3,
  dpi: SCREEN_DPI,
  label: '4:3 Slide (1024×768px)',
};

// ============================================================================
// Web Format Presets
// ============================================================================

const WEB_1440: ArtboardDimensions = {
  widthPx: 1440,
  heightPx: 900,
  aspectRatio: 1440 / 900,
  dpi: SCREEN_DPI,
  label: 'Web 1440px (1440×900px)',
};

const WEB_RESPONSIVE: ArtboardDimensions = {
  widthPx: 1280,
  heightPx: 800,
  aspectRatio: 1280 / 800,
  dpi: SCREEN_DPI,
  label: 'Web Responsive (1280×800px)',
};

// ============================================================================
// Display/TV Format Presets
// ============================================================================

const DISPLAY_FHD: ArtboardDimensions = {
  widthPx: 1920,
  heightPx: 1080,
  aspectRatio: 16 / 9,
  dpi: SCREEN_DPI,
  label: 'Full HD Display (1920×1080px)',
};

const DISPLAY_4K: ArtboardDimensions = {
  widthPx: 3840,
  heightPx: 2160,
  aspectRatio: 16 / 9,
  dpi: SCREEN_DPI,
  label: '4K Display (3840×2160px)',
};

// ============================================================================
// Mobile Format Presets
// ============================================================================

const MOBILE_PORTRAIT: ArtboardDimensions = {
  widthPx: 375,
  heightPx: 667,
  aspectRatio: 9 / 16,
  dpi: SCREEN_DPI,
  label: 'Mobile Portrait (375×667px)',
};

const MOBILE_LANDSCAPE: ArtboardDimensions = {
  widthPx: 667,
  heightPx: 375,
  aspectRatio: 16 / 9,
  dpi: SCREEN_DPI,
  label: 'Mobile Landscape (667×375px)',
};

// ============================================================================
// Preset Registry
// ============================================================================

export const ARTBOARD_PRESETS: Record<string, ArtboardPreset> = {
  // Print
  'a4-portrait': {
    format: 'a4-portrait',
    category: 'print',
    dimensions: A4_PORTRAIT,
    icon: 'FileText',
    description: 'Standard A4 paper in portrait orientation',
  },
  'a4-landscape': {
    format: 'a4-landscape',
    category: 'print',
    dimensions: A4_LANDSCAPE,
    icon: 'FileText',
    description: 'Standard A4 paper in landscape orientation',
  },
  'a3-portrait': {
    format: 'a3-portrait',
    category: 'print',
    dimensions: A3_PORTRAIT,
    icon: 'FileText',
    description: 'A3 paper in portrait orientation',
  },
  'a3-landscape': {
    format: 'a3-landscape',
    category: 'print',
    dimensions: A3_LANDSCAPE,
    icon: 'FileText',
    description: 'A3 paper in landscape orientation',
  },
  'a2-portrait': {
    format: 'a2-portrait',
    category: 'print',
    dimensions: A2_PORTRAIT,
    icon: 'FileText',
    description: 'A2 paper in portrait orientation',
  },
  'a2-landscape': {
    format: 'a2-landscape',
    category: 'print',
    dimensions: A2_LANDSCAPE,
    icon: 'FileText',
    description: 'A2 paper in landscape orientation',
  },
  
  // Presentation
  'slide-16-9': {
    format: 'slide-16-9',
    category: 'presentation',
    dimensions: SLIDE_16_9,
    icon: 'Presentation',
    description: 'Widescreen presentation slide',
  },
  'slide-4-3': {
    format: 'slide-4-3',
    category: 'presentation',
    dimensions: SLIDE_4_3,
    icon: 'Presentation',
    description: 'Standard presentation slide',
  },
  
  // Web
  'web-1440': {
    format: 'web-1440',
    category: 'web',
    dimensions: WEB_1440,
    icon: 'Monitor',
    description: 'Fixed width web layout at 1440px',
  },
  'web-responsive': {
    format: 'web-responsive',
    category: 'web',
    dimensions: WEB_RESPONSIVE,
    icon: 'Monitor',
    description: 'Responsive web layout',
  },
  
  // Display
  'display-fhd': {
    format: 'display-fhd',
    category: 'display',
    dimensions: DISPLAY_FHD,
    icon: 'Tv',
    description: 'Full HD display or TV screen',
  },
  'display-4k': {
    format: 'display-4k',
    category: 'display',
    dimensions: DISPLAY_4K,
    icon: 'Tv',
    description: '4K Ultra HD display',
  },
  
  // Mobile
  'mobile-portrait': {
    format: 'mobile-portrait',
    category: 'mobile',
    dimensions: MOBILE_PORTRAIT,
    icon: 'Smartphone',
    description: 'Mobile device in portrait orientation',
  },
  'mobile-landscape': {
    format: 'mobile-landscape',
    category: 'mobile',
    dimensions: MOBILE_LANDSCAPE,
    icon: 'Smartphone',
    description: 'Mobile device in landscape orientation',
  },
};

/**
 * Get preset by format
 */
export function getArtboardPreset(format: string): ArtboardPreset | undefined {
  return ARTBOARD_PRESETS[format];
}

/**
 * Get all presets for a category
 */
export function getPresetsByCategory(category: string): ArtboardPreset[] {
  return Object.values(ARTBOARD_PRESETS).filter(preset => preset.category === category);
}

/**
 * Get all preset categories
 */
export const ARTBOARD_CATEGORIES = [
  { id: 'print', label: 'Print', icon: 'Printer' },
  { id: 'presentation', label: 'Presentation', icon: 'Presentation' },
  { id: 'web', label: 'Web', icon: 'Globe' },
  { id: 'display', label: 'Display/TV', icon: 'Tv' },
  { id: 'mobile', label: 'Mobile', icon: 'Smartphone' },
] as const;
