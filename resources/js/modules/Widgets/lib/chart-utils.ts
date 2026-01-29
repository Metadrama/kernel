import { FONT_FAMILIES } from '@/modules/DesignSystem/constants/fonts';
import { CHART_PALETTES, type ChartPaletteName } from '@/modules/DesignSystem/constants/colors';

export type ColorPalette = ChartPaletteName;

// Get colors for a chart based on data count
export function getChartColors(count: number, palette: ColorPalette = 'vibrant'): string[] {
    const colors = CHART_PALETTES[palette];
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}
