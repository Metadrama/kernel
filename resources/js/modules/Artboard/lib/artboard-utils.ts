/**
 * Artboard Utility Functions
 *
 * Helper functions for artboard operations:
 * - Creation with defaults
 * - Dimension calculations
 * - Position utilities
 * - Validation
 */

import { getArtboardPreset } from '@/modules/DesignSystem/constants/artboard-presets';
import type { Artboard, ArtboardDimensions, ArtboardFormat, CanvasPosition, CreateArtboardOptions } from '@/modules/Artboard/types/artboard';

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
export function calculateDefaultPosition(existingArtboards: Artboard[], dimensions: ArtboardDimensions): CanvasPosition {
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
export function createArtboard(options: CreateArtboardOptions, existingArtboards: Artboard[] = []): Artboard {
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
        components: [],
        locked: false,
        visible: true,
        showGrid: true,
        showRulers: false,
        clipContent: true,
        gridPadding: 16, // container padding in pixels
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

export function getArtboardBounds(artboard: Artboard): ArtboardBounds {
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
export function isPointInArtboard(point: CanvasPosition, artboard: Artboard): boolean {
    const bounds = getArtboardBounds(artboard);

    return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
}

/**
 * Check if two artboards overlap
 */
export function doArtboardsOverlap(artboard1: Artboard, artboard2: Artboard): boolean {
    const bounds1 = getArtboardBounds(artboard1);
    const bounds2 = getArtboardBounds(artboard2);

    return !(bounds1.right < bounds2.left || bounds1.left > bounds2.right || bounds1.bottom < bounds2.top || bounds1.top > bounds2.bottom);
}

/**
 * Find artboard at canvas position
 * Returns topmost artboard if multiple overlap
 */
export function findArtboardAtPosition(position: CanvasPosition, artboards: Artboard[]): Artboard | null {
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
export function validateArtboardPosition(position: CanvasPosition, canvasSize: { width: number; height: number }): CanvasPosition {
    const maxOffset = 10000; // Maximum pixels off-canvas

    return {
        x: Math.max(-maxOffset, Math.min(position.x, canvasSize.width + maxOffset)),
        y: Math.max(-maxOffset, Math.min(position.y, canvasSize.height + maxOffset)),
    };
}

/**
 * Convert canvas coordinates to artboard-relative coordinates
 */
export function canvasToArtboardCoords(point: CanvasPosition, artboard: Artboard): CanvasPosition {
    return {
        x: point.x - artboard.position.x,
        y: point.y - artboard.position.y
    };
}

/**
 * Convert artboard-relative coordinates to canvas coordinates
 */
export function artboardToCanvasCoords(point: CanvasPosition, artboard: Artboard): CanvasPosition {
    return {
        x: point.x + artboard.position.x,
        y: point.y + artboard.position.y
    };
}

/**
 * Calculate grid configuration for an artboard
 */
export function calculateArtboardGridConfig(artboard: Artboard) {
    // This could be enhanced to support per-artboard grid settings
    return {
        gridSize: 20,
        gridColor: '#e0e0e0', // Placeholder
    };
}

/**
 * Calculate effective grid configuration
 */
export function calculateEffectiveGridConfig(artboard: Artboard) {
    return calculateArtboardGridConfig(artboard);
}

/**
 * Constants
 */
export const ARTBOARD_CONTAINER_PADDING = 32;

/**
 * Scale dimensions
 */
export function scaleDimensions(dimensions: ArtboardDimensions, scale: number): ArtboardDimensions {
    return {
        ...dimensions,
        widthPx: dimensions.widthPx * scale,
        heightPx: dimensions.heightPx * scale,
    };
}

/**
 * Export artboard to JSON file
 */
export function exportArtboardToJson(artboard: Artboard): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(artboard, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${artboard.name || 'artboard'}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Export artboard to PDF
 * Requires html2canvas and jspdf
 */
export async function exportArtboardToPdf(artboard: Artboard): Promise<void> {
    try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const element = document.querySelector(`[data-artboard-id="${artboard.id}"]`) as HTMLElement;
        if (!element) {
            console.error('Artboard element not found');
            alert('Could not find artboard element to export.');
            return;
        }

        // Show a loading indicator
        const originalCursor = document.body.style.cursor;
        document.body.style.cursor = 'wait';

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: artboard.backgroundColor || '#ffffff',
                ignoreElements: (element) => {
                    // Ignore elements that shouldn't be in the PDF if necessary
                    return false;
                },
            });

            const imgData = canvas.toDataURL('image/png');

            // Calculate PDF dimensions (px)
            const orientation = artboard.dimensions.widthPx > artboard.dimensions.heightPx ? 'l' : 'p';

            const pdf = new jsPDF({
                orientation,
                unit: 'px',
                format: [artboard.dimensions.widthPx, artboard.dimensions.heightPx],
            });

            pdf.addImage(imgData, 'PNG', 0, 0, artboard.dimensions.widthPx, artboard.dimensions.heightPx);
            pdf.save(`${artboard.name || 'artboard'}.pdf`);
        } finally {
            document.body.style.cursor = originalCursor;
        }
    } catch (error) {
        console.error('Failed to export PDF:', error);
        alert('Failed to export PDF. Please ensure html2canvas and jspdf are installed.');
    }
}

