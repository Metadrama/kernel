export const GRID_FINE_GRAIN = 2;
export const GRID_BASE_COLUMNS = 12;
export const GRID_MAX_COLUMNS = GRID_BASE_COLUMNS * GRID_FINE_GRAIN;

export function upscaleGridUnits(value: number): number {
  return Math.round(value * GRID_FINE_GRAIN);
}

export function downscaleGridUnits(value: number): number {
  return Math.max(0, Math.round(value / GRID_FINE_GRAIN));
}
