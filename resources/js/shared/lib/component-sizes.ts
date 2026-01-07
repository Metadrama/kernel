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
    'chart-gauge': { width: 280, height: 200 },
    'chart': { width: 400, height: 256 },
    'text': { width: 120, height: 40 },
    'heading': { width: 120, height: 40 }, // Legacy alias -> text
    'kpi': { width: 184, height: 120 },
    'table': { width: 400, height: 300 },
    'image': { width: 200, height: 150 },
    'default': { width: 280, height: 200 },
};

/**
 * Minimum sizes for resize constraints
 */
export const COMPONENT_MIN_SIZES: Record<string, ComponentSize> = {
    'chart-line': { width: 200, height: 152 },
    'chart-bar': { width: 200, height: 152 },
    'chart-doughnut': { width: 152, height: 152 },
    'chart-gauge': { width: 150, height: 120 },
    'chart': { width: 200, height: 152 },
    'text': { width: 40, height: 24 },
    'heading': { width: 40, height: 24 }, // Legacy alias -> text
    'kpi': { width: 104, height: 80 },
    'table': { width: 200, height: 150 },
    'image': { width: 50, height: 50 },
    'default': { width: 80, height: 64 },
};

/**
 * Maximum sizes (optional - null means no max)
 */
export const COMPONENT_MAX_SIZES: Record<string, ComponentSize | null> = {
    'chart-line': null,
    'chart-bar': null,
    'chart-doughnut': null,
    'chart-gauge': null,
    'chart': null,
    'text': null,
    'heading': null, // Legacy alias -> text
    'kpi': { width: 400, height: 304 },
    'table': null,
    'image': null,
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
    'chart-gauge': null,
    'chart': null,
    'text': null,            // Freeform for text
    'heading': null,         // Legacy alias -> text
    'kpi': null,
    'table': null,
    'image': null,
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
