/**
 * Artboard Type Definitions
 * 
 * Artboards are fixed-dimension containers for widgets that represent
 * specific output formats (print, presentation, display, mobile).
 * 
 * Key principles:
 * - Artboards have FIXED dimensions based on their format preset
 * - NO resizing - only positioning on canvas
 * - Act as true format containers (A4, 16:9, etc.)
 */

import type { WidgetSchema } from './dashboard';

/**
 * Supported artboard format presets
 */
export type ArtboardFormat =
  // Print formats
  | 'a4-portrait'
  | 'a4-landscape'
  | 'a3-portrait'
  | 'a3-landscape'
  | 'a2-portrait'
  | 'a2-landscape'
  // Presentation formats
  | 'slide-16-9'
  | 'slide-4-3'
  // Web formats
  | 'web-1440'
  | 'web-responsive'
  // Display/TV formats
  | 'display-fhd'      // 1920×1080
  | 'display-4k'       // 3840×2160
  // Mobile formats
  | 'mobile-portrait'  // 9:16
  | 'mobile-landscape' // 16:9
  // Custom
  | 'custom';

/**
 * Artboard dimensions with physical and pixel measurements
 */
export interface ArtboardDimensions {
  /** Width in millimeters (for print formats) */
  widthMm?: number;
  /** Height in millimeters (for print formats) */
  heightMm?: number;
  /** Width in pixels at specified DPI */
  widthPx: number;
  /** Height in pixels at specified DPI */
  heightPx: number;
  /** Aspect ratio (width/height) */
  aspectRatio: number;
  /** DPI for rendering (96 for screen, 300 for print) */
  dpi: number;
  /** Display label for UI */
  label: string;
}

/**
 * Artboard category for organizing presets
 */
export type ArtboardCategory = 'print' | 'presentation' | 'web' | 'display' | 'mobile' | 'custom';

/**
 * Artboard preset definition
 */
export interface ArtboardPreset {
  format: ArtboardFormat;
  category: ArtboardCategory;
  dimensions: ArtboardDimensions;
  icon?: string;
  description?: string;
}

/**
 * Position on infinite canvas
 */
export interface CanvasPosition {
  x: number;
  y: number;
}

/**
 * Artboard schema - represents a single artboard instance
 */
export interface ArtboardSchema {
  /** Unique identifier */
  id: string;
  /** User-defined name */
  name: string;
  /** Format preset type */
  format: ArtboardFormat;
  /** Fixed dimensions (immutable after creation) */
  dimensions: ArtboardDimensions;
  /** Position on infinite canvas */
  position: CanvasPosition;
  /** Zoom level for this artboard (1 = 100%) */
  zoom: number;
  /** Background color */
  backgroundColor: string;
  /** Background image URL (optional) */
  backgroundImage?: string;
  /** Widgets contained within this artboard */
  widgets: WidgetSchema[];
  /** Whether artboard position is locked */
  locked: boolean;
  /** Whether artboard is visible */
  visible: boolean;
  /** Show grid guides */
  showGrid: boolean;
  /** Show ruler guides */
  showRulers: boolean;
  /** Internal padding for grid (px) */
  gridPadding: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Artboard creation options
 */
export interface CreateArtboardOptions {
  format: ArtboardFormat;
  name?: string;
  position?: CanvasPosition;
  backgroundColor?: string;
}

/**
 * Artboard update options (only mutable properties)
 */
export interface UpdateArtboardOptions {
  name?: string;
  position?: CanvasPosition;
  zoom?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  locked?: boolean;
  visible?: boolean;
  showGrid?: boolean;
  showRulers?: boolean;
  gridPadding?: number;
}
