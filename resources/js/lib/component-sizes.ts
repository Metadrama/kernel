/**
 * Component Size Definitions
 * 
 * Default and minimum sizes for each component type.
 * Used when dropping new components and for resize constraints.
 */

export interface ComponentSize {
    width: number;
    height: number;
}

/**
 * Default sizes when dropping a new component
 */
export const COMPONENT_DEFAULT_SIZES: Record<string, ComponentSize> = {
    'chart-line': { width: 400, height: 256 },
    'chart-bar': { width: 400, height: 256 },
    'chart-doughnut': { width: 280, height: 280 },
    'chart': { width: 400, height: 256 },
    'text': { width: 120, height: 40 },
    'heading': { width: 304, height: 48 },
    'kpi': { width: 184, height: 120 },
    'default': { width: 280, height: 200 },
};

/**
 * Minimum sizes for resize constraints
 */
export const COMPONENT_MIN_SIZES: Record<string, ComponentSize> = {
    'chart-line': { width: 200, height: 152 },
    'chart-bar': { width: 200, height: 152 },
    'chart-doughnut': { width: 152, height: 152 },
    'chart': { width: 200, height: 152 },
    'text': { width: 40, height: 24 },
    'heading': { width: 80, height: 32 },
    'kpi': { width: 104, height: 80 },
    'default': { width: 80, height: 64 },
};

/**
 * Maximum sizes (optional - null means no max)
 */
export const COMPONENT_MAX_SIZES: Record<string, ComponentSize | null> = {
    'chart-line': null,
    'chart-bar': null,
    'chart-doughnut': null,
    'chart': null,
    'text': null,
    'heading': { width: 800, height: 120 },
    'kpi': { width: 400, height: 304 },
    'default': null,
};

/**
 * Aspect ratios for components that should maintain proportion
 * null = freeform resize, number = locked ratio (width/height)
 */
export const COMPONENT_ASPECT_RATIOS: Record<string, number | null> = {
    'chart-line': null,      // Allow flexible aspect ratio
    'chart-bar': null,
    'chart-doughnut': 1,     // Square for doughnut charts
    'chart': null,
    'text': null,            // Freeform for text
    'heading': null,
    'kpi': null,
    'default': null,
};

/**
 * Get default size for a component type
 */
export function getDefaultSize(componentType: string): ComponentSize {
    return COMPONENT_DEFAULT_SIZES[componentType] || COMPONENT_DEFAULT_SIZES['default'];
}

/**
 * Get minimum size for a component type
 */
export function getMinSize(componentType: string): ComponentSize {
    return COMPONENT_MIN_SIZES[componentType] || COMPONENT_MIN_SIZES['default'];
}

/**
 * Get maximum size for a component type (null if unbounded)
 */
export function getMaxSize(componentType: string): ComponentSize | null {
    return COMPONENT_MAX_SIZES[componentType] ?? COMPONENT_MAX_SIZES['default'];
}

/**
 * Get aspect ratio for a component type (null if freeform)
 */
export function getAspectRatio(componentType: string): number | null {
    return COMPONENT_ASPECT_RATIOS[componentType] ?? null;
}
