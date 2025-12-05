/**
 * Library Barrel Export
 * Re-exports all utility functions and constants
 */

// Utilities
export { cn } from './utils';

// Artboard utilities
export {
    generateArtboardId,
    getDefaultArtboardName,
    calculateDefaultPosition,
    createArtboard,
    getArtboardBounds,
    isPointInArtboard,
    doArtboardsOverlap,
    findArtboardAtPosition,
    validateArtboardPosition,
    calculateArtboardGridConfig,
    scaleDimensions,
    canvasToArtboardCoords,
    artboardToCanvasCoords,
} from './artboard-utils';
export type { ArtboardBounds } from './artboard-utils';

// Collision utilities
export {
    hasCollision,
    snapToGrid,
    snapBoundsToGrid,
    wouldCollide,
    clampToContainer,
    findNearestValidPosition,
    calculateValidResizeBounds,
    findValidDropPosition,
    DEFAULT_SNAP_GRID_SIZE,
    MIN_COMPONENT_WIDTH,
    MIN_COMPONENT_HEIGHT,
} from './collision-utils';
export type { Bounds, ComponentWithBounds } from './collision-utils';

// Component layout
export {
    getComponentIntrinsicSize,
    calculateComponentDimensions,
    findNextAvailablePosition,
    calculateWidgetLayout,
    gridPositionToPixels,
    calculateTotalHeight,
    resizeComponent,
    DEFAULT_WIDGET_GRID,
    COMPONENT_INTRINSIC_SIZES,
    GRID_FINE_GRAIN,
    GRID_BASE_COLUMNS,
    GRID_MAX_COLUMNS,
    upscaleGridUnits,
    downscaleGridUnits,
} from './component-layout';
export type {
    ComponentSizeMode,
    ComponentIntrinsicSize,
    GridPosition,
    ComponentLayout,
    WidgetGridConfig,
    LayoutResult,
    ComponentInput,
} from './component-layout';

// Google Sheets hook
export { useGoogleSheetsData, MOCK_CHART_DATA } from './use-google-sheets';
