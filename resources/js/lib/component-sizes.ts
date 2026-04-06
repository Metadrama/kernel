/**
 * Component Size Definitions
 * 
 * Default and minimum sizes for each component type.
 * Used when dropping new components and for resize constraints.
 */

import { COMPONENT_CATALOG } from '@/constants/component-catalog';

export interface ComponentSize {
    width: number;
    height: number;
}

const FALLBACK_SIZE: ComponentSize = { width: 280, height: 200 };
const FALLBACK_MIN_SIZE: ComponentSize = { width: 80, height: 60 };

const DEFAULT_ENTRY = COMPONENT_CATALOG.find((entry) => entry.id === 'default');

function buildSizeMap<T>(selector: (entry: (typeof COMPONENT_CATALOG)[number]) => T): Record<string, T> {
    return COMPONENT_CATALOG.reduce((acc, entry) => {
        acc[entry.id] = selector(entry);
        return acc;
    }, {} as Record<string, T>);
}

/**
 * Default sizes when dropping a new component.
 */
export const COMPONENT_DEFAULT_SIZES: Record<string, ComponentSize> = buildSizeMap((entry) => entry.defaultSize);

/**
 * Minimum sizes for resize constraints.
 */
export const COMPONENT_MIN_SIZES: Record<string, ComponentSize> = buildSizeMap((entry) => entry.minSize);

/**
 * Maximum sizes (optional - null means no max).
 */
export const COMPONENT_MAX_SIZES: Record<string, ComponentSize | null> = buildSizeMap((entry) => entry.maxSize);

/**
 * Aspect ratios for components that should maintain proportion.
 * null = freeform resize, number = locked ratio (width/height).
 */
export const COMPONENT_ASPECT_RATIOS: Record<string, number | null> = buildSizeMap((entry) => entry.aspectRatio);

/**
 * Get default size for a component type
 */
export function getDefaultSize(componentType: string): ComponentSize {
    return COMPONENT_DEFAULT_SIZES[componentType] || DEFAULT_ENTRY?.defaultSize || FALLBACK_SIZE;
}

/**
 * Get minimum size for a component type
 */
export function getMinSize(componentType: string): ComponentSize {
    return COMPONENT_MIN_SIZES[componentType] || DEFAULT_ENTRY?.minSize || FALLBACK_MIN_SIZE;
}

/**
 * Get maximum size for a component type (null if unbounded)
 */
export function getMaxSize(componentType: string): ComponentSize | null {
    return COMPONENT_MAX_SIZES[componentType] ?? DEFAULT_ENTRY?.maxSize ?? null;
}

/**
 * Get aspect ratio for a component type (null if freeform)
 */
export function getAspectRatio(componentType: string): number | null {
    return COMPONENT_ASPECT_RATIOS[componentType] ?? null;
}
