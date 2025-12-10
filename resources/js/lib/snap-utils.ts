/**
 * snap-utils.ts - Smart snapping utilities for Figma-like alignment
 * 
 * Provides edge and center snapping with visual guide generation.
 */

import type { ComponentRect } from './collision-detection';

/** Represents a snap guide line */
export interface SnapLine {
    /** Axis of the guide */
    axis: 'x' | 'y';
    /** Position in pixels */
    position: number;
    /** Type of alignment */
    type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'containerLeft' | 'containerRight' | 'containerTop' | 'containerBottom';
}

/** Result of snap calculation */
export interface SnapResult {
    /** Adjusted position after snapping */
    x: number;
    y: number;
    /** Active guides that should be displayed */
    activeGuides: SnapLine[];
}

/** Default snap threshold in pixels */
export const DEFAULT_SNAP_THRESHOLD = 8;

/**
 * Get all potential snap lines from sibling components
 */
export function getSnapLinesFromComponents(siblings: ComponentRect[]): SnapLine[] {
    const lines: SnapLine[] = [];

    for (const sibling of siblings) {
        // Vertical lines (x-axis positions)
        lines.push({ axis: 'x', position: sibling.x, type: 'left' });
        lines.push({ axis: 'x', position: sibling.x + sibling.width, type: 'right' });
        lines.push({ axis: 'x', position: sibling.x + sibling.width / 2, type: 'centerX' });

        // Horizontal lines (y-axis positions)
        lines.push({ axis: 'y', position: sibling.y, type: 'top' });
        lines.push({ axis: 'y', position: sibling.y + sibling.height, type: 'bottom' });
        lines.push({ axis: 'y', position: sibling.y + sibling.height / 2, type: 'centerY' });
    }

    return lines;
}

/**
 * Get snap lines from container boundaries
 */
export function getContainerSnapLines(containerSize: { width: number; height: number }): SnapLine[] {
    return [
        { axis: 'x', position: 0, type: 'containerLeft' },
        { axis: 'x', position: containerSize.width, type: 'containerRight' },
        { axis: 'x', position: containerSize.width / 2, type: 'centerX' },
        { axis: 'y', position: 0, type: 'containerTop' },
        { axis: 'y', position: containerSize.height, type: 'containerBottom' },
        { axis: 'y', position: containerSize.height / 2, type: 'centerY' },
    ];
}

/**
 * Calculate snap for a rectangle being dragged
 */
export function snapToGuides(
    rect: { x: number; y: number; width: number; height: number },
    snapLines: SnapLine[],
    threshold: number = DEFAULT_SNAP_THRESHOLD
): SnapResult {
    let snappedX = rect.x;
    let snappedY = rect.y;
    const activeGuides: SnapLine[] = [];

    // Points to check for X snapping (left edge, right edge, center)
    const xPoints = [
        { offset: 0, edge: 'left' },           // Left edge
        { offset: rect.width, edge: 'right' }, // Right edge
        { offset: rect.width / 2, edge: 'centerX' }, // Center
    ];

    // Points to check for Y snapping (top edge, bottom edge, center)
    const yPoints = [
        { offset: 0, edge: 'top' },            // Top edge
        { offset: rect.height, edge: 'bottom' }, // Bottom edge
        { offset: rect.height / 2, edge: 'centerY' }, // Center
    ];

    // Check X snap lines
    let closestXSnap: { distance: number; snapTo: number; guide: SnapLine } | null = null;

    for (const line of snapLines.filter(l => l.axis === 'x')) {
        for (const point of xPoints) {
            const currentPos = rect.x + point.offset;
            const distance = Math.abs(currentPos - line.position);

            if (distance <= threshold) {
                if (!closestXSnap || distance < closestXSnap.distance) {
                    closestXSnap = {
                        distance,
                        snapTo: line.position - point.offset,
                        guide: line,
                    };
                }
            }
        }
    }

    if (closestXSnap) {
        snappedX = closestXSnap.snapTo;
        activeGuides.push(closestXSnap.guide);
    }

    // Check Y snap lines
    let closestYSnap: { distance: number; snapTo: number; guide: SnapLine } | null = null;

    for (const line of snapLines.filter(l => l.axis === 'y')) {
        for (const point of yPoints) {
            const currentPos = rect.y + point.offset;
            const distance = Math.abs(currentPos - line.position);

            if (distance <= threshold) {
                if (!closestYSnap || distance < closestYSnap.distance) {
                    closestYSnap = {
                        distance,
                        snapTo: line.position - point.offset,
                        guide: line,
                    };
                }
            }
        }
    }

    if (closestYSnap) {
        snappedY = closestYSnap.snapTo;
        activeGuides.push(closestYSnap.guide);
    }

    return {
        x: snappedX,
        y: snappedY,
        activeGuides,
    };
}

