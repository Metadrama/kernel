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

// ... (color palettes)

// ...



// Vibrant color palettes for charts
const COLOR_PALETTES = {
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
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Show error state
    if (useGoogleSheets && error) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-xs text-destructive text-center">{error}</p>
        </div>
      );
    }

    const colors = getChartColors(nivoData.length, config?.colorPalette);

    // Common theme
    const theme = {
      text: { fill: 'hsl(var(--foreground))', fontSize: 11 },
      tooltip: {
        container: {
          background: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          fontSize: 12,
          borderRadius: 6,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          padding: '8px 12px',
          border: '1px solid hsl(var(--border))'
        }
      },
      axis: {
        ticks: {
          text: { fill: 'hsl(var(--muted-foreground))' },
          line: { stroke: 'hsl(var(--border))' }
        },
        legend: { text: { fill: 'hsl(var(--foreground))' } }
      },
      grid: {
        line: { stroke: 'hsl(var(--border) / 0.2)', strokeDasharray: '4 4' }
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
          // Use minimal margins if spider labels are off to maximize chart size
          margin={isSpider
            ? { top: 40, right: 80, bottom: 40, left: 80 }
            : { top: 20, right: 20, bottom: 20, left: 20 }
          }
          innerRadius={dConfig?.innerRadius ?? 0.6}
          padAngle={dConfig?.padAngle ?? 0.7}
          cornerRadius={dConfig?.cornerRadius ?? 3}
          activeOuterRadiusOffset={8}
          colors={colors}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          // Spider Labels (ArcLinkLabels)
          enableArcLinkLabels={isSpider}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="hsl(var(--foreground))"
          arcLinkLabelsThickness={1}
          arcLinkLabelsColor={{ from: 'color' }}
          // Inner Labels (ArcLabels)
          enableArcLabels={showLabels && pos === 'inside'}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          theme={theme}
          animate={true}
          motionConfig="wobbly"
        />
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveBar
          data={nivoData.bar}
          keys={['value']}
          indexBy="label"
          margin={{ top: 20, right: 10, bottom: 40, left: 40 }}
          padding={0.3}
          colors={colors}
          theme={theme}
          borderRadius={4}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
          }}
          enableGridY={true}
          animate={true}
          motionConfig="gentle"
        />
      );
    }

    return (
      <ResponsiveLine
        data={nivoData.line}
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        colors={colors}
        theme={theme}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        useMesh={true}
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 10,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
        }}
        animate={true}
        motionConfig="gentle"
      />
    );
  };

  const displayTitle = title || {
    line: 'Revenue Trend',
    bar: 'Weekly Activity',
    doughnut: 'Device Distribution',
  }[chartType];

  // Apply chart scale (default 1)
  // We use padding on the container to simulate scaling down.
  // Scale 1 = 0 padding. Scale 0.5 = 25% padding on each side?
  // Let's us a simple calc for padding.
  const scale = (config as any)?.chartScale ?? 1;
  const paddingPct = (1 - scale) * 20; // 0 to 10% padding roughly? No, max scale 0.5 means half size.
  // if scale is 0.5, we want chart to be half size.
  // padding = (1 - scale) * 50 / 2?? No.
  // flex-1 container.
  // Let's use CSS padding.
  const scalePadding = `${(1 - scale) * 100 / 2}%`;

  const bg = config?.colors?.backgroundColor || 'transparent';

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex flex-col overflow-hidden transition-all duration-300"
      style={{
        padding: showTitle ? '12px' : '8px',
        backgroundColor: bg
      }}
    >
      {showTitle && (
        <h3 className="text-xs font-medium text-muted-foreground mb-2 shrink-0">{displayTitle}</h3>
      )}
      <div
        className="flex-1 min-h-0 min-w-0"
        style={{ padding: scalePadding }}
      >
        {renderChart()}
      </div>
    </div>
  );
}
