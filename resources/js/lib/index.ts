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
    calculateEffectiveGridConfig,
    ARTBOARD_CONTAINER_PADDING,
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



// Google Sheets hook
export { useGoogleSheetsData, MOCK_CHART_DATA } from './use-google-sheets';
