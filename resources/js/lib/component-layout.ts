/**
 * Component Layout System
 * 
 * Provides structured grid-based layout for components within widgets.
 * Unlike free-form positioning, this system:
 * - Uses a defined grid (e.g., 12 columns)
 * - Components have intrinsic sizes based on their type
 * - Auto-flows components to fill available space
 * - Maintains aspect ratios for visual components
 */

// ============================================================================
// Grid Resolution Constants (merged from grid-resolution.ts)
// ============================================================================

export const GRID_FINE_GRAIN = 2;
export const GRID_BASE_COLUMNS = 12;
export const GRID_MAX_COLUMNS = GRID_BASE_COLUMNS * GRID_FINE_GRAIN;

export function upscaleGridUnits(value: number): number {
  return Math.round(value * GRID_FINE_GRAIN);
}

export function downscaleGridUnits(value: number): number {
  return Math.max(0, Math.round(value / GRID_FINE_GRAIN));
}

// ============================================================================
// Component Sizing Types
// ============================================================================

/**
 * Component sizing modes
 */
export type ComponentSizeMode =
  | 'intrinsic'      // Size based on content (e.g., heading wraps text)
  | 'fixed-ratio'    // Maintains aspect ratio (e.g., charts)
  | 'fill'           // Fills available width, intrinsic height
  | 'full';          // Fills entire container

/**
 * Component intrinsic size definition
 */
export interface ComponentIntrinsicSize {
  /** Minimum width in grid columns (out of 12) */
  minCols: number;
  /** Maximum width in grid columns (out of 12) */
  maxCols: number;
  /** Default width in grid columns (out of 12) */
  defaultCols: number;
  /** Minimum height in grid rows */
  minRows: number;
  /** Maximum height in grid rows */
  maxRows: number;
  /** Default height in grid rows */
  defaultRows: number;
  /** Aspect ratio (width/height) - null if flexible */
  aspectRatio: number | null;
  /** Sizing mode */
  sizeMode: ComponentSizeMode;
}

/**
 * Grid position for a component
 */
export interface GridPosition {
  col: number;    // Starting column (0-based)
  row: number;    // Starting row (0-based)
  colSpan: number; // Number of columns to span
  rowSpan: number; // Number of rows to span
}

/**
 * Component layout configuration stored in component config
 */
export interface ComponentLayout {
  gridPosition: GridPosition;
  locked?: boolean;  // If true, cannot be moved by auto-layout
}

/**
 * Grid configuration for a widget
 */
export interface WidgetGridConfig {
  columns: number;     // Number of columns (default: 12)
  rowHeight: number;   // Height of each row in pixels (default: 40)
  gap: number;         // Gap between components in pixels (default: 8)
}

export const DEFAULT_WIDGET_GRID: WidgetGridConfig = {
  columns: 12,
  rowHeight: 40,
  gap: 8,
};

/**
 * Intrinsic sizes for each component type
 * These define how components naturally want to be sized
 */
export const COMPONENT_INTRINSIC_SIZES: Record<string, ComponentIntrinsicSize> = {
  // Charts maintain aspect ratios for proper visualization
  'chart-line': {
    minCols: 4,
    maxCols: 12,
    defaultCols: 6,
    minRows: 3,
    maxRows: 8,
    defaultRows: 4,
    aspectRatio: 16 / 9,  // Wide format for line charts
    sizeMode: 'fixed-ratio',
  },
  'chart-bar': {
    minCols: 4,
    maxCols: 12,
    defaultCols: 6,
    minRows: 3,
    maxRows: 8,
    defaultRows: 4,
    aspectRatio: 16 / 9,  // Wide format for bar charts
    sizeMode: 'fixed-ratio',
  },
  'chart-doughnut': {
    minCols: 3,
    maxCols: 6,
    defaultCols: 4,
    minRows: 3,
    maxRows: 6,
    defaultRows: 4,
    aspectRatio: 1,  // Square for doughnut charts
    sizeMode: 'fixed-ratio',
  },
  'chart': {
    minCols: 4,
    maxCols: 12,
    defaultCols: 6,
    minRows: 3,
    maxRows: 8,
    defaultRows: 4,
    aspectRatio: 16 / 9,
    sizeMode: 'fixed-ratio',
  },

  // Text components wrap their content
  'heading': {
    minCols: 2,
    maxCols: 12,
    defaultCols: 12,  // Full width by default
    minRows: 1,
    maxRows: 2,
    defaultRows: 1,
    aspectRatio: null,  // Flexible - wraps text
    sizeMode: 'fill',
  },

  // KPI metrics - compact but readable
  'kpi': {
    minCols: 2,
    maxCols: 6,
    defaultCols: 3,
    minRows: 2,
    maxRows: 4,
    defaultRows: 3,
    aspectRatio: null,  // Flexible - adjusts to content
    sizeMode: 'intrinsic',
  },

  // Fallback for unknown components
  'default': {
    minCols: 3,
    maxCols: 12,
    defaultCols: 6,
    minRows: 2,
    maxRows: 6,
    defaultRows: 3,
    aspectRatio: null,
    sizeMode: 'intrinsic',
  },
};

