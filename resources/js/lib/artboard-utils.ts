import type { ArtboardSchema, ArtboardDimensions, CanvasPosition } from '@/types/artboard';

/**
 * Check if a point is inside an artboard
 */
export function isPointInArtboard(
    point: CanvasPosition,
    artboard: ArtboardSchema
): boolean {
    const { x, y } = artboard.position;
    const { widthPx, heightPx } = artboard.dimensions;

    return (
        point.x >= x &&
        point.x <= x + widthPx &&
        point.y >= y &&
        point.y <= y + heightPx
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
 * Used for manual grid calculations (legacy or new absolute positioning logic)
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
 * This padding reduces the actual available space
 */
export const ARTBOARD_CONTAINER_PADDING = 16; // px (p-4 = 16px)

/**
 * Calculate effective grid configuration accounting for container padding
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

    // 2. Simple fallback: Just return offset
    return { x: x + 2, y: y + 2 };
}

/**
 * Export artboard to JSON file
 */
export function exportArtboardToJson(artboard: ArtboardSchema): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artboard, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${artboard.name || 'artboard'}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Export artboard to PDF
 * Requires html2canvas and jspdf
 */
export async function exportArtboardToPdf(artboard: ArtboardSchema): Promise<void> {
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
                }
            });

            const imgData = canvas.toDataURL('image/png');

            // Calculate PDF dimensions (px)
            const orientation = artboard.dimensions.widthPx > artboard.dimensions.heightPx ? 'l' : 'p';

            const pdf = new jsPDF({
                orientation,
                unit: 'px',
                format: [artboard.dimensions.widthPx, artboard.dimensions.heightPx]
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
