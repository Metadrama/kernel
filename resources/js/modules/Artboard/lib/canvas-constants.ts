/**
 * Shared canvas constants.
 *
 * Keep all "magic numbers" related to canvas interaction/rendering in one place
 * so behavior stays consistent across components (grid, snapping, etc).
 */

export const GRID_SIZE_PX = 8;

/**
 * Snapping threshold in pixels (canvas/world pixels, not screen pixels).
 *
 * This is the max distance allowed between a candidate snapped value and the
 * raw value for snapping to engage.
 *
 * Note: This is intentionally independent of `GRID_SIZE_PX` so you can tune
 * how "sticky" snapping feels without changing the grid itself.
 */
export const SNAP_THRESHOLD_PX = 5;

/**
 * Helper: snap a scalar value to the nearest grid line.
 */
export function snapToGrid(valuePx: number, gridSizePx: number = GRID_SIZE_PX): number {
  if (!Number.isFinite(valuePx) || !Number.isFinite(gridSizePx) || gridSizePx <= 0) return valuePx;
  return Math.round(valuePx / gridSizePx) * gridSizePx;
}

/**
 * Helper: snap a scalar value to the grid only if within a given threshold.
 *
 * This avoids jarring jumps when the cursor is far from a gridline.
 */
export function snapToGridWithinThreshold(
  valuePx: number,
  gridSizePx: number = GRID_SIZE_PX,
  thresholdPx: number = SNAP_THRESHOLD_PX
): number {
  if (
    !Number.isFinite(valuePx) ||
    !Number.isFinite(gridSizePx) ||
    gridSizePx <= 0 ||
    !Number.isFinite(thresholdPx) ||
    thresholdPx < 0
  ) {
    return valuePx;
  }

  const snapped = snapToGrid(valuePx, gridSizePx);
  return Math.abs(snapped - valuePx) <= thresholdPx ? snapped : valuePx;
}
