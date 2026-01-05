import { MOCK_CHART_DATA, useGoogleSheetsData } from '@/lib/use-google-sheets';
import type { BarChartConfig, ChartConfig, ComboChartConfig, DoughnutChartConfig, GoogleSheetsDataSource, LineChartConfig } from '@/types/component-config';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// ============================================================================
// Constants & Helpers
// ============================================================================

const COLOR_PALETTES = {
    vibrant: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#a855f7', '#14b8a6'],
    pastel: ['#c7d2fe', '#ddd6fe', '#fbcfe8', '#fecdd3', '#fed7aa', '#a7f3d0', '#a5f3fc', '#bfdbfe', '#e9d5ff', '#99f6e4'],
    cool: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1', '#0ea5e9', '#a855f7', '#14b8a6', '#2563eb', '#7c3aed', '#0891b2'],
    warm: ['#f59e0b', '#ef4444', '#f97316', '#ec4899', '#eab308', '#dc2626', '#ea580c', '#db2777', '#d97706', '#be123c'],
};

function getChartColors(count: number, paletteKey: keyof typeof COLOR_PALETTES = 'vibrant'): string[] {
    const palette = COLOR_PALETTES[paletteKey] || COLOR_PALETTES.vibrant;
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(palette[i % palette.length]);
    }
    return result;
}

