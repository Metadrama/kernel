/**
 * Collision Detection Utilities
 * 
 * Provides functions for detecting and resolving component overlaps
 * in a freeform layout system.
 */

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ComponentRect extends Rect {
    id: string;
}

/**
 * Check if two rectangles overlap (exclusive - touching edges don't count)
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
    return !(
        a.x + a.width <= b.x ||  // a is to the left of b
        b.x + b.width <= a.x ||  // b is to the left of a
        a.y + a.height <= b.y || // a is above b
        b.y + b.height <= a.y    // b is above a
    );
}

/**
 * Check if a rectangle is fully within container bounds
 */
export function isWithinBounds(rect: Rect, container: { width: number; height: number }): boolean {
    return (
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= container.width &&
        rect.y + rect.height <= container.height
    );
}

/**
 * Constrain a rectangle to fit within container bounds
 */
export function constrainToBounds(
    rect: Rect,
    container: { width: number; height: number }
): Rect {
    const width = Math.min(rect.width, container.width);
    const height = Math.min(rect.height, container.height);

    return {
        x: Math.max(0, Math.min(rect.x, container.width - width)),
        y: Math.max(0, Math.min(rect.y, container.height - height)),
        width,
        height,
    };
}

/**
 * Find the overlapping area between two rectangles
 * Returns null if they don't overlap
 */
export function getOverlapArea(a: Rect, b: Rect): number | null {
    if (!rectsOverlap(a, b)) return null;

    const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

    return overlapX * overlapY;
}

/**
 * Find which components a given rect overlaps with
 */
export function findOverlappingComponents(
    rect: Rect,
    components: ComponentRect[],
    excludeId?: string
): ComponentRect[] {
    return components.filter(comp =>
        comp.id !== excludeId && rectsOverlap(rect, comp)
    );
}

/**
 * Calculate the minimum translation needed to resolve an overlap
 * Returns the direction that requires the smallest movement
 */
export function getMinimumPushVector(
    moving: Rect,
    obstacle: Rect
): { x: number; y: number } {
    if (!rectsOverlap(moving, obstacle)) {
        return { x: 0, y: 0 };
    }

    // Calculate push distances for each direction
    const pushRight = obstacle.x + obstacle.width - moving.x;
    const pushLeft = -(moving.x + moving.width - obstacle.x);
    const pushDown = obstacle.y + obstacle.height - moving.y;
    const pushUp = -(moving.y + moving.height - obstacle.y);

    // Find the minimum absolute push
    const options = [
        { x: pushRight, y: 0 },
        { x: pushLeft, y: 0 },
        { x: 0, y: pushDown },
        { x: 0, y: pushUp },
    ];

    return options.reduce((min, curr) =>
        Math.abs(curr.x) + Math.abs(curr.y) < Math.abs(min.x) + Math.abs(min.y) ? curr : min
    );
}

/**
 * Find a non-overlapping position for a component
 * Uses a spiral search pattern from the original position
 */
export function findNonOverlappingPosition(
    rect: Rect,
    components: ComponentRect[],
    container: { width: number; height: number },
    excludeId?: string
): { x: number; y: number } {
    const others = components.filter(c => c.id !== excludeId);

    // If no overlap, return original position (constrained to bounds)
    const constrained = constrainToBounds(rect, container);
    const testRect = { ...rect, x: constrained.x, y: constrained.y };

    if (!others.some(other => rectsOverlap(testRect, other))) {
        return { x: constrained.x, y: constrained.y };
    }

    // Spiral search for non-overlapping position
    const step = 8; // Search step in pixels
    const maxRadius = Math.max(container.width, container.height);

    for (let radius = step; radius < maxRadius; radius += step) {
        // Try positions in a square pattern around original
        for (let dx = -radius; dx <= radius; dx += step) {
            for (let dy = -radius; dy <= radius; dy += step) {
                // Only check perimeter of the square
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                const testX = rect.x + dx;
                const testY = rect.y + dy;
                const candidate = { ...rect, x: testX, y: testY };

                // Check bounds
                if (!isWithinBounds(candidate, container)) continue;

                // Check overlaps
                if (!others.some(other => rectsOverlap(candidate, other))) {
                    return { x: testX, y: testY };
                }
            }
        }
    }

    // Fallback: stack at bottom
    const maxY = others.length > 0
        ? Math.max(...others.map(c => c.y + c.height)) + 8
        : 0;

    return {
        x: Math.max(0, Math.min(rect.x, container.width - rect.width)),
        y: Math.min(maxY, container.height - rect.height),
    };
}

/**
 * Find initial position for a new component (auto-layout)
 * Places component in first available space using top-left packing
 */
export function findInitialPosition(
    size: { width: number; height: number },
    components: ComponentRect[],
    container: { width: number; height: number }
): { x: number; y: number } {
    const padding = 8; // Gap between components

    // Try positions in a grid pattern
    for (let y = padding; y < container.height - size.height; y += padding) {
        for (let x = padding; x < container.width - size.width; x += padding) {
            const candidate: Rect = { x, y, ...size };

            if (!components.some(comp => rectsOverlap(candidate, comp))) {
                return { x, y };
            }
        }
    }

    // Fallback: place at bottom of existing content
    const maxY = components.length > 0
        ? Math.max(...components.map(c => c.y + c.height)) + padding
        : padding;

    return {
        x: padding,
        y: Math.min(maxY, Math.max(0, container.height - size.height)),
    };
}

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a rectangle's position to grid
 */
export function snapRectToGrid(rect: Rect, gridSize: number): Rect {
    return {
        x: snapToGrid(rect.x, gridSize),
        y: snapToGrid(rect.y, gridSize),
        width: rect.width,
        height: rect.height,
    };
}
