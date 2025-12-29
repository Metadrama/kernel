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

import { GRID_SIZE_PX, SNAP_THRESHOLD_PX, snapToGridWithinThreshold } from './canvas-constants';
import {
  findAlignmentGuides,
  snapToGuides,
  type AlignmentGuide,
  type ComponentBounds,
} from './alignment-helpers';

export type SnapSource = 'none' | 'alignment' | 'grid';

export interface SnapModifiers {
  /**
   * When true, bypasses ALL snapping (grid + alignment).
   * Typically mapped to Alt/Option.
   */
  bypassAllSnapping?: boolean;
}

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
   * Guides to render (alignment guides only, for now).
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

function delta(a: { x: number; y: number }, b: { x: number; y: number }): { dx: number; dy: number } {
  return { dx: b.x - a.x, dy: b.y - a.y };
}

function manhattanDistance(d: { dx: number; dy: number }): number {
  return Math.abs(d.dx) + Math.abs(d.dy);
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
  const alignedPos =
    alignmentGuides.length > 0
      ? snapToGuides({ x: raw.x, y: raw.y }, movingBounds, alignmentGuides)
      : { x: raw.x, y: raw.y };

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
