/**
 * Shared UI Configuration Constants
 * Sensible defaults for spacing, animation, and interaction
 */

export const UI_CONFIG = {
    // Spacing
    padding: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },

    // Animation durations (ms)
    animation: {
        fast: 150,
        normal: 300,
        slow: 500,
    },

    // Default corner radius names (matching Tailwind theme)
    radius: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
    },

    // Interaction
    scrolling: {
        friction: 0.8,
        overscan: 10,
    }
};

export const INPUT_DEFAULTS = {
    height: 'h-9',
    smallHeight: 'h-8',
    iconSize: 'size-4',
    transition: 'transition-all duration-150 ease-in-out',
};
