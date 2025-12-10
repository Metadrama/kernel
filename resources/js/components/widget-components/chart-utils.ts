
// Vibrant color palettes for charts
export const COLOR_PALETTES = {
    vibrant: [
        '#3b82f6', // blue
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
        '#84cc16', // lime
        '#6366f1', // indigo
    ],
    pastel: [
        '#93c5fd', // blue
        '#6ee7b7', // emerald
        '#fcd34d', // amber
        '#fca5a5', // red
        '#c4b5fd', // violet
        '#f9a8d4', // pink
        '#67e8f9', // cyan
        '#fdba74', // orange
        '#bef264', // lime
        '#a5b4fc', // indigo
    ],
    cool: [
        '#3b82f6', // blue
        '#06b6d4', // cyan
        '#8b5cf6', // violet
        '#6366f1', // indigo
        '#0ea5e9', // sky
        '#a855f7', // purple
        '#14b8a6', // teal
        '#2563eb', // blue-600
        '#7c3aed', // violet-600
        '#0891b2', // cyan-600
    ],
    warm: [
        '#f59e0b', // amber
        '#ef4444', // red
        '#f97316', // orange
        '#ec4899', // pink
        '#eab308', // yellow
        '#dc2626', // red-600
        '#ea580c', // orange-600
        '#db2777', // pink-600
        '#d97706', // amber-600
        '#be123c', // rose-700
    ],
};

export type ColorPalette = keyof typeof COLOR_PALETTES;

// Get colors for a chart based on data count
export function getChartColors(count: number, palette: ColorPalette = 'vibrant'): string[] {
    const colors = COLOR_PALETTES[palette];
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}
