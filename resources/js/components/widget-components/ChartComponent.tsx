import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
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

// Get colors for a chart based on data count
function getChartColors(count: number, palette: keyof typeof COLOR_PALETTES = 'vibrant'): string[] {
    const colors = COLOR_PALETTES[palette];
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

/**
 * Format number with thousands separators and optional abbreviation
 */
function formatNumber(value: number, options?: { compact?: boolean; decimals?: number }): string {
    const { compact = false, decimals = 0 } = options || {};

    if (compact) {
        // Abbreviate large numbers (K, M, B)
        const absValue = Math.abs(value);
        if (absValue >= 1e9) {
            return (value / 1e9).toFixed(1) + 'B';
        }
        if (absValue >= 1e6) {
            return (value / 1e6).toFixed(1) + 'M';
        }
        if (absValue >= 1e3) {
            return (value / 1e3).toFixed(1) + 'K';
        }
    }

    // Format with thousands separators
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format currency with symbol and thousands separators
 */
function formatCurrency(value: number, currencyCode: string = 'MYR', options?: { compact?: boolean }): string {
    const { compact = false } = options || {};

    const currencySymbols: Record<string, string> = {
        'MYR': 'RM',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
    };

    const symbol = currencySymbols[currencyCode] || currencyCode;

    if (compact) {
        // Abbreviate large numbers
        const absValue = Math.abs(value);
        if (absValue >= 1e9) {
            return symbol + (value / 1e9).toFixed(1) + 'B';
        }
        if (absValue >= 1e6) {
            return symbol + (value / 1e6).toFixed(1) + 'M';
        }
        if (absValue >= 1e3) {
            return symbol + (value / 1e3).toFixed(1) + 'K';
        }
    }

    // Format with thousands separators
    return symbol + ' ' + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

const PortalTooltip = ({ children }: { children: React.ReactNode }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const update = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', update);
        return () => window.removeEventListener('mousemove', update);
    }, []);

    if (pos.x === 0 && pos.y === 0) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            left: pos.x + 12,
            top: pos.y + 12,
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            {children}
        </div>,
        document.body
    );
};

const ChartTooltip = ({ color, title, subtitle }: { color: string; title: React.ReactNode; subtitle?: React.ReactNode }) => {
    return (
        <PortalTooltip>
            <div
                style={{
                    padding: '8px 12px',
                    background: 'var(--card)',
                    color: 'var(--card-foreground)',
                    borderRadius: 6,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    border: '1px solid var(--border)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 4 : 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--foreground)' }}>
                        {title}
                    </span>
                </div>
                {subtitle && (
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                        {subtitle}
                    </div>
                )}
            </div>
        </PortalTooltip>
    );
};

export interface ChartComponentConfigProps {
    config?: Partial<ChartConfig> & {
        chartType?: 'line' | 'bar' | 'doughnut';
        title?: string;
        showTitle?: boolean;
        showLegend?: boolean;
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        colorPalette?: 'vibrant' | 'pastel' | 'cool' | 'warm';
        showTooltip?: boolean;
    };
}

