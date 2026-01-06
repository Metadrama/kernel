/**
 * Collision Detection and Snapping Utilities
 * 
 * Provides functions for:
 * - Detecting overlaps between positioned components
 * - Snapping positions to grid increments
 * - Finding valid non-overlapping positions
 * - Validating resize operations
 */

export interface Bounds {
  x: number;  // percentage 0-100
  y: number;  // percentage 0-100
  w: number;  // percentage 0-100
  h: number;  // percentage 0-100
}

export interface ComponentWithBounds {
  instanceId: string;
  bounds: Bounds;
}

/**
 * Default grid size for snapping (percentage)
 * 5% provides a good balance between precision and ease of alignment
 */
export const DEFAULT_SNAP_GRID_SIZE = 5;

/**
 * Minimum component size (percentage)
 */
export const MIN_COMPONENT_WIDTH = 10;
export const MIN_COMPONENT_HEIGHT = 10;

/**
 * Check if two rectangles overlap
 * Uses standard AABB (Axis-Aligned Bounding Box) collision detection
 * 
 * @param a First bounding box
 * @param b Second bounding box
 * @returns true if rectangles overlap, false otherwise
 */
export function hasCollision(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.w <= b.x ||  // a is left of b
    a.x >= b.x + b.w ||  // a is right of b
    a.y + a.h <= b.y ||  // a is above b
    a.y >= b.y + b.h     // a is below b
  );
}

/**
 * Snap a value to the nearest grid increment
 * 
 * @param value Value to snap (percentage)
 * @param gridSize Grid increment size (percentage)
 * @returns Snapped value
 */
export function snapToGrid(value: number, gridSize: number = DEFAULT_SNAP_GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap bounds to grid while maintaining size
 * 
 * @param bounds Original bounds
 * @param gridSize Grid increment size
 * @returns Bounds with snapped position
 */
export function snapBoundsToGrid(bounds: Bounds, gridSize: number = DEFAULT_SNAP_GRID_SIZE): Bounds {
  return {
    x: snapToGrid(bounds.x, gridSize),
    y: snapToGrid(bounds.y, gridSize),
    w: bounds.w,
    h: bounds.h,
  };
}

/**
 * Check if a component would collide with any other components
 * 
 * @param bounds Bounds to check
 * @param currentComponentId ID of the component being moved/resized (to exclude from check)
 * @param allComponents All components in the widget
 * @returns true if collision would occur, false otherwise
 */
export function wouldCollide(
  bounds: Bounds,
  currentComponentId: string,
  allComponents: ComponentWithBounds[]
): boolean {
  return allComponents.some(
    (comp) => comp.instanceId !== currentComponentId && hasCollision(bounds, comp.bounds)
  );
}

/**
 * Clamp bounds to container limits (0-100%)
 * Ensures component stays within widget boundaries
 * 
 * @param bounds Bounds to clamp
 * @returns Clamped bounds
 */
export function clampToContainer(bounds: Bounds): Bounds {
  return {
    x: Math.max(0, Math.min(100 - bounds.w, bounds.x)),
    y: Math.max(0, Math.min(100 - bounds.h, bounds.y)),
    w: Math.max(MIN_COMPONENT_WIDTH, Math.min(100, bounds.w)),
    h: Math.max(MIN_COMPONENT_HEIGHT, Math.min(100, bounds.h)),
  };
}

/**
 * Find the nearest valid position without collision
 * Tries snapped position first, then searches in a spiral pattern
 * 
 * @param desiredBounds Desired position and size
 * @param currentComponentId ID of component being positioned
 * @param otherComponents Other components to avoid
 * @param gridSize Grid size for snapping
 * @returns Valid bounds or null if no valid position found
 */
export function findNearestValidPosition(
  desiredBounds: Bounds,
  currentComponentId: string,
  otherComponents: ComponentWithBounds[],
  gridSize: number = DEFAULT_SNAP_GRID_SIZE
): Bounds | null {
  // Try the snapped position first
  const snappedBounds = snapBoundsToGrid(desiredBounds, gridSize);
  const clampedBounds = clampToContainer(snappedBounds);
  
  if (!wouldCollide(clampedBounds, currentComponentId, otherComponents)) {
    return clampedBounds;
  }

  // If snapped position collides, try nearby positions in a spiral pattern
  const maxSearchRadius = 20; // Max grid cells to search
  
  for (let radius = 1; radius <= maxSearchRadius; radius++) {
    // Try positions at current radius
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        // Only check positions at the current radius (spiral)
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        
        const testBounds = clampToContainer({
          x: clampedBounds.x + dx * gridSize,
          y: clampedBounds.y + dy * gridSize,
          w: desiredBounds.w,
          h: desiredBounds.h,
        });
        
        if (!wouldCollide(testBounds, currentComponentId, otherComponents)) {
          return testBounds;
        }
      }
    }
  }
  
  // No valid position found nearby
  return null;
}

/**
 * Calculate valid resize bounds with collision detection
 * Prevents resizing into other components
 * 
 * @param currentBounds Current component bounds
 * @param newBounds Desired new bounds after resize
 * @param componentId ID of component being resized
 * @param otherComponents Other components to avoid
 * @param gridSize Grid size for snapping
 * @returns Valid bounds or original bounds if resize not possible
 */
export function calculateValidResizeBounds(
  currentBounds: Bounds,
  newBounds: Bounds,
  componentId: string,
  otherComponents: ComponentWithBounds[],
  gridSize: number = DEFAULT_SNAP_GRID_SIZE
): Bounds {
  // Snap to grid
  const snappedBounds: Bounds = {
    x: snapToGrid(newBounds.x, gridSize),
    y: snapToGrid(newBounds.y, gridSize),
    w: Math.max(MIN_COMPONENT_WIDTH, newBounds.w),
    h: Math.max(MIN_COMPONENT_HEIGHT, newBounds.h),
  };
  
  // Clamp to container
  const clampedBounds = clampToContainer(snappedBounds);
  
  // Check for collision
  if (wouldCollide(clampedBounds, componentId, otherComponents)) {
    // Return current bounds if resize would cause collision
    return currentBounds;
  }
  
  return clampedBounds;
}

/**
 * Find a valid drop position for a new component
 * Tries to place at desired location, or finds nearest valid spot
 * 
 * @param dropX Drop x position (percentage)
 * @param dropY Drop y position (percentage)
 * @param width Component width (percentage)
 * @param height Component height (percentage)
 * @param existingComponents Existing components to avoid
 * @param gridSize Grid size for snapping
 * @returns Valid bounds for the new component
 */
export function findValidDropPosition(
  dropX: number,
  dropY: number,
  width: number,
  height: number,
  existingComponents: ComponentWithBounds[],
  gridSize: number = DEFAULT_SNAP_GRID_SIZE
): Bounds {
  const desiredBounds: Bounds = {
    x: dropX,
    y: dropY,
    w: width,
    h: height,
  };
  
  // Try to find valid position near drop point
  const validPosition = findNearestValidPosition(
    desiredBounds,
    '', // Empty ID since this is a new component
    existingComponents,
    gridSize
  );
  
  if (validPosition) {
    return validPosition;
  }
  
  // If no valid position found, try top-left area
  const fallbackBounds: Bounds = {
    x: 0,
    y: 0,
    w: width,
    h: height,
  };
  
  const fallbackPosition = findNearestValidPosition(
    fallbackBounds,
    '',
    existingComponents,
    gridSize
  );
  
  // Return fallback position or original desired bounds as last resort
  return fallbackPosition || clampToContainer(desiredBounds);
}
