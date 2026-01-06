/**
 * snap-resolver.ts
 *
 * A single, centralized snap resolver for canvas interactions.
 *
 * Goals:
 * - Provide one place to decide snapping behavior (reduces tech debt)
 * - Prioritize alignment snapping first, then grid snapping
 * - Allow Alt/Option to bypass all snapping
 * - Return enough metadata to render guides in an overlay
 *
 * Coordinate space:
 * - All inputs/outputs are in "canvas/world px" (i.e., the same coordinate system
 *   your artboard/component positions use, not screen pixels).
 */

import { findAlignmentGuides, snapToGuides, type AlignmentGuide, type ComponentBounds } from './alignment-helpers';
import { GRID_SIZE_PX, SNAP_THRESHOLD_PX, snapToGridWithinThreshold } from './canvas-constants';

export type SnapSource = 'none' | 'alignment' | 'grid';

export interface SnapModifiers {
    /**
     * When true, bypasses ALL snapping (grid + alignment).
     * Typically mapped to Alt/Option.
     */
    bypassAllSnapping?: boolean;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface SnapInput {
    /**
     * Raw candidate top-left position (unsnapped) for the moving rect.
     */
    rawPosition: { x: number; y: number };

    /**
     * Moving rect bounds (size must be the size of the moving component).
     * x/y should generally match rawPosition; however, only width/height are required
     * to compute edges/centers correctly. The resolver will treat x/y as rawPosition.
     */
    moving: { id: string; width: number; height: number };

    /**
     * Bounds for sibling components on the same artboard (can include the moving component;
     * it will be filtered by id).
     */
    siblings?: ComponentBounds[];

    /**
     * Optional override for snap threshold.
     */
    thresholdPx?: number;

    /**
     * Optional override for grid size.
     */
    gridSizePx?: number;

    /**
     * Modifier keys / interaction modifiers.
     */
    modifiers?: SnapModifiers;
}

export interface SnapOutput {
    position: { x: number; y: number };
    source: SnapSource;

    /**
     * Guides to render (alignment guides only).
     * Empty when snapping is bypassed or no guides are relevant.
     */
    guides: AlignmentGuide[];

    /**
     * Debug metadata to help tune behavior without guessing.
     */
    debug?: {
        raw: { x: number; y: number };
        alignmentCandidate?: { x: number; y: number; dx: number; dy: number };
        gridCandidate?: { x: number; y: number; dx: number; dy: number };
        chosen: { source: SnapSource; dx: number; dy: number };
    };
}

export interface ResizeSnapInput {
    /**
     * Raw candidate rect (unsnapped) in artboard/canvas space.
     */
    rawRect: { x: number; y: number; width: number; height: number };

    /**
     * The interaction start rect (used to preserve the opposite edge as an anchor).
     */
    startRect: { x: number; y: number; width: number; height: number };

    /**
     * Which handle is being dragged.
     */
    handle: ResizeHandle;

    /**
     * Bounds for sibling components on the same artboard (can include the moving component;
     * it will be filtered by id).
     */
    siblings?: ComponentBounds[];

    /**
     * Optional override for snap threshold.
     */
    thresholdPx?: number;

    /**
     * Optional override for grid size.
     */
    gridSizePx?: number;

