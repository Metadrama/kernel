import { useMemo } from 'react';
import { useChartData } from './useChartData';
import { getChartColors } from './chart-utils';
import { useArtboardContext } from '@/context/ArtboardContext';
import type { ChartComponentConfigProps } from './ChartComponent';

export default function ChartLegendComponent({ config }: { config?: any }) {
    const { artboards } = useArtboardContext();

    // Resolve linked chart config if selected
    const effectiveConfig = useMemo(() => {
        if (!config?.linkedChartId) return config;

        // Search for the linked component across all artboards
        for (const artboard of artboards) {
            for (const widget of artboard.widgets) {
                const linked = widget.components.find(c => c.instanceId === config.linkedChartId);
                if (linked && linked.config) {
                    // Merge: use linked data/colors, but keep own title if set (or override?)
                    // Usually we want to reflect the chart, so using linked config fully for data/style is best.
                    // But we might want own title.
                    return {
                        ...linked.config,
                        title: config.title || (linked.config.title ? `${linked.config.title} Legend` : undefined),
                        // Force legend specific overrides if needed
                    };
                }
            }
        }
        return config;
    }, [config, artboards]);

    const { chartData } = useChartData(effectiveConfig);

    const colors = useMemo(() => {
        return getChartColors(chartData.values.length, effectiveConfig?.colorPalette || 'vibrant');
    }, [chartData.values.length, effectiveConfig?.colorPalette]);

    if (!chartData.labels || chartData.labels.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <p className="text-xs text-muted-foreground">No data for legend</p>
            </div>
        );
    }

    // Determine layout orientation based on container shape? 
    // For now, use flex-wrap which adapts to both.

    return (
        <div className="h-full w-full p-4 overflow-auto">
            {config?.title && (
                <h3 className="text-xs font-medium text-muted-foreground mb-3">{config.title}</h3>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2 content-start">
                {chartData.labels.map((label, index) => (
                    <div key={index} className="flex items-center gap-2 min-w-[80px]">
                        <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-xs text-foreground truncate max-w-[120px]" title={label}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
