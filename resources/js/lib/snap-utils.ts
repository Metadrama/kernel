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