    /**
     * Modifier keys / interaction modifiers.
     */
    modifiers?: SnapModifiers;
}

export interface ResizeSnapOutput {
    rect: { x: number; y: number; width: number; height: number };
    source: SnapSource;
    guides: AlignmentGuide[];
}

function delta(a: { x: number; y: number }, b: { x: number; y: number }): { dx: number; dy: number } {
    return { dx: b.x - a.x, dy: b.y - a.y };
}

function manhattanDistance(d: { dx: number; dy: number }): number {
    return Math.abs(d.dx) + Math.abs(d.dy);
}

function clampNonNegativeSize(rect: { x: number; y: number; width: number; height: number }) {
    return {
        x: rect.x,
        y: rect.y,
        width: Math.max(0, rect.width),
        height: Math.max(0, rect.height),
    };
}

function getResizeMovingBounds(id: string, rect: { x: number; y: number; width: number; height: number }): ComponentBounds {
    return { id, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

/**
 * Resolve snapping for a move/drag operation.
 *
 * Policy:
 * - If bypass enabled: return raw position (no guides).
 * - Compute alignment snap (if any). If alignment produces a change, prefer it.
 * - Otherwise, compute grid snap as a fallback (within threshold).
 * - If both produce a change, choose the one with the smaller movement delta; tie-breaker: alignment.
 */
export function resolveSnap(input: SnapInput): SnapOutput {
    const raw = input.rawPosition;
    const bypass = !!input.modifiers?.bypassAllSnapping;

    const thresholdPx = Number.isFinite(input.thresholdPx) ? (input.thresholdPx as number) : SNAP_THRESHOLD_PX;
    const gridSizePx = Number.isFinite(input.gridSizePx) ? (input.gridSizePx as number) : GRID_SIZE_PX;

    if (bypass) {
        return {
            position: { x: raw.x, y: raw.y },
            source: 'none',
            guides: [],
            debug: {
                raw: { x: raw.x, y: raw.y },
                chosen: { source: 'none', dx: 0, dy: 0 },
            },
        };
    }

    // --- Alignment candidate ---
    const movingBounds: ComponentBounds = {
        id: input.moving.id,
        x: raw.x,
        y: raw.y,
        width: input.moving.width,
        height: input.moving.height,
    };

    const siblings = (input.siblings ?? []).filter((b) => b.id !== input.moving.id);
    const alignmentGuides = siblings.length > 0 ? findAlignmentGuides(movingBounds, siblings, thresholdPx) : [];
    const alignedPos = alignmentGuides.length > 0 ? snapToGuides({ x: raw.x, y: raw.y }, movingBounds, alignmentGuides) : { x: raw.x, y: raw.y };

    const alignmentDelta = delta(raw, alignedPos);
    const alignmentMoved = alignmentDelta.dx !== 0 || alignmentDelta.dy !== 0;

    // --- Grid candidate (fallback) ---
    // Snap each axis only if close enough, to avoid huge jumps.
    const gridPos = {
        x: snapToGridWithinThreshold(raw.x, gridSizePx, thresholdPx),
        y: snapToGridWithinThreshold(raw.y, gridSizePx, thresholdPx),
    };
    const gridDelta = delta(raw, gridPos);
    const gridMoved = gridDelta.dx !== 0 || gridDelta.dy !== 0;

    // Choose winner:
    // 1) If alignment moved and grid didn't, choose alignment.
    // 2) If grid moved and alignment didn't, choose grid.
    // 3) If both moved, choose smaller movement; tie-breaker alignment.
    // 4) If neither moved, return raw.
    let chosen: { pos: { x: number; y: number }; source: SnapSource; guides: AlignmentGuide[] };

    if (alignmentMoved && !gridMoved) {
        chosen = { pos: alignedPos, source: 'alignment', guides: alignmentGuides };
    } else if (gridMoved && !alignmentMoved) {
        chosen = { pos: gridPos, source: 'grid', guides: [] };
    } else if (alignmentMoved && gridMoved) {
        const aDist = manhattanDistance(alignmentDelta);
        const gDist = manhattanDistance(gridDelta);

        if (aDist < gDist) {
            chosen = { pos: alignedPos, source: 'alignment', guides: alignmentGuides };
        } else if (gDist < aDist) {
            chosen = { pos: gridPos, source: 'grid', guides: [] };
        } else {
            // Tie: prefer alignment (Figma-like feel).
            chosen = { pos: alignedPos, source: 'alignment', guides: alignmentGuides };
        }
    } else {
        chosen = { pos: { x: raw.x, y: raw.y }, source: 'none', guides: [] };
    }

    const chosenDelta = delta(raw, chosen.pos);

    return {
        position: chosen.pos,
        source: chosen.source,
        guides: chosen.guides,
        debug: {
            raw: { x: raw.x, y: raw.y },
            alignmentCandidate: {
                x: alignedPos.x,
                y: alignedPos.y,
                dx: alignmentDelta.dx,
                dy: alignmentDelta.dy,
            },
            gridCandidate: {
                x: gridPos.x,
                y: gridPos.y,
                dx: gridDelta.dx,
                dy: gridDelta.dy,
            },
            chosen: {
                source: chosen.source,
                dx: chosenDelta.dx,
                dy: chosenDelta.dy,
            },
        },
    };
}

/**
 * Resolve snapping for a resize operation.
 *
 * Policy (alignment-first, Figma-like):
 * - If bypass enabled: return raw rect (no guides).
 * - Compute an alignment snap candidate by snapping the moving rect position using alignment guides.
 *   We then project that positional snap onto the relevant moving edges based on the handle:
 *   - 'e' affects right edge (width)
 *   - 'w' affects left edge (x + width)
 *   - 's' affects bottom edge (height)
 *   - 'n' affects top edge (y + height)
 * - Grid snapping is a fallback (within threshold) applied to the same moving edges.
 * - If both candidates change, choose the smaller movement; tie-breaker alignment.
 *
 * Notes:
 * - This resolver does not enforce min/max size constraints; callers should clamp afterward.
 * - This resolver preserves the opposite edge anchored to the start rect.
 */
export function resolveResizeSnap(input: ResizeSnapInput): ResizeSnapOutput {
    const bypass = !!input.modifiers?.bypassAllSnapping;

    const thresholdPx = Number.isFinite(input.thresholdPx) ? (input.thresholdPx as number) : SNAP_THRESHOLD_PX;
    const gridSizePx = Number.isFinite(input.gridSizePx) ? (input.gridSizePx as number) : GRID_SIZE_PX;

    const raw0 = clampNonNegativeSize(input.rawRect);
    const start0 = clampNonNegativeSize(input.startRect);

    if (bypass) {
        return { rect: raw0, source: 'none', guides: [] };
    }

    const id = '__resize__';
    const siblings = (input.siblings ?? []).filter((b) => b.id !== id);

    // --- Alignment candidate ---
    // Use positional snapping to infer edge snapping. We compute an aligned position for the raw rect
    // and then derive which edge should move based on the handle.
    const movingBounds = getResizeMovingBounds(id, raw0);
    const guides = siblings.length > 0 ? findAlignmentGuides(movingBounds, siblings, thresholdPx) : [];
    const alignedPos = guides.length > 0 ? snapToGuides({ x: raw0.x, y: raw0.y }, movingBounds, guides) : { x: raw0.x, y: raw0.y };

    // Project alignment positional snap onto resize edges.
    let alignedRect = { ...raw0 };

    const startRight = start0.x + start0.width;
    const startBottom = start0.y + start0.height;

    if (input.handle.includes('e')) {
        // Move right edge
        const rawRight = raw0.x + raw0.width;
        const alignedRight = alignedPos.x + (rawRight - raw0.x);
        alignedRect.width = alignedRight - raw0.x;
    }
    if (input.handle.includes('w')) {
        // Move left edge, anchor right edge to start rect
        alignedRect.x = alignedPos.x;
        alignedRect.width = startRight - alignedRect.x;
    }
    if (input.handle.includes('s')) {
        // Move bottom edge
        const rawBottom = raw0.y + raw0.height;
        const alignedBottom = alignedPos.y + (rawBottom - raw0.y);
        alignedRect.height = alignedBottom - raw0.y;
    }
    if (input.handle.includes('n')) {
        // Move top edge, anchor bottom edge to start rect
        alignedRect.y = alignedPos.y;
        alignedRect.height = startBottom - alignedRect.y;
    }

    alignedRect = clampNonNegativeSize(alignedRect);

    // --- Grid candidate (fallback within threshold) ---
    let gridRect = { ...raw0 };

    // Snap the moving edges only (not the anchored ones), within threshold.
    const rawRight = raw0.x + raw0.width;
    const rawBottom = raw0.y + raw0.height;

    if (input.handle.includes('e')) {
        const snappedRight = snapToGridWithinThreshold(rawRight, gridSizePx, thresholdPx);
        gridRect.width = snappedRight - raw0.x;
    }
    if (input.handle.includes('w')) {
        const snappedLeft = snapToGridWithinThreshold(raw0.x, gridSizePx, thresholdPx);
        gridRect.x = snappedLeft;
        gridRect.width = startRight - gridRect.x;
    }
    if (input.handle.includes('s')) {
        const snappedBottom = snapToGridWithinThreshold(rawBottom, gridSizePx, thresholdPx);
        gridRect.height = snappedBottom - raw0.y;
    }
    if (input.handle.includes('n')) {
        const snappedTop = snapToGridWithinThreshold(raw0.y, gridSizePx, thresholdPx);
        gridRect.y = snappedTop;
        gridRect.height = startBottom - gridRect.y;
    }

    gridRect = clampNonNegativeSize(gridRect);

    // Choose winner by minimal change; tie-breaker alignment.
    const rawRef = { x: raw0.x, y: raw0.y };
    const aRef = { x: alignedRect.x, y: alignedRect.y };
    const gRef = { x: gridRect.x, y: gridRect.y };

    // Include size deltas in distance metric for resize
    const aDist =
        Math.abs(alignedRect.x - raw0.x) +
        Math.abs(alignedRect.y - raw0.y) +
        Math.abs(alignedRect.width - raw0.width) +
        Math.abs(alignedRect.height - raw0.height);
    const gDist =
        Math.abs(gridRect.x - raw0.x) +
        Math.abs(gridRect.y - raw0.y) +
        Math.abs(gridRect.width - raw0.width) +
        Math.abs(gridRect.height - raw0.height);

    const aMoved = aDist !== 0;
    const gMoved = gDist !== 0;

    if (aMoved && !gMoved) return { rect: alignedRect, source: 'alignment', guides };
    if (gMoved && !aMoved) return { rect: gridRect, source: 'grid', guides: [] };
    if (aMoved && gMoved) {
        if (aDist < gDist) return { rect: alignedRect, source: 'alignment', guides };
        if (gDist < aDist) return { rect: gridRect, source: 'grid', guides: [] };
        return { rect: alignedRect, source: 'alignment', guides };
    }

    return { rect: raw0, source: 'none', guides: [] };
}
