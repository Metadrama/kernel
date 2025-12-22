/**
 * Alignment Helper Utilities
 * 
 * Figma-style smart alignment guides for component positioning.
 * Detects alignment with nearby components and shows visual guides.
 */

export interface AlignmentGuide {
    type: 'vertical' | 'horizontal';
    position: number;
    components: string[]; // IDs of aligned components
}

const SNAP_THRESHOLD = 5; // pixels

/**
 * Component bounds for alignment calculations
 */
export interface ComponentBounds {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Alignment edges for a component
 */
interface AlignmentEdges {
    left: number;
    right: number;
    centerX: number;
    top: number;
    bottom: number;
    centerY: number;
}

/**
 * Get all alignment edges for a component
 */
function getEdges(bounds: ComponentBounds): AlignmentEdges {
    return {
        left: bounds.x,
        right: bounds.x + bounds.width,
        centerX: bounds.x + bounds.width / 2,
        top: bounds.y,
        bottom: bounds.y + bounds.height,
        centerY: bounds.y + bounds.height / 2,
    };
}

/**
 * Check if two values are close enough to snap
 */
function isNearby(a: number, b: number, threshold: number = SNAP_THRESHOLD): boolean {
    return Math.abs(a - b) <= threshold;
}

/**
 * Find alignment guides for a component being moved
 * 
 * @param movingComponent - The component being moved
 * @param otherComponents - Other components to align with
 * @param threshold - Snap distance threshold
 * @returns Array of alignment guides to display
 */
export function findAlignmentGuides(
    movingComponent: ComponentBounds,
    otherComponents: ComponentBounds[],
    threshold: number = SNAP_THRESHOLD
): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];
    const movingEdges = getEdges(movingComponent);

    for (const other of otherComponents) {
        if (other.id === movingComponent.id) continue;

        const otherEdges = getEdges(other);

        // Vertical guides (left, center, right alignment)
        if (isNearby(movingEdges.left, otherEdges.left, threshold)) {
            guides.push({
                type: 'vertical',
                position: otherEdges.left,
                components: [movingComponent.id, other.id],
            });
        }
        if (isNearby(movingEdges.right, otherEdges.right, threshold)) {
            guides.push({
                type: 'vertical',
                position: otherEdges.right,
                components: [movingComponent.id, other.id],
            });
        }
        if (isNearby(movingEdges.centerX, otherEdges.centerX, threshold)) {
            guides.push({
                type: 'vertical',
                position: otherEdges.centerX,
                components: [movingComponent.id, other.id],
            });
        }

        // Horizontal guides (top, center, bottom alignment)
        if (isNearby(movingEdges.top, otherEdges.top, threshold)) {
            guides.push({
                type: 'horizontal',
                position: otherEdges.top,
                components: [movingComponent.id, other.id],
            });
        }
        if (isNearby(movingEdges.bottom, otherEdges.bottom, threshold)) {
            guides.push({
                type: 'horizontal',
                position: otherEdges.bottom,
                components: [movingComponent.id, other.id],
            });
        }
        if (isNearby(movingEdges.centerY, otherEdges.centerY, threshold)) {
            guides.push({
                type: 'horizontal',
                position: otherEdges.centerY,
                components: [movingComponent.id, other.id],
            });
        }
    }

    // Deduplicate guides at same position
    const uniqueGuides = guides.reduce((acc, guide) => {
        const existing = acc.find(
            (g) => g.type === guide.type && Math.abs(g.position - guide.position) < 1
        );
        if (!existing) {
            acc.push(guide);
        } else {
            // Merge component IDs
            existing.components = [...new Set([...existing.components, ...guide.components])];
        }
        return acc;
    }, [] as AlignmentGuide[]);

    return uniqueGuides;
}

/**
 * Snap a component position to nearby alignment guides
 * 
 * @param position - Current position to snap
 * @param movingComponent - Component bounds being moved
 * @param guides - Active alignment guides
 * @returns Snapped position
 */
export function snapToGuides(
    position: { x: number; y: number },
    movingComponent: ComponentBounds,
    guides: AlignmentGuide[]
): { x: number; y: number } {
    let snappedX = position.x;
    let snappedY = position.y;

    const movingEdges = getEdges({ ...movingComponent, x: position.x, y: position.y });

    for (const guide of guides) {
        if (guide.type === 'vertical') {
            // Snap to vertical guide (adjust X)
            const leftDiff = Math.abs(movingEdges.left - guide.position);
            const centerDiff = Math.abs(movingEdges.centerX - guide.position);
            const rightDiff = Math.abs(movingEdges.right - guide.position);

            if (leftDiff <= SNAP_THRESHOLD) {
                snappedX = guide.position;
            } else if (centerDiff <= SNAP_THRESHOLD) {
                snappedX = guide.position - movingComponent.width / 2;
            } else if (rightDiff <= SNAP_THRESHOLD) {
                snappedX = guide.position - movingComponent.width;
            }
        } else {
            // Snap to horizontal guide (adjust Y)
            const topDiff = Math.abs(movingEdges.top - guide.position);
            const centerDiff = Math.abs(movingEdges.centerY - guide.position);
            const bottomDiff = Math.abs(movingEdges.bottom - guide.position);

            if (topDiff <= SNAP_THRESHOLD) {
                snappedY = guide.position;
            } else if (centerDiff <= SNAP_THRESHOLD) {
                snappedY = guide.position - movingComponent.height / 2;
            } else if (bottomDiff <= SNAP_THRESHOLD) {
                snappedY = guide.position - movingComponent.height;
            }
        }
    }

    return { x: snappedX, y: snappedY };
}

/**
 * Get the visible bounds for displaying a guide line
 * Extends the line to cover all aligned components
 */
export function getGuideBounds(
    guide: AlignmentGuide,
    components: ComponentBounds[]
): { start: number; end: number } {
    const alignedComponents = components.filter((c) => guide.components.includes(c.id));

    if (guide.type === 'vertical') {
        const minY = Math.min(...alignedComponents.map((c) => c.y));
        const maxY = Math.max(...alignedComponents.map((c) => c.y + c.height));
        return { start: minY, end: maxY };
    } else {
        const minX = Math.min(...alignedComponents.map((c) => c.x));
        const maxX = Math.max(...alignedComponents.map((c) => c.x + c.width));
        return { start: minX, end: maxX };
    }
}
