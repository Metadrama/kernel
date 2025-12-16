import { useEffect, useRef, useMemo } from 'react';
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

interface ChartComponentProps {
  chartType?: 'line' | 'bar' | 'doughnut';
  title?: string;
}

export interface ChartComponentConfigProps {
  config?: Partial<ChartConfig> & {
    chartType?: 'line' | 'bar' | 'doughnut';
    title?: string;
    showTitle?: boolean;
    showLegend?: boolean;
    colorPalette?: 'vibrant' | 'pastel' | 'cool' | 'warm';
  };
}

export default function ChartComponent({ config }: ChartComponentConfigProps) {
  const chartType = config?.chartType || 'line';
  const showTitle = config?.showTitle ?? false;
  const title = config?.title;
  const containerRef = useRef<HTMLDivElement>(null);

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
        fill: 'hsl(var(--foreground) / 0.7)',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontWeight: 500
      },
      tooltip: {
        container: {
          background: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 0 0 1px hsl(var(--border))',
          padding: '10px 14px',
          border: 'none',
          backdropFilter: 'blur(8px)',
        }
      },
      axis: {
        ticks: {
          text: {
            fill: 'hsl(var(--muted-foreground) / 0.6)',
            fontSize: 10,
            fontWeight: 500
          },
          line: { stroke: 'transparent' }
        },
        legend: {
          text: {
            fill: 'hsl(var(--foreground) / 0.8)',
            fontSize: 12,
            fontWeight: 600
          }
        },
        domain: {
          line: { stroke: 'hsl(var(--border) / 0.3)', strokeWidth: 1 }
        }
      },
      grid: {
        line: { stroke: 'hsl(var(--border) / 0.15)', strokeWidth: 1 }
      }
    };

    if (chartType === 'doughnut') {
      const dConfig = config as DoughnutChartConfig;
      const showLabels = dConfig?.showDataLabels ?? false;
      const pos = dConfig?.dataLabelPosition || 'inside';
      const isSpider = showLabels && pos === 'outside';

      return (
        <ResponsivePie
          data={nivoData.pie}
          margin={isSpider
            ? { top: 30, right: 70, bottom: 30, left: 70 }
            : { top: 10, right: 10, bottom: 10, left: 10 }
          }
          innerRadius={dConfig?.innerRadius ?? 0.65}
          padAngle={dConfig?.padAngle ?? 1.2}
          cornerRadius={dConfig?.cornerRadius ?? 4}
          activeOuterRadiusOffset={12}
          activeInnerRadiusOffset={8}
          colors={colors}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          // Spider Labels (ArcLinkLabels)
          enableArcLinkLabels={isSpider}
          arcLinkLabelsSkipAngle={8}
          arcLinkLabelsTextColor="hsl(var(--foreground) / 0.8)"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color', modifiers: [['opacity', 0.5]] }}
          arcLinkLabelsDiagonalLength={16}
          arcLinkLabelsStraightLength={12}
          // Inner Labels (ArcLabels)
          enableArcLabels={showLabels && pos === 'inside'}
          arcLabelsSkipAngle={8}
          arcLabelsTextColor="white"
          arcLabel={(d) => `${d.value}`}
          theme={theme}
          animate={true}
          motionConfig="wobbly"
          transitionMode="middleAngle"
          // Add subtle glow effect with layers
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

    if (chartType === 'bar') {
      return (
        <ResponsiveBar
          data={nivoData.bar}
          keys={['value']}
          indexBy="label"
          margin={{ top: 10, right: 10, bottom: 35, left: 45 }}
          padding={0.35}
          colors={colors}
          theme={theme}
          borderRadius={6}
          // Add gradient effect
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
          axisBottom={{
            tickSize: 0,
            tickPadding: 12,
            tickRotation: 0,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 12,
            tickRotation: 0,
          }}
          enableGridY={true}
          enableGridX={false}
          enableLabel={false}
          animate={true}
          motionConfig="gentle"
          // Hover effects
          tooltip={({ id, value, color }) => (
            <div
              style={{
                padding: '10px 14px',
                background: 'hsl(var(--popover))',
                borderRadius: 8,
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: 'hsl(var(--foreground))' }}>
                  {id}: {value}
                </span>
              </div>
            </div>
          )}
        />
      );
    }

    // Line chart
    return (
      <ResponsiveLine
        data={nivoData.line}
        margin={{ top: 10, right: 15, bottom: 35, left: 45 }}
        colors={colors}
        theme={theme}
        // Smooth curve
        curve="catmullRom"
        // Enhanced line styling
        lineWidth={3}
        // Point styling
        pointSize={10}
        pointColor="hsl(var(--background))"
        pointBorderWidth={3}
        pointBorderColor={{ from: 'serieColor' }}
        // Active point
        enablePointLabel={false}
        useMesh={true}
        // Grid
        enableGridX={false}
        enableGridY={true}
        // Axes
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          tickRotation: 0,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 12,
          tickRotation: 0,
        }}
        // Area under line with gradient
        enableArea={true}
        areaOpacity={0.1}
        areaBaselineValue={0}
        // Animation
        animate={true}
        motionConfig="gentle"
        // Crosshair
        enableCrosshair={true}
        crosshairType="cross"
        // Enhanced tooltip
        tooltip={({ point }) => (
          <div
            style={{
              padding: '10px 14px',
              background: 'hsl(var(--popover))',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: point.color }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: 'hsl(var(--foreground))' }}>
                {point.id}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              {point.data.xFormatted}: <strong style={{ color: 'hsl(var(--foreground))' }}>{point.data.yFormatted}</strong>
            </div>
          </div>
        )}
        // Gradient definitions
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
      className="absolute inset-0 flex flex-col"
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