function formatNumber(value: number, options?: { compact?: boolean; decimals?: number; style?: 'currency' | 'percent' | 'decimal'; currency?: string }): string {
    const { compact = false, decimals = 0, style = 'decimal', currency = 'USD' } = options || {};

    // Handle % expressly because Intl.NumberFormat percent expects 0.5 -> 50%
    // But our data usually comes as 50 -> 50%
    if (style === 'percent') {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value) + '%';
    }

    if (compact) {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            style: style === 'currency' ? 'currency' : 'decimal',
            currency,
            maximumFractionDigits: 1,
        }).format(value);
    }

    return new Intl.NumberFormat('en-US', {
        style: style === 'currency' ? 'currency' : 'decimal',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

// ============================================================================
// Component
// ============================================================================

interface ChartComponentProps {
    config: ChartConfig;
    isSelected?: boolean;
}

export default function ChartComponent({ config, isSelected }: ChartComponentProps) {
    // Validate config and provide safe defaults
    const safeConfig = config || { chartType: 'line', dataSource: { type: 'static' } };
    const dataSource = safeConfig.dataSource || { type: 'static' };

    // For Combo charts, we need to know the secondary column
    const secondValueColumn = safeConfig.chartType === 'combo' ? (safeConfig as ComboChartConfig).lineColumn : undefined;

    const {
        data: fetchedData,
        loading,
        error,
    } = useGoogleSheetsData({
        dataSource: (dataSource.type === 'google-sheets') ? dataSource : { type: 'google-sheets', spreadsheetId: '', sheetName: '', range: '' },
        aggregation: (safeConfig as any)?.aggregation,
        sortBy: (safeConfig as BarChartConfig | DoughnutChartConfig)?.sortBy,
        sortOrder: (safeConfig as BarChartConfig | DoughnutChartConfig)?.sortOrder as 'asc' | 'desc' | undefined,
        limit: (safeConfig as BarChartConfig | DoughnutChartConfig)?.limit,
        showOther: (safeConfig as DoughnutChartConfig)?.showOther,
        secondValueColumn
    });

    // Use mock data if static
    const displayData = useMemo(() => {
        if (dataSource.type === 'static') {
            const mock = MOCK_CHART_DATA[safeConfig.chartType === 'combo' ? 'bar' : safeConfig.chartType] || MOCK_CHART_DATA.bar;
            return mock.labels.map((label, i) => ({
                label,
                value: mock.values[i],
                secondaryValue: safeConfig.chartType === 'combo' ? (mock.values[i] * 0.6) : undefined // Fake secondary for combo
            }));
        }

        if (!fetchedData) return [];

        return fetchedData.labels.map((label, i) => ({
            label,
            value: fetchedData.values[i],
            secondaryValue: fetchedData.secondaryValues?.[i]
        }));
    }, [dataSource.type, safeConfig.chartType, fetchedData]);


    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-xs">Loading data...</span>
            </div>
        );
    }

    if (error && dataSource.type !== 'static') {
        return (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-destructive">
                Error: {error}
            </div>
        );
    }

    if (displayData.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No data available
            </div>
        );
    }

    // Colors
    const palette = (safeConfig.colors?.palette && safeConfig.colors.palette.length > 0)
        ? safeConfig.colors.palette[0] as keyof typeof COLOR_PALETTES
        : (safeConfig as any).colorPalette || 'vibrant';

    const chartColors = getChartColors(displayData.length, palette);
    const primaryColor = safeConfig.colors?.primary || chartColors[0];
    const secondaryColor = safeConfig.colors?.secondary || chartColors[1];

    // Chart Type Specifics
    const isHorizontal = (safeConfig as BarChartConfig).horizontal;

    // Axis Formatters
    const getAxisFormatter = (axisConfig?: { formatType?: string; currencyCode?: string }) => {
        return (value: number) => {
            if (axisConfig?.formatType === 'currency') {
                return formatNumber(value, { compact: true, style: 'currency', currency: axisConfig.currencyCode || 'USD' });
            }
            if (axisConfig?.formatType === 'percent') {
                return formatNumber(value, { style: 'percent' });
            }
            return formatNumber(value, { compact: true });
        };
    };

    const xAxisFormatter = getAxisFormatter((safeConfig as any).xAxis);
    const yAxisFormatter = getAxisFormatter((safeConfig as any).yAxis);
    const rightAxisFormatter = getAxisFormatter((safeConfig as ComboChartConfig).rightAxis);

    // Legend Props
    const getLegendProps = (position: 'top' | 'bottom' | 'left' | 'right' = 'bottom') => {
        switch (position) {
            case 'top': return { verticalAlign: 'top' as const, align: 'center' as const, height: 36 };
            case 'left': return { verticalAlign: 'middle' as const, align: 'left' as const, layout: 'vertical' as const, width: 100 };
            case 'right': return { verticalAlign: 'middle' as const, align: 'right' as const, layout: 'vertical' as const, width: 100 };
            case 'bottom':
            default: return { verticalAlign: 'bottom' as const, align: 'center' as const, height: 36 };
        }
    };

    const legendProps = getLegendProps((safeConfig as any).legendPosition);

    // Common Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm">
                    <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground capitalize">{entry.name}:</span>
                            <span className="font-mono font-medium">
                                {formatNumber(entry.value, { decimals: 0 })}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // ------------------------------------------------------------------------
    // RENDER: Cartesian Charts (Line, Bar, Combo, Area)
    // ------------------------------------------------------------------------
    if (['line', 'bar', 'combo', 'area'].includes(safeConfig.chartType)) {
        const layout = isHorizontal ? 'vertical' : 'horizontal';

        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={displayData}
                    layout={layout}
                    margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />

                    {/* X Axis */}
                    <XAxis
                        dataKey={layout === 'vertical' ? 'value' : 'label'}
                        type={layout === 'vertical' ? 'number' : 'category'}
                        hide={!(safeConfig as any).xAxis?.label && false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        tickFormatter={layout === 'vertical' ? xAxisFormatter : undefined}
                    />

                    {/* Y Axis (Left) */}
                    <YAxis
                        yAxisId="left"
                        dataKey={layout === 'vertical' ? 'label' : 'value'}
                        type={layout === 'vertical' ? 'category' : 'number'}
                        hide={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        width={40}
                        tickFormatter={layout === 'vertical' ? undefined : yAxisFormatter}
                    />

                    {/* Y Axis (Right - Combo Only) */}
                    {safeConfig.chartType === 'combo' && (safeConfig as ComboChartConfig).rightAxis && (
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            hide={!(safeConfig as ComboChartConfig).rightAxis?.showGridLines && !(safeConfig as ComboChartConfig).rightAxis?.label}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={rightAxisFormatter}
                        />
                    )}

                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                    {(safeConfig.showLegend ?? true) && <Legend {...legendProps} wrapperStyle={undefined} />}

                    {/* BAR SERIES */}
                    {(safeConfig.chartType === 'bar' || safeConfig.chartType === 'combo') && (
                        <Bar
                            dataKey="value"
                            name="Value"
                            fill={safeConfig.chartType === 'combo' ? ((safeConfig as ComboChartConfig).barColor || primaryColor) : primaryColor}
                            radius={[(safeConfig as BarChartConfig).borderRadius ?? 4, (safeConfig as BarChartConfig).borderRadius ?? 4, 0, 0]}
                            barSize={(safeConfig as any).barRatio ? (safeConfig as any).barRatio * 40 : 30}
                            stackId={(safeConfig as BarChartConfig).stacked ? "a" : undefined}
                            yAxisId="left"
                        >
                            {/* Individual Colors for Bar Chart only (not combo) */}
                            {safeConfig.chartType === 'bar' && !(safeConfig as BarChartConfig).stacked && displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                        </Bar>
                    )}

                    {/* LINE SERIES */}
                    {(safeConfig.chartType === 'line' || safeConfig.chartType === 'combo') && (
                        <Line
                            type={(safeConfig as any).lineTension > 0 || ((safeConfig as LineChartConfig).tension ?? 0) > 0 ? "monotone" : "linear"}
                            dataKey={safeConfig.chartType === 'combo' ? "secondaryValue" : "value"}
                            name={safeConfig.chartType === 'combo' ? "Trend" : "Value"}
                            stroke={safeConfig.chartType === 'combo' ? ((safeConfig as ComboChartConfig).lineColor || secondaryColor) : primaryColor}
                            strokeWidth={(safeConfig as LineChartConfig).lineWidth || 3}
                            dot={(safeConfig as any).showPoints ?? true ? { r: 4, strokeWidth: 2 } : false}
                            activeDot={{ r: 6 }}
                            yAxisId={safeConfig.chartType === 'combo' ? "right" : "left"}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        );
    }

    // ------------------------------------------------------------------------
    // RENDER: Doughnut / Pie
    // ------------------------------------------------------------------------
    if (safeConfig.chartType === 'doughnut' || (safeConfig.chartType as any) === 'pie') {
        const dConfig = safeConfig as DoughnutChartConfig;
        const innerRadius = safeConfig.chartType === 'doughnut' ? (dConfig.cutout || '60%') : 0;

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, bottom: 20, left: 0, right: 0 }}>
                    <Pie
                        data={displayData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius="80%"
                        paddingAngle={dConfig.padAngle || 2}
                        cornerRadius={dConfig.cornerRadius || 4}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                    >
                        {displayData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    {(safeConfig.showLegend ?? true) && <Legend {...legendProps} />}
                </PieChart>
            </ResponsiveContainer>
        );
    }

    return <div>Unknown Chart Type</div>;
}