export default function ChartComponent({ config }: ChartComponentConfigProps) {
    const chartType = config?.chartType || 'line';
    const showTitle = config?.showTitle ?? false;
    const title = config?.title;
    const showLegend = config?.showLegend ?? false;
    const legendPosition = config?.legendPosition || 'bottom';
    const showTooltip = config?.showTooltip ?? true;
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 300, height: 200 });

    // Measure container size for responsive margins
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                setContainerSize({ width, height });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Calculate responsive margins based on container size
    const calculateMargin = useCallback((options: {
        hasAxisLabels?: boolean;
        isSpider?: boolean;
    } = {}) => {
        const { width, height } = containerSize;
        const { hasAxisLabels = true, isSpider = false } = options;

        // Base margins as percentage of container (with min/max bounds)
        const baseTop = Math.max(8, Math.min(20, height * 0.04));
        const baseRight = Math.max(8, Math.min(20, width * 0.04));
        const baseBottom = hasAxisLabels ? Math.max(24, Math.min(50, height * 0.08)) : Math.max(8, Math.min(20, height * 0.04));
        const baseLeft = hasAxisLabels ? Math.max(35, Math.min(70, width * 0.12)) : Math.max(8, Math.min(20, width * 0.04));

        // Legend adds proportional space
        const legendAddY = showLegend ? Math.max(20, Math.min(40, height * 0.08)) : 0;
        const legendAddX = showLegend ? Math.max(40, Math.min(80, width * 0.12)) : 0;

        // Spider labels need extra horizontal space
        const spiderAdd = isSpider ? Math.max(30, Math.min(60, width * 0.1)) : 0;

        return {
            top: Math.round(baseTop + (legendPosition === 'top' ? legendAddY : 0)),
            right: Math.round(baseRight + spiderAdd + (legendPosition === 'right' ? legendAddX : 0)),
            bottom: Math.round(baseBottom + (legendPosition === 'bottom' ? legendAddY : 0)),
            left: Math.round(baseLeft + spiderAdd + (legendPosition === 'left' ? legendAddX : 0)),
        };
    }, [containerSize, showLegend, legendPosition]);

    // Check if we should use Google Sheets data
    const dataSource = config?.dataSource;
    const useGoogleSheets = dataSource?.type === 'google-sheets' &&
        (dataSource as GoogleSheetsDataSource).spreadsheetId &&
        (dataSource as GoogleSheetsDataSource).sheetName &&
        (dataSource as GoogleSheetsDataSource).labelColumn &&
        (dataSource as GoogleSheetsDataSource).valueColumn;

    // Fetch Google Sheets data if configured
    const { data: sheetsData, loading, error } = useGoogleSheetsData({
        dataSource: useGoogleSheets
            ? dataSource as GoogleSheetsDataSource
            : { type: 'google-sheets', spreadsheetId: '', sheetName: '', range: '' },
        aggregation: (config as BarChartConfig | DoughnutChartConfig)?.aggregation,
        sortBy: (config as BarChartConfig | DoughnutChartConfig)?.sortBy,
        sortOrder: (config as BarChartConfig | DoughnutChartConfig)?.sortOrder as any,
        limit: (config as BarChartConfig | DoughnutChartConfig)?.limit,
        showOther: (config as DoughnutChartConfig)?.showOther,
    });

    // Determine chart data and transform for Nivo
    const nivoData = useMemo(() => {
        let labels: string[] = [];
        let values: number[] = [];

        if (useGoogleSheets && sheetsData) {
            labels = sheetsData.labels;
            values = sheetsData.values;
        } else {
            const mock = MOCK_CHART_DATA[chartType] || MOCK_CHART_DATA.line;
            labels = mock.labels;
            values = mock.values;
        }

        // Pie Data
        const pie = labels.map((l, i) => ({
            id: l,
            label: l,
            value: values[i] || 0
        }));

        // Bar Data
        const bar = labels.map((l, i) => ({
            label: l,
            value: values[i] || 0
        }));

        // Line Data
        const line = [{
            id: title || 'Data',
            data: labels.map((l, i) => ({
                x: l,
                y: values[i] || 0
            }))
        }];

        return { pie, bar, line, length: labels.length };
    }, [useGoogleSheets, sheetsData, chartType, title]);

    const renderChart = () => {
        // Show loading state
        if (useGoogleSheets && loading) {
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background/50 to-muted/30 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs font-medium text-muted-foreground">Loading data...</p>
                    </div>
                </div>
            );
        }

        // Show error state
        if (useGoogleSheets && error) {
            return (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="text-center max-w-xs">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
                            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-destructive mb-1">Failed to load data</p>
                        <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                </div>
            );
        }

        const colors = getChartColors(nivoData.length, config?.colorPalette);

        // Premium modern theme with better typography and spacing
        const theme = {
            text: {
                fill: 'var(--foreground)',
                fontSize: 11,
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                fontWeight: 500
            },
            tooltip: {
                container: {
                    background: 'var(--card)',
                    color: 'var(--card-foreground)',
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                }
            },
            axis: {
                ticks: {
                    text: {
                        fill: 'var(--muted-foreground)',
                        fontSize: 10,
                        fontWeight: 500
                    },
                    line: { stroke: 'transparent' }
                },
                legend: {
                    text: {
                        fill: 'var(--foreground)',
                        fontSize: 12,
                        fontWeight: 600
                    }
                },
                domain: {
                    line: { stroke: 'var(--border)', strokeWidth: 1, strokeOpacity: 0.5 }
                }
            },
            grid: {
                line: { stroke: 'var(--border)', strokeWidth: 1, strokeOpacity: 0.2 }
            }
        };

        // Helper to get legend config
        const getLegends = (fill: string) => {
            if (!showLegend || legendPosition === 'none') return [];

            const isVertical = legendPosition === 'left' || legendPosition === 'right';
            const anchor = {
                top: 'top',
                bottom: 'bottom',
                left: 'left',
                right: 'right'
            }[legendPosition] as any;

            const direction = isVertical ? 'column' : 'row';
            const translateY = legendPosition === 'top' ? -30 : legendPosition === 'bottom' ? 30 : 0;
            const translateX = legendPosition === 'left' ? -30 : legendPosition === 'right' ? 30 : 0;

            return [
                {
                    anchor,
                    direction,
                    justify: false,
                    translateX,
                    translateY,
                    itemsSpacing: 0,
                    itemWidth: isVertical ? 100 : 80,
                    itemHeight: 20,
                    itemTextColor: 'var(--muted-foreground)',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 10,
                    symbolShape: 'circle',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemTextColor: 'var(--foreground)'
                            }
                        }
                    ]
                }
            ];
        };

        // DOUGHNUT CHART
        if (chartType === 'doughnut') {
            const dConfig = config as DoughnutChartConfig;
            const showLabels = dConfig?.showDataLabels ?? false;
            const pos = dConfig?.dataLabelPosition || 'inside';
            const isSpider = showLabels && pos === 'outside';

            // Calculate margins based on features
            const margin = calculateMargin({ hasAxisLabels: false, isSpider });

            return (
                <ResponsivePie
                    data={nivoData.pie}
                    margin={margin}
                    innerRadius={dConfig?.innerRadius ?? 0.65}
                    padAngle={dConfig?.padAngle ?? 1.2}
                    cornerRadius={dConfig?.cornerRadius ?? 4}
                    activeOuterRadiusOffset={12}
                    activeInnerRadiusOffset={8}
                    colors={colors}
                    borderWidth={0}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    // Spider Labels
                    enableArcLinkLabels={isSpider}
                    arcLinkLabelsSkipAngle={8}
                    arcLinkLabelsTextColor="var(--foreground)"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color', modifiers: [['opacity', 0.5]] }}

                    // Inner Labels
                    enableArcLabels={showLabels && pos === 'inside'}
                    arcLabelsSkipAngle={8}
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
                        <ChartTooltip
                            color={d.color}
                            title={`${d.label}: ${formatNumber(d.value, { decimals: 0 })}`}
                        />
                    ) : undefined}
                    layers={['arcs', 'arcLabels', 'arcLinkLabels', 'legends']}
                    defs={[
                        {
                            id: 'gradient',
                            type: 'linearGradient',
                            colors: [
                                { offset: 0, color: 'inherit' },
                                { offset: 100, color: 'inherit', opacity: 0.8 }
                            ]
                        }
                    ]}
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
                    return formatCurrency(value, currencyCode, { compact: true });
                } else if (formatType === 'percent') {
                    return formatNumber(value, { compact: true }) + '%';
                }
                return formatNumber(value, { compact: true });
            };

            // Tooltip formatter - full precision with separators
            const tooltipFormatter = (value: number) => {
                if (formatType === 'currency') {
                    return formatCurrency(value, currencyCode);
                } else if (formatType === 'percent') {
                    return formatNumber(value, { decimals: 2 }) + '%';
                }
                return formatNumber(value, { decimals: 0 });
            };

            const margin = calculateMargin({ hasAxisLabels: true });

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
                    borderRadius={bConfig?.borderRadius ?? 6}

                    // Axes with formatting
                    axisBottom={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickRotation: 0,
                        legend: bConfig?.xAxis?.label,
                        legendPosition: 'middle',
                        legendOffset: 32,
                        format: isHorizontal ? valueFormatter : undefined,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickRotation: 0,
                        legend: bConfig?.yAxis?.label,
                        legendPosition: 'middle',
                        legendOffset: -50,
                        format: isHorizontal ? undefined : valueFormatter,
                    }}
                    enableGridX={bConfig?.xAxis?.showGridLines ?? false}
                    enableGridY={bConfig?.yAxis?.showGridLines ?? true}
                    enableLabel={false}

                    animate={true}
                    motionConfig="gentle"
                    tooltip={showTooltip ? ({ id, value, color, indexValue }) => (
                        <ChartTooltip
                            color={color}
                            title={`${indexValue}: ${tooltipFormatter(value)}`}
                        />
                    ) : () => null}

                    defs={[
                        {
                            id: 'gradient',
                            type: 'linearGradient',
                            colors: [
                                { offset: 0, color: 'inherit' },
                                { offset: 100, color: 'inherit', opacity: 0.7 }
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
        const axisFormatter = (value: number) => formatNumber(value, { compact: true });

        // Full formatter for tooltip
        const tooltipValueFormatter = (value: number) => formatNumber(value, { decimals: 2 });

        const margin = calculateMargin({ hasAxisLabels: true });

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
                    tickRotation: 0,
                    legend: lConfig?.xAxis?.label,
                    legendOffset: 36,
                    legendPosition: 'middle'
                }}
                axisLeft={{
                    tickSize: 0,
                    tickPadding: 12,
                    tickRotation: 0,
                    legend: lConfig?.yAxis?.label,
                    legendOffset: -50,
                    legendPosition: 'middle',
                    format: axisFormatter,
                }}

                // Area
                enableArea={enableArea}
                areaOpacity={0.1}
                areaBaselineValue={0}

                animate={true}
                motionConfig="gentle"
                enableCrosshair={true}
                crosshairType="cross"

                tooltip={showTooltip ? ({ point }) => (
                    <ChartTooltip
                        color={point.color}
                        title={point.id}
                        subtitle={
                            <>{point.data.xFormatted}: <strong style={{ color: 'var(--foreground)' }}>{tooltipValueFormatter(point.data.y as number)}</strong></>
                        }
                    />
                ) : () => null}

                defs={[
                    {
                        id: 'gradient',
                        type: 'linearGradient',
                        colors: [
                            { offset: 0, color: 'inherit', opacity: 0.3 },
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
    }[chartType];

    const bg = config?.colors?.backgroundColor || 'transparent';

    return (
        <div
            ref={containerRef}
            className="h-full w-full flex flex-col"
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
