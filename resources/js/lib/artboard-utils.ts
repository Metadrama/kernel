/**
 * Artboard Utility Functions
 * 
 * Helper functions for artboard operations:
 * - Creation with defaults
 * - Dimension calculations
 * - Position utilities
 * - Validation
 */

import type {
  ArtboardSchema,
  ArtboardFormat,
  CreateArtboardOptions,
  CanvasPosition,
  ArtboardDimensions,
} from '@/types/artboard';
import { getArtboardPreset } from '@/constants/artboard-presets';

/**
 * Generate unique artboard ID
 */
export function generateArtboardId(): string {
  return `artboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default artboard name based on format
 */
export function getDefaultArtboardName(format: ArtboardFormat): string {
  const preset = getArtboardPreset(format);
  if (!preset) return 'Untitled Artboard';

  const categoryLabels: Record<string, string> = {
    print: 'Print',
    presentation: 'Slide',
    web: 'Web',
    display: 'Display',
    mobile: 'Mobile',
  };

  return `${categoryLabels[preset.category] || 'Artboard'}`;
}

/**
 * Calculate default position for new artboard
 * Places artboards in a horizontal flow layout (like Figma)
 */
export function calculateDefaultPosition(
  existingArtboards: ArtboardSchema[],
  dimensions: ArtboardDimensions
): CanvasPosition {
  if (existingArtboards.length === 0) {
    // First artboard: start at top-left with padding
    return { x: 100, y: 100 };
  }

  // Horizontal flow: place to the right of the last artboard
  const spacing = 100; // Gap between artboards
  const lastArtboard = existingArtboards[existingArtboards.length - 1];

  return {
    x: lastArtboard.position.x + lastArtboard.dimensions.widthPx + spacing,
    y: lastArtboard.position.y, // Same vertical position
  };
}

/**
 * Create a new artboard with defaults
 */
export function createArtboard(
  options: CreateArtboardOptions,
  existingArtboards: ArtboardSchema[] = []
): ArtboardSchema {
  const preset = getArtboardPreset(options.format);

  if (!preset) {
    throw new Error(`Invalid artboard format: ${options.format}`);
  }

  const dimensions = preset.dimensions;
  const position = options.position || calculateDefaultPosition(existingArtboards, dimensions);
  const name = options.name || getDefaultArtboardName(options.format);

  const now = new Date().toISOString();

  return {
    id: generateArtboardId(),
    name,
    format: options.format,
    dimensions,
    position,
    zoom: 1,
    backgroundColor: options.backgroundColor || '#ffffff',
    widgets: [],
    locked: false,
    visible: true,
    showGrid: true,
    showRulers: false,
    gridPadding: ARTBOARD_CONTAINER_PADDING,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate artboard bounds (for collision detection, viewport checks)
 */
export interface ArtboardBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function getArtboardBounds(artboard: ArtboardSchema): ArtboardBounds {
  const { position, dimensions } = artboard;

  return {
    left: position.x,
    top: position.y,
    right: position.x + dimensions.widthPx,
    bottom: position.y + dimensions.heightPx,
    width: dimensions.widthPx,
    height: dimensions.heightPx,
  };
}

/**
 * Check if a point is within artboard bounds
 */
export function isPointInArtboard(
  point: CanvasPosition,
  artboard: ArtboardSchema
): boolean {
  const bounds = getArtboardBounds(artboard);

  return (
    point.x >= bounds.left &&
    point.x <= bounds.right &&
    point.y >= bounds.top &&
    point.y <= bounds.bottom
  );
}

/**
 * Check if two artboards overlap
 */
export function doArtboardsOverlap(
  artboard1: ArtboardSchema,
  artboard2: ArtboardSchema
): boolean {
  const bounds1 = getArtboardBounds(artboard1);
  const bounds2 = getArtboardBounds(artboard2);

  return !(
    bounds1.right < bounds2.left ||
    bounds1.left > bounds2.right ||
    bounds1.bottom < bounds2.top ||
    bounds1.top > bounds2.bottom
  );
}

/**
 * Find artboard at canvas position
 * Returns topmost artboard if multiple overlap
 */
export function findArtboardAtPosition(
  position: CanvasPosition,
  artboards: ArtboardSchema[]
): ArtboardSchema | null {
  // Check in reverse order (topmost first)
  for (let i = artboards.length - 1; i >= 0; i--) {
    const artboard = artboards[i];
    if (artboard.visible && isPointInArtboard(position, artboard)) {
      return artboard;
    }
  }

  return null;
}

/**
 * Validate artboard position (ensure it's not too far off canvas)
 */
export function validateArtboardPosition(
  position: CanvasPosition,
  canvasSize: { width: number; height: number }
): CanvasPosition {
  const maxOffset = 10000; // Maximum pixels off-canvas

  return {
    x: Math.max(-maxOffset, Math.min(position.x, canvasSize.width + maxOffset)),
    y: Math.max(-maxOffset, Math.min(position.y, canvasSize.height + maxOffset)),
  };
}

/**
 * Calculate grid cell size for artboard
 * Used for GridStack configuration within artboard
 * 
 * Uses small cells (8px) for near-pixel freeform placement while
 * maintaining GridStack drag/resize/transfer capabilities.
 */
export function calculateArtboardGridConfig(dimensions: ArtboardDimensions) {
  // Small cell size for freeform placement (near-pixel precision)
  const CELL_SIZE = 8; // px - small enough for freeform, large enough for performance
  const MARGIN = 4;     // Reduced margin for tighter layout

  // Calculate how many columns fit in this artboard
  const effectiveWidth = dimensions.widthPx - MARGIN * 2;
  const columns = Math.max(8, Math.floor(effectiveWidth / CELL_SIZE));

  return {
    columns,
    cellHeight: CELL_SIZE,
    margin: MARGIN,
  };
}

/**
 * Artboard container padding (from Tailwind p-4 class)
 * This padding reduces the actual available space for GridStack
 */
export const ARTBOARD_CONTAINER_PADDING = 16; // px (p-4 = 16px)

/**
 * Calculate effective grid configuration accounting for container padding
 * 
 * The GridStack container has padding which reduces available space.
 * This function calculates the true dimensions GridStack can use.
 */
export function calculateEffectiveGridConfig(dimensions: ArtboardDimensions, padding: number = ARTBOARD_CONTAINER_PADDING) {
  // Account for container padding on both sides
  const paddingTotal = padding * 2;

  const effectiveDimensions: ArtboardDimensions = {
    ...dimensions,
    widthPx: dimensions.widthPx - paddingTotal,
    heightPx: dimensions.heightPx - paddingTotal,
  };

  const gridConfig = calculateArtboardGridConfig(effectiveDimensions);

  // Calculate maximum rows based on effective height
  const maxRows = Math.ceil(effectiveDimensions.heightPx / gridConfig.cellHeight);

  return {
    ...gridConfig,
    maxRows,
    effectiveWidth: effectiveDimensions.widthPx,
    effectiveHeight: effectiveDimensions.heightPx,
  };
}

/**
 * Scale dimensions while maintaining aspect ratio
 * Used for zoom/preview functionality
 */
export function scaleDimensions(
  dimensions: ArtboardDimensions,
  scale: number
): { width: number; height: number } {
  return {
    width: Math.round(dimensions.widthPx * scale),
    height: Math.round(dimensions.heightPx * scale),
  };
}

/**
 * Convert canvas coordinates to artboard-local coordinates
 */
export function canvasToArtboardCoords(
  canvasPos: CanvasPosition,
  artboard: ArtboardSchema
): CanvasPosition {
  return {
    x: canvasPos.x - artboard.position.x,
    y: canvasPos.y - artboard.position.y,
  };
}

/**
 * Convert artboard-local coordinates to canvas coordinates
 */
export function artboardToCanvasCoords(
  localPos: CanvasPosition,
  artboard: ArtboardSchema
): CanvasPosition {
  return {
    x: localPos.x + artboard.position.x,
    y: localPos.y + artboard.position.y,
  };
}

/**
 * Find the next available non-overlapping position for a widget
 * Uses a radial search pattern starting from the preferred "Right" position.
 */
export function findNextAvailablePosition(
  sourceWidget: { x: number; y: number; w: number; h: number },
  existingWidgets: { x: number; y: number; w: number; h: number; id: string }[],
  gridConfig: { columns: number; maxRows: number }
): { x: number; y: number } {
  const { x, y, w, h } = sourceWidget;
  const { columns, maxRows } = gridConfig;

  // Collision check helper
  const isOccupied = (tx: number, ty: number) => {
    return existingWidgets.some(other =>
      other.id !== (sourceWidget as any).id && // Safety check if source is in list
      tx < other.x + other.w &&
      tx + w > other.x &&
      ty < other.y + other.h &&
      ty + h > other.y
    );
  };

  // 1. Try immediate Preferred Spots (Right, Bottom)
  const preferred = [
    { x: x + w, y: y }, // Right
    { x: x, y: y + h }, // Bottom
  ];

  for (const p of preferred) {
    if (p.x + w <= columns && p.y + h <= maxRows && !isOccupied(p.x, p.y)) {
      return p;
    }
  }

  // 2. Radial Search (Spiral)
  // We search in expanding concentric layers around the center (x, y)
  // Step size = 1 grid unit (cellHeight/8px is small, maybe use w/2 or fixed step?)
  // Actually, searching every single grid unit is expensive if layer is huge.
  // But grid units are the atomic unit.

  // Optimization: Scan in larger steps first? No, GridStack aligns to 1 unit.

  // Limit search radius
  const maxRadius = Math.max(columns, maxRows);

  // Start from radius 1 (we already checked immediate attached spots, but simple spiral covers them too)
  // We want to find NEAREST valid hole.
  // We can just BFS/flood fill the grid state? No, simply iterate distance.

  // Simplified Spiral:
  // Iterate d from 1 to maxRadius
  // Check perimeter: (x-d, y-d) to (x+d, y+d)

  // To optimize for "Reading Order" (Right/Down preference), we can sort checks.

  // Let's rely on a simpler Grid Scan starting from top-left of the bounding area of the widget
  // But scan OUTWARDS.

  for (let r = 1; r < 200; r++) { // Hard limit 200 units radius
    // Check X direction (Right and Left sides of the box)
    for (let dy = -r; dy <= r; dy++) {
      // Right Side
      let tx = x + r;
      let ty = y + dy;
      if (tx >= 0 && tx + w <= columns && ty >= 0 && ty + h <= maxRows && !isOccupied(tx, ty)) return { x: tx, y: ty };

      // Left Side
      tx = x - r;
      if (tx >= 0 && tx + w <= columns && ty >= 0 && ty + h <= maxRows && !isOccupied(tx, ty)) return { x: tx, y: ty };
    }

    // Check Y direction (Bottom and Top sides of the box)
    for (let dx = -r + 1; dx <= r - 1; dx++) { // Avoid corners already checked
      // Bottom Side
      let tx = x + dx;
      let ty = y + r;
      if (tx >= 0 && tx + w <= columns && ty >= 0 && ty + h <= maxRows && !isOccupied(tx, ty)) return { x: tx, y: ty };

      // Top Side
      ty = y - r;
      if (tx >= 0 && tx + w <= columns && ty >= 0 && ty + h <= maxRows && !isOccupied(tx, ty)) return { x: tx, y: ty };
    }
  }

  // Fallback: Just return offset (should catch above unless full)
  return { x: x + 2, y: y + 2 };
}