/**
 * Get all snap lines for a component drag/resize operation
 */
export function getAllSnapLines(
    siblings: ComponentRect[],
    containerSize: { width: number; height: number }
): SnapLine[] {
    return [
        ...getSnapLinesFromComponents(siblings),
        ...getContainerSnapLines(containerSize),
    ];
}

/** Distribution guide for equal spacing */
export interface DistributionGuide {
    axis: 'x' | 'y';
    positions: number[]; // Multiple positions to draw lines at
    spacing: number;     // The equal spacing value
}

/**
 * Find distribution opportunities (equal spacing between items)
 * Returns guides when the dragged item would create equal spacing with neighbors
 */
export function getDistributionGuides(
    draggedRect: { x: number; y: number; width: number; height: number },
    siblings: ComponentRect[],
    threshold: number = DEFAULT_SNAP_THRESHOLD
): { guides: DistributionGuide[]; snappedPosition: { x: number; y: number } } {
    const guides: DistributionGuide[] = [];
    let snappedX = draggedRect.x;
    let snappedY = draggedRect.y;

    // Sort siblings by position for each axis
    const sortedByX = [...siblings].sort((a, b) => a.x - b.x);
    const sortedByY = [...siblings].sort((a, b) => a.y - b.y);

    // Check horizontal distribution (items arranged left to right)
    for (let i = 0; i < sortedByX.length - 1; i++) {
        const left = sortedByX[i];
        const right = sortedByX[i + 1];

        // Gap between left item's right edge and right item's left edge
        const existingGap = right.x - (left.x + left.width);
        if (existingGap <= 0) continue; // Overlapping or touching

        // Could dragged item fit between them with equal spacing?
        const draggedRight = draggedRect.x + draggedRect.width;

        // Check if dragged item is roughly between these two
        const leftEdge = left.x + left.width;
        const rightEdge = right.x;

        if (draggedRect.x > leftEdge - 50 && draggedRight < rightEdge + 50) {
            // Calculate what position would give equal spacing
            const totalSpace = rightEdge - leftEdge;
            const equalGap = (totalSpace - draggedRect.width) / 2;

            if (equalGap > 0) {
                const idealX = leftEdge + equalGap;
                if (Math.abs(draggedRect.x - idealX) <= threshold) {
                    snappedX = idealX;
                    guides.push({
                        axis: 'x',
                        positions: [leftEdge, draggedRect.x, draggedRight, rightEdge],
                        spacing: equalGap,
                    });
                }
            }
        }
    }

    // Similar logic for vertical distribution
    for (let i = 0; i < sortedByY.length - 1; i++) {
        const top = sortedByY[i];
        const bottom = sortedByY[i + 1];

        const existingGap = bottom.y - (top.y + top.height);
        if (existingGap <= 0) continue;

        const draggedBottom = draggedRect.y + draggedRect.height;
        const topEdge = top.y + top.height;
        const bottomEdge = bottom.y;

        if (draggedRect.y > topEdge - 50 && draggedBottom < bottomEdge + 50) {
            const totalSpace = bottomEdge - topEdge;
            const equalGap = (totalSpace - draggedRect.height) / 2;

            if (equalGap > 0) {
                const idealY = topEdge + equalGap;
                if (Math.abs(draggedRect.y - idealY) <= threshold) {
                    snappedY = idealY;
                    guides.push({
                        axis: 'y',
                        positions: [topEdge, draggedRect.y, draggedBottom, bottomEdge],
                        spacing: equalGap,
                    });
                }
            }
        }
    }

    return { guides, snappedPosition: { x: snappedX, y: snappedY } };
}

/**
 * Snap position to a grid
 */
export function snapToGrid(
    position: { x: number; y: number },
    gridSize: number = 10
): { x: number; y: number } {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
    };
}

/**
 * Snap bounds to a grid (both position and size)
 */
export function snapBoundsToGrid(
    bounds: { x: number; y: number; width: number; height: number },
    gridSize: number = 10
): { x: number; y: number; width: number; height: number } {
    return {
        x: Math.round(bounds.x / gridSize) * gridSize,
        y: Math.round(bounds.y / gridSize) * gridSize,
        width: Math.round(bounds.width / gridSize) * gridSize,
        height: Math.round(bounds.height / gridSize) * gridSize,
    };
}
