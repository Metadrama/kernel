import { useEffect, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { Loader2 } from 'lucide-react';
import { useGoogleSheetsData, MOCK_CHART_DATA } from '@/lib/use-google-sheets';
import type {
    ChartConfig,
    LineChartConfig,
    BarChartConfig,
    DoughnutChartConfig,
    GoogleSheetsDataSource
} from '@/types/component-config';
import { cn } from '@/lib/utils';

// Premium gradient color palettes for modern charts
const COLOR_PALETTES = {
    vibrant: [
        '#6366f1', // indigo
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#f43f5e', // rose
        '#f59e0b', // amber
        '#10b981', // emerald
        '#06b6d4', // cyan
        '#3b82f6', // blue
        '#a855f7', // purple
        '#14b8a6', // teal
    ],
    pastel: [
        '#c7d2fe', // indigo-200
        '#ddd6fe', // violet-200
        '#fbcfe8', // pink-200
        '#fecdd3', // rose-200
        '#fed7aa', // amber-200
        '#a7f3d0', // emerald-200
        '#a5f3fc', // cyan-200
        '#bfdbfe', // blue-200
        '#e9d5ff', // purple-200
        '#99f6e4', // teal-200
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
    ],
    warm: [
        '#f59e0b', // amber
        '#f43f5e', // rose
        '#ef4444', // red
        '#f97316', // orange
        '#ec4899', // pink
        '#eab308', // yellow
        '#dc2626', // red-600
        '#d97706', // amber-600
    ],
    mono: [
        '#18181b', // zinc-900
        '#3f3f46', // zinc-700
        '#52525b', // zinc-600
        '#71717a', // zinc-500
        '#a1a1aa', // zinc-400
        '#d4d4d8', // zinc-300
    ]
};

// Generate an infinite array of colors based on palette
const getChartColors = (count: number, paletteName: string = 'vibrant') => {
    const palette = COLOR_PALETTES[paletteName as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.vibrant;
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(palette[i % palette.length]);
    }
    return colors;
};

// Custom tooltip component
const ChartTooltip = ({ color, title, subtitle }: { color?: string; title: React.ReactNode; subtitle?: React.ReactNode }) => {
    return createPortal(
        <div className="pointer-events-none fixed z-50 rounded-lg border bg-background px-3 py-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
                {color && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{title}</span>
                    {subtitle && <span className="text-muted-foreground text-xs">{subtitle}</span>}
                </div>
            </div>
        </div>,
        document.body
    );
};

// Helper for formatting numbers
const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', options).format(value);
};

const formatCurrency = (value: number, currency: string = 'MYR', options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        ...options,
    }).format(value);
};

export interface ChartComponentProps {
    config?: ChartConfig;
    instanceId: string;
}