/**
 * Get intrinsic size for a component type
 */
export function getComponentIntrinsicSize(componentType: string): ComponentIntrinsicSize {
  return COMPONENT_INTRINSIC_SIZES[componentType] || COMPONENT_INTRINSIC_SIZES['default'];
}

/**
 * Calculate actual pixel dimensions for a component
 */
export function calculateComponentDimensions(
  intrinsicSize: ComponentIntrinsicSize,
  containerWidth: number,
  gridConfig: WidgetGridConfig = DEFAULT_WIDGET_GRID
): { width: number; height: number; colSpan: number; rowSpan: number } {
  const colWidth = (containerWidth - (gridConfig.gap * (gridConfig.columns - 1))) / gridConfig.columns;
  const colSpan = intrinsicSize.defaultCols;
  const width = colSpan * colWidth + (colSpan - 1) * gridConfig.gap;

  let rowSpan = intrinsicSize.defaultRows;
  let height = rowSpan * gridConfig.rowHeight + (rowSpan - 1) * gridConfig.gap;

  // Adjust for aspect ratio if specified
  if (intrinsicSize.aspectRatio && intrinsicSize.sizeMode === 'fixed-ratio') {
    const targetHeight = width / intrinsicSize.aspectRatio;
    rowSpan = Math.max(
      intrinsicSize.minRows,
      Math.min(
        intrinsicSize.maxRows,
        Math.ceil(targetHeight / gridConfig.rowHeight)
      )
    );
    height = rowSpan * gridConfig.rowHeight + (rowSpan - 1) * gridConfig.gap;
  }

  return { width, height, colSpan, rowSpan };
}

/**
 * Grid cell occupancy map for layout calculations
 */
type OccupancyMap = boolean[][];

/**
 * Create an empty occupancy map
 */
function createOccupancyMap(columns: number, rows: number): OccupancyMap {
  return Array(rows).fill(null).map(() => Array(columns).fill(false));
}

/**
 * Mark cells as occupied
 */
function markOccupied(
  map: OccupancyMap,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number
): void {
  for (let r = row; r < row + rowSpan && r < map.length; r++) {
    for (let c = col; c < col + colSpan && c < map[0].length; c++) {
      map[r][c] = true;
    }
  }
}

/**
 * Check if a position is available
 */
function isPositionAvailable(
  map: OccupancyMap,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number
): boolean {
  // Extend map if needed
  while (map.length < row + rowSpan) {
    map.push(Array(map[0]?.length || 12).fill(false));
  }

  if (col + colSpan > (map[0]?.length || 12)) return false;

  for (let r = row; r < row + rowSpan; r++) {
    for (let c = col; c < col + colSpan; c++) {
      if (map[r]?.[c]) return false;
    }
  }
  return true;
}

/**
 * Find the next available position for a component
 * Uses a top-left packing algorithm
 */
export function findNextAvailablePosition(
  occupancyMap: OccupancyMap,
  colSpan: number,
  rowSpan: number,
  gridColumns: number
): GridPosition {
  let row = 0;

  while (true) {
    // Extend map if we've gone past it
    while (occupancyMap.length <= row + rowSpan) {
      occupancyMap.push(Array(gridColumns).fill(false));
    }

    for (let col = 0; col <= gridColumns - colSpan; col++) {
      if (isPositionAvailable(occupancyMap, col, row, colSpan, rowSpan)) {
        return { col, row, colSpan, rowSpan };
      }
    }
    row++;

    // Safety limit
    if (row > 100) {
      return { col: 0, row: row, colSpan, rowSpan };
    }
  }
}

/**
 * Layout result for a component
 */
