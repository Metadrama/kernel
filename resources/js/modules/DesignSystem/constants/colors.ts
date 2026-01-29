/**
 * Shared color palettes and system colors
 */

// Professional color palettes for charts
export const CHART_PALETTES = {
    vibrant: [
        '#2563eb', // blue-600
        '#3b82f6', // blue-500
        '#60a5fa', // blue-400
        '#93c5fd', // blue-300
        '#1d4ed8', // blue-700
        '#1e40af', // blue-800
        '#3730a3', // indigo-800
        '#4f46e5', // indigo-600
        '#6366f1', // indigo-500
        '#818cf8', // indigo-400
    ],
    pastel: [
        '#bfdbfe', // blue-200
        '#c7d2fe', // indigo-200
        '#ddd6fe', // violet-200
        '#e0e7ff', // indigo-100
        '#a5b4fc', // indigo-300
        '#93c5fd', // blue-300
        '#7dd3fc', // sky-300
        '#a5f3fc', // cyan-200
        '#99f6e4', // teal-200
        '#a7f3d0', // emerald-200
    ],
    cool: [
        '#0f172a', // slate-900
        '#1e293b', // slate-800
        '#334155', // slate-700
        '#475569', // slate-600
        '#64748b', // slate-500
        '#94a3b8', // slate-400
        '#3b82f6', // blue-500
        '#0ea5e9', // sky-500
        '#06b6d4', // cyan-500
        '#14b8a6', // teal-500
    ],
    warm: [
        '#78350f', // amber-900
        '#92400e', // amber-800
        '#b45309', // amber-700
        '#d97706', // amber-600
        '#f59e0b', // amber-500
        '#fbbf24', // amber-400
        '#c2410c', // orange-700
        '#ea580c', // orange-600
        '#f97316', // orange-500
        '#fb923c', // orange-400
    ],
};

export type ChartPaletteName = keyof typeof CHART_PALETTES;

// System colors for status indicators
export const STATUS_COLORS = {
    success: '#22c55e', // green-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444',   // red-500
    info: '#3b82f6',    // blue-500
};

// UI Element colors
export const UI_COLORS = {
    selection: 'rgba(59, 130, 246, 0.5)', // primary/50
    grid: 'rgba(0, 0, 0, 0.05)',
    border: '#e2e8f0',
};