export default function ChartComponent({ config, instanceId }: ChartComponentProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Extract common config
    const dataSource = config?.dataSource as GoogleSheetsDataSource | undefined;
    const chartType = config?.chartType || 'bar';
    const showTitle = config?.showTitle ?? true;
    const title = config?.title || '';
    const showLegend = config?.showLegend ?? true;
    const legendPosition = config?.legendPosition || 'bottom';
    const showTooltip = config?.showTooltip ?? true;
    const colorPalette = config?.colors?.colorPalette || 'vibrant';

    // Data handling options (cast to specific config type where needed, or default)
    // We cast to any here to access potential properties that might exist on specific types
    // This simplifies the logic vs strict union narrowing everywhere
    const configAny = config as any;
    const aggregation = configAny?.aggregation || 'sum';
    const sortBy = configAny?.sortBy || 'none';
    const sortOrder = configAny?.sortOrder || 'desc';
    const limit = configAny?.limit || 10;

    // Fetch Data
    const { data: sheetsData, loading, error } = useGoogleSheetsData({
        dataSource: dataSource || { type: 'google-sheets', spreadsheetId: '', sheetName: '' }, // Minimal valid type
        aggregation,
        sortBy,
        sortOrder,
        limit,
    });

    // Use mock data if no data source configured or loading (optional: remove mock on loading for skeleton)
    const effectiveData = useMemo(() => {
        if (sheetsData) return sheetsData;
        if (!dataSource?.spreadsheetId && MOCK_CHART_DATA[chartType === 'doughnut' ? 'doughnut' : chartType]) {
             // Handle 'pie' vs 'doughnut' mapping for mock data
             const typeKey = chartType === 'pie' ? 'doughnut' : chartType;
            return MOCK_CHART_DATA[typeKey];
        }
        return null;
    }, [sheetsData, dataSource, chartType]);

    // Transform data for Nivo
    const nivoData = useMemo(() => {
        if (!effectiveData) return { pie: [], bar: [], line: [] };

        const { labels, values } = effectiveData;
        const colors = getChartColors(labels.length, colorPalette);

        const pieData = labels.map((label, i) => ({
            id: label,
            label,
            value: values[i],
            color: colors[i]
        }));

        const barData = labels.map((label, i) => ({
            label,
            value: values[i],
            color: colors[i]
        }));

        const lineData = [{
            id: 'series1',
            color: colors[0],
            data: labels.map((label, i) => ({
                x: label,
                y: values[i]
            }))
        }];

        return { pie: pieData, bar: barData, line: lineData };
    }, [effectiveData, colorPalette]);

    if (!dataSource?.spreadsheetId && !effectiveData) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-muted/20 text-muted-foreground text-xs rounded-lg border border-dashed p-4 text-center">
                Configure data source to view chart
            </div>
        );
    }

    if (loading && !effectiveData) {
        return (
            <div className="h-full w-full flex items-center justify-center text-primary/50">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (error && !effectiveData) {
        return (
            <div className="h-full w-full flex items-center justify-center text-destructive text-xs p-4 text-center">
                Error: {error}
            </div>
        );
    }

    // Chart Theme
    const theme = {
        background: 'transparent',
        text: {
            fontSize: 11,
            fill: 'hsl(var(--muted-foreground))',
            fontFamily: 'var(--font-sans)',
        },
        axis: {
            domain: {
                line: {
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 1,
                },
            },
            legend: {
                text: {
                    fontSize: 12,
                    fill: 'hsl(var(--foreground))',
                    fontWeight: 600,
                },
            },
            ticks: {
                line: {
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 1,
                },
                text: {
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                },
            },
        },
        grid: {
            line: {
                stroke: 'hsl(var(--border))',
                strokeWidth: 1,
                strokeDasharray: '4 4',
                opacity: 0.5,
            },
        },
        tooltip: {
            container: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontSize: 12,
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                padding: '8px 12px',
                border: '1px solid hsl(var(--border))',
            },
        },
        legends: {
            text: {
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
            }
        }
    };

    const renderChart = () => {
        const colors = getChartColors(effectiveData?.labels.length || 0, colorPalette);

        // PIE / DOUGHNUT
        if (chartType === 'doughnut' || chartType === 'pie') {
            const dConfig = config as DoughnutChartConfig;
            const innerRadius = chartType === 'doughnut' ? (dConfig?.cutout || 0.6) : 0;
            const padAngle = dConfig?.padAngle || 2;
            const cornerRadius = dConfig?.cornerRadius || 4;
            const showLabels = dConfig?.showDataLabels ?? true;

            // Simple legend generation logic
            const getLegends = (anchor: string) => {
                if (!showLegend) return [];
                const isBottom = legendPosition === 'bottom';
                return [{
                    anchor: isBottom ? 'bottom' : 'right',
                    direction: isBottom ? 'row' : 'column',
                    justify: false,
                    translateX: isBottom ? 0 : 80,
                    translateY: isBottom ? 50 : 0,
                    itemsSpacing: isBottom ? 10 : 5,
                    itemWidth: 80,
                    itemHeight: 18,
                    itemTextColor: 'hsl(var(--muted-foreground))',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 10,
                    symbolShape: 'circle'
                }];
            };

            const margin = {
                top: 20 + (legendPosition === 'top' && showLegend ? 40 : 0),
                right: 20 + (legendPosition === 'right' && showLegend ? 80 : 0),
                bottom: 20 + (legendPosition === 'bottom' && showLegend ? 60 : 0),
                left: 20 + (legendPosition === 'left' && showLegend ? 80 : 0),
            };

            const pos = dConfig?.dataLabelPosition || 'inside';

            return (
                <ResponsivePie
                    data={nivoData.pie}
                    margin={margin}
                    innerRadius={Number(innerRadius)} // ensure number
                    padAngle={padAngle}
                    cornerRadius={cornerRadius}
                    activeOuterRadiusOffset={8}
                    colors={colors}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}

                    // Arc Labels
                    enableArcLinkLabels={showLabels && pos === 'outside'}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="hsl(var(--muted-foreground))"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color', modifiers: [['opacity', 0.5]] }}

                    // Inner Labels
                    enableArcLabels={showLabels && pos === 'inside'}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="white"
                    arcLabel={(d) => dConfig?.dataLabelType === 'percent'
                        ? `${Math.round(d.value / nivoData.pie.reduce((a, b) => a + b.value, 0) * 100)}%`
                        : `${d.value}`}

                    theme={theme}
                    animate={true}
                    motionConfig="wobbly"
                    transitionMode="middleAngle"
                    legends={getLegends('circle') as any}
                    tooltip={showTooltip ? ({ datum: d }) => (
                        <div className="flex items-center gap-2 bg-background border px-2 py-1.5 rounded shadow-sm text-xs">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                           <span className="font-medium">{d.label}:</span>
                           <span>{formatNumber(d.value, { maximumFractionDigits: 0 })}</span>
                        </div>
                    ) : undefined}
                />
            );
        }

        // BAR CHART
        if (chartType === 'bar') {
            const bConfig = config as BarChartConfig;
            const isHorizontal = bConfig?.horizontal ?? false;
            const isStacked = bConfig?.stacked ?? false;

            // Determine formatting based on axis config
            const formatType = bConfig?.yAxis?.formatType || 'number';
            const currencyCode = bConfig?.yAxis?.currencyCode || 'MYR';

            // Value formatter for axes - use compact for large numbers
            const valueFormatter = (value: number) => {
                if (formatType === 'currency') {
                    return formatCurrency(value, currencyCode, { notation: 'compact' });
                } else if (formatType === 'percent') {
                    return formatNumber(value, { notation: 'compact' }) + '%';
                }
                return formatNumber(value, { notation: 'compact' });
            };

            // Tooltip formatter - full precision with separators
            const tooltipFormatter = (value: number) => {
                if (formatType === 'currency') {
                    return formatCurrency(value, currencyCode);
                } else if (formatType === 'percent') {
                    return formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                }
                return formatNumber(value, { maximumFractionDigits: 0 });
            };

            // Smart Axis Logic
            const labelCount = nivoData.bar.length;
            const maxLabelLength = Math.max(...nivoData.bar.map(d => d.label.length));
            const shouldRotateLabels = !isHorizontal && (labelCount > 8 || maxLabelLength > 8);

            const margin = {
                top: 20 + (legendPosition === 'top' && showLegend ? 40 : 0),
                right: 20 + (legendPosition === 'right' && showLegend ? 80 : 0),
                bottom: (shouldRotateLabels ? 60 : 30) + (legendPosition === 'bottom' && showLegend ? 40 : 0),
                left: 50 + (legendPosition === 'left' && showLegend ? 80 : 0),
            };

            return (
                <ResponsiveBar
                    data={nivoData.bar}
                    keys={['value']}
                    indexBy="label"
                    layout={isHorizontal ? 'horizontal' : 'vertical'}
                    groupMode={isStacked ? 'stacked' : 'grouped'}
                    margin={margin}
                    padding={0.35}
                    colors={colors}
                    theme={theme}
                    borderRadius={bConfig?.borderRadius ?? 4}

                    // Axes with formatting
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickRotation: shouldRotateLabels ? -45 : 0,
                        legend: bConfig?.xAxis?.label,
                        legendPosition: 'middle',
                        legendOffset: shouldRotateLabels ? 50 : 36,
                        format: isHorizontal ? valueFormatter : undefined,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickRotation: 0,
                        legend: bConfig?.yAxis?.label,
                        legendPosition: 'middle',
                        legendOffset: -40,
                        format: isHorizontal ? undefined : valueFormatter,
                    }}
                    enableGridX={bConfig?.xAxis?.showGridLines ?? false}
                    enableGridY={bConfig?.yAxis?.showGridLines ?? true}
                    enableLabel={false}

                    animate={true}
                    motionConfig="gentle"
                    tooltip={showTooltip ? ({ id, value, color, indexValue }) => (
                         <div className="flex items-center gap-2 bg-background border px-2 py-1.5 rounded shadow-sm text-xs">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                           <span className="font-medium">{indexValue}:</span>
                           <span>{tooltipFormatter(value)}</span>
                        </div>
                    ) : () => null}

                    defs={[
                        {
                            id: 'gradient',
                            type: 'linearGradient',
                            colors: [
                                { offset: 0, color: 'inherit' },
                                { offset: 100, color: 'inherit', opacity: 0.85 }
                            ]
                        }
                    ]}
                    fill={[{ match: '*', id: 'gradient' }]}
                />
            );
        }

        // LINE CHART
        const lConfig = config as LineChartConfig;
        const curve = lConfig?.tension === 0 ? 'linear' : 'catmullRom';
        const showPoints = lConfig?.showPoints ?? true;
        const pointSize = (lConfig?.pointRadius ?? 4) * 2;
        const enableArea = lConfig?.fill ?? true;

        // Compact formatter for axis
        const axisFormatter = (value: number) => formatNumber(value, { notation: 'compact' });

        // Full formatter for tooltip
        const tooltipValueFormatter = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Smart Axis Logic for Line Chart
        const dataPoints = nivoData.line[0]?.data || [];
        const labelCount = dataPoints.length;
        const maxLabelLength = Math.max(...dataPoints.map(d => String(d.x).length));
        const shouldRotateLabels = labelCount > 8 || maxLabelLength > 8;

        const margin = {
            top: 20 + (legendPosition === 'top' && showLegend ? 40 : 0),
            right: 20 + (legendPosition === 'right' && showLegend ? 80 : 0),
            bottom: (shouldRotateLabels ? 60 : 30) + (legendPosition === 'bottom' && showLegend ? 40 : 0),
            left: 50 + (legendPosition === 'left' && showLegend ? 80 : 0),
        };

        return (
            <ResponsiveLine
                data={nivoData.line}
                margin={margin}
                colors={colors}
                theme={theme}
                curve={curve}

                // Line styling
                lineWidth={3}
                pointSize={showPoints ? pointSize : 0}
                pointColor="hsl(var(--background))"
                pointBorderWidth={showPoints ? 2 : 0}
                pointBorderColor={{ from: 'serieColor' }}
                enablePointLabel={false}

                // Grid & Axes
                enableGridX={lConfig?.xAxis?.showGridLines ?? false}
                enableGridY={lConfig?.yAxis?.showGridLines ?? true}
                axisBottom={{
                    tickSize: 0,
                    tickPadding: 12,
                    tickRotation: shouldRotateLabels ? -45 : 0,
                    legend: lConfig?.xAxis?.label,
                    legendOffset: shouldRotateLabels ? 50 : 36,
                    legendPosition: 'middle'
                }}
                axisLeft={{
                    tickSize: 0,
                    tickPadding: 12,
                    tickRotation: 0,
                    legend: lConfig?.yAxis?.label,
                    legendOffset: -40,
                    legendPosition: 'middle',
                    format: axisFormatter,
                }}

                // Area
                enableArea={enableArea}
                areaOpacity={0.15}
                areaBaselineValue={0}

                animate={true}
                motionConfig="gentle"
                enableCrosshair={true}
                crosshairType="cross"

                tooltip={showTooltip ? ({ point }) => (
                     <div className="flex items-center gap-2 bg-background border px-2 py-1.5 rounded shadow-sm text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: point.color }} />
                        <span className="font-medium">{point.data.xFormatted}:</span>
                        <span>{tooltipValueFormatter(point.data.y as number)}</span>
                    </div>
                ) : () => null}

                defs={[
                    {
                        id: 'gradient',
                        type: 'linearGradient',
                        colors: [
                            { offset: 0, color: 'inherit', opacity: 0.4 },
                            { offset: 100, color: 'inherit', opacity: 0 }
                        ]
                    }
                ]}
                fill={[{ match: '*', id: 'gradient' }]}
            />
        );
    };

    const displayTitle = title || {
        line: 'Revenue Trend',
        bar: 'Weekly Activity',
        doughnut: 'Device Distribution',
        pie: 'Device Distribution'
    }[chartType];

    const bg = config?.colors?.backgroundColor || 'transparent';

    return (
        <div
            ref={containerRef}
            className="h-full w-full flex flex-col overflow-hidden"
            style={{
                backgroundColor: bg
            }}
        >
            {showTitle && (
                <div className="px-4 pt-3 pb-2 shrink-0">
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">{displayTitle}</h3>
                </div>
            )}
            <div className="flex-1 relative min-h-0 min-w-0">
                {renderChart()}
            </div>
        </div>
    );
}