export interface LayoutResult {
  instanceId: string;
  componentType: string;
  gridPosition: GridPosition;
  pixelBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Component input for layout calculation
 */
export interface ComponentInput {
  instanceId: string;
  componentType: string;
  config?: {
    layout?: ComponentLayout;
    [key: string]: unknown;
  };
}

/**
 * Calculate layout for all components in a widget
 * Returns positioned layout for each component
 */
export function calculateWidgetLayout(
  components: ComponentInput[],
  containerWidth: number,
  gridConfig: WidgetGridConfig = DEFAULT_WIDGET_GRID
): LayoutResult[] {
  if (components.length === 0) return [];

  const results: LayoutResult[] = [];
  const occupancyMap = createOccupancyMap(gridConfig.columns, 10);
  const colWidth = (containerWidth - (gridConfig.gap * (gridConfig.columns - 1))) / gridConfig.columns;

  // First pass: place components with locked positions
  const lockedComponents = components.filter(c => c.config?.layout?.locked);
  const unlockedComponents = components.filter(c => !c.config?.layout?.locked);

  for (const component of lockedComponents) {
    const layout = component.config?.layout;
    if (layout?.gridPosition) {
      const pos = layout.gridPosition;
      markOccupied(occupancyMap, pos.col, pos.row, pos.colSpan, pos.rowSpan);

      results.push({
        instanceId: component.instanceId,
        componentType: component.componentType,
        gridPosition: pos,
        pixelBounds: gridPositionToPixels(pos, colWidth, gridConfig),
      });
    }
  }

  // Second pass: auto-layout unlocked components
  for (const component of unlockedComponents) {
    const intrinsicSize = getComponentIntrinsicSize(component.componentType);

    // Use existing layout if available, otherwise use intrinsic defaults
    let colSpan = intrinsicSize.defaultCols;
    let rowSpan = intrinsicSize.defaultRows;

    if (component.config?.layout?.gridPosition) {
      colSpan = component.config.layout.gridPosition.colSpan;
      rowSpan = component.config.layout.gridPosition.rowSpan;
    } else if (intrinsicSize.aspectRatio && intrinsicSize.sizeMode === 'fixed-ratio') {
      // Calculate row span based on aspect ratio
      const componentWidth = colSpan * colWidth + (colSpan - 1) * gridConfig.gap;
      const targetHeight = componentWidth / intrinsicSize.aspectRatio;
      rowSpan = Math.max(
        intrinsicSize.minRows,
        Math.min(
          intrinsicSize.maxRows,
          Math.round(targetHeight / gridConfig.rowHeight)
        )
      );
    }

    // Find position
    const position = findNextAvailablePosition(occupancyMap, colSpan, rowSpan, gridConfig.columns);
    markOccupied(occupancyMap, position.col, position.row, position.colSpan, position.rowSpan);

    results.push({
      instanceId: component.instanceId,
      componentType: component.componentType,
      gridPosition: position,
      pixelBounds: gridPositionToPixels(position, colWidth, gridConfig),
    });
  }

  return results;
}

/**
 * Convert grid position to pixel coordinates
 */
export function gridPositionToPixels(
  position: GridPosition,
  colWidth: number,
  gridConfig: WidgetGridConfig = DEFAULT_WIDGET_GRID
): { x: number; y: number; width: number; height: number } {
  return {
    x: position.col * (colWidth + gridConfig.gap),
    y: position.row * (gridConfig.rowHeight + gridConfig.gap),
    width: position.colSpan * colWidth + (position.colSpan - 1) * gridConfig.gap,
    height: position.rowSpan * gridConfig.rowHeight + (position.rowSpan - 1) * gridConfig.gap,
  };
}

/**
 * Calculate total height needed for the widget content
 */
export function calculateTotalHeight(
  layouts: LayoutResult[],
  gridConfig: WidgetGridConfig = DEFAULT_WIDGET_GRID
): number {
  if (layouts.length === 0) return 0;

  const maxRow = Math.max(...layouts.map(l => l.gridPosition.row + l.gridPosition.rowSpan));
  return maxRow * (gridConfig.rowHeight + gridConfig.gap) - gridConfig.gap;
}

/**
 * Resize a component while maintaining constraints
 */
export function resizeComponent(
  componentType: string,
  currentPosition: GridPosition,
  deltaColSpan: number,
  deltaRowSpan: number,
  gridConfig: WidgetGridConfig = DEFAULT_WIDGET_GRID
): GridPosition {
  const intrinsic = getComponentIntrinsicSize(componentType);

  let newColSpan = Math.max(
    intrinsic.minCols,
    Math.min(intrinsic.maxCols, currentPosition.colSpan + deltaColSpan)
  );

  let newRowSpan = Math.max(
    intrinsic.minRows,
    Math.min(intrinsic.maxRows, currentPosition.rowSpan + deltaRowSpan)
  );

  // Enforce aspect ratio if required
  if (intrinsic.aspectRatio && intrinsic.sizeMode === 'fixed-ratio') {
    // If width changed, adjust height
    if (deltaColSpan !== 0) {
      const colWidth = 100 / gridConfig.columns; // Approximate
      const targetHeight = (newColSpan * colWidth) / intrinsic.aspectRatio;
      newRowSpan = Math.round(targetHeight / (100 / gridConfig.columns));
      newRowSpan = Math.max(intrinsic.minRows, Math.min(intrinsic.maxRows, newRowSpan));
    }
    // If height changed, adjust width
    else if (deltaRowSpan !== 0) {
      const rowHeight = 100 / 10; // Approximate
      const targetWidth = (newRowSpan * rowHeight) * intrinsic.aspectRatio;
      newColSpan = Math.round(targetWidth / (100 / gridConfig.columns));
      newColSpan = Math.max(intrinsic.minCols, Math.min(intrinsic.maxCols, newColSpan));
    }
  }

  // Ensure doesn't exceed grid
  newColSpan = Math.min(newColSpan, gridConfig.columns - currentPosition.col);

  return {
    ...currentPosition,
    colSpan: newColSpan,
    rowSpan: newRowSpan,
  };
}
