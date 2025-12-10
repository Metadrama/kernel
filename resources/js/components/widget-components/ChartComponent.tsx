import { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';
import { useGoogleSheetsData, MOCK_CHART_DATA } from '@/lib/use-google-sheets';
import type {
  ChartConfig,
  LineChartConfig,
  BarChartConfig,
  DoughnutChartConfig,
  GoogleSheetsDataSource
} from '@/types/component-config';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

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

const getChartOptions = (showLegend: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: showLegend,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 8,
        font: {
          size: 10,
        },
      },
    },
    tooltip: {
      backgroundColor: 'hsl(var(--popover))',
      titleColor: 'hsl(var(--popover-foreground))',
      bodyColor: 'hsl(var(--popover-foreground))',
      borderColor: 'hsl(var(--border))',
      borderWidth: 1,
      padding: 8,
      cornerRadius: 6,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 9,
        },
        maxRotation: 0,
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'hsl(var(--border) / 0.5)',
      },
      ticks: {
        font: {
          size: 9,
        },
        maxTicksLimit: 5,
        callback: function (value: number | string) {
          if (typeof value === 'number') {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value;
          }
          return value;
        },
      },
    },
  },
});

const getDoughnutOptions = (showLegend: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: showLegend,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 8,
        font: {
          size: 10,
        },
      },
    },
  },
  cutout: '60%',
});

export default function ChartComponent({ config }: ChartComponentConfigProps) {
  const chartType = config?.chartType || 'line';
  const title = config?.title;
  const showTitle = config?.showTitle ?? false;
  const showLegend = config?.showLegend ?? false;
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

  // Force chart resize when container size changes
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      // Chart.js handles resize automatically with responsive: true
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Determine chart data
  const chartData = useMemo(() => {
    if (useGoogleSheets && sheetsData) {
      return {
        labels: sheetsData.labels,
        values: sheetsData.values,
      };
    }
    // Fall back to mock data
    return MOCK_CHART_DATA[chartType] || MOCK_CHART_DATA.line;
  }, [useGoogleSheets, sheetsData, chartType]);

  // Build Chart.js data object for Line/Bar charts
  const lineBarData = useMemo(() => {
    const palette = config?.colorPalette || 'vibrant';
    const dataCount = chartData.values.length;
    const colors = getChartColors(dataCount, palette);
    const primaryColor = config?.colors?.primary || colors[0];

    return {
      labels: chartData.labels,
      datasets: [
        {
          label: title || (chartType === 'line' ? 'Revenue' : 'Value'),
          data: chartData.values,
          borderColor: chartType === 'bar' ? colors : primaryColor,
          backgroundColor: chartType === 'line'
            ? `${primaryColor}20` // 20 = ~12% opacity in hex
            : colors.map(c => `${c}cc`), // cc = 80% opacity
          fill: chartType === 'line' ? ((config as LineChartConfig)?.fill ?? true) : undefined,
          tension: chartType === 'line' ? ((config as LineChartConfig)?.tension ?? 0.4) : undefined,
          pointRadius: chartType === 'line' ? ((config as LineChartConfig)?.pointRadius ?? 4) : undefined,
          pointHoverRadius: chartType === 'line' ? 6 : undefined,
          pointBackgroundColor: chartType === 'line' ? primaryColor : undefined,
          borderRadius: chartType === 'bar' ? ((config as BarChartConfig)?.borderRadius ?? 4) : undefined,
          borderWidth: chartType === 'bar' ? 0 : 2,
        },
      ],
    };
  }, [chartData, chartType, title, config]);

  const doughnutData = useMemo(() => {
    const palette = config?.colorPalette || 'vibrant';
    const colors = getChartColors(chartData.values.length, palette);

    return {
      labels: chartData.labels,
      datasets: [
        {
          data: chartData.values,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [chartData, config?.colorPalette]);

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

    const options = chartType === 'doughnut'
      ? getDoughnutOptions(showLegend)
      : getChartOptions(showLegend);

    switch (chartType) {
      case 'bar':
        return <Bar data={lineBarData} options={options} />;
      case 'doughnut':
        return <Doughnut data={doughnutData} options={options} />;
      case 'line':
      default:
        return <Line data={lineBarData} options={options} />;
    }
  };

  // Get chart title from config or derive from type
  const displayTitle = title || {
    line: 'Revenue Trend',
    bar: 'Weekly Activity',
    doughnut: 'Device Distribution',
  }[chartType];

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col overflow-hidden" style={{ padding: showTitle ? '12px' : '8px' }}>
      {showTitle && (
        <h3 className="text-xs font-medium text-muted-foreground mb-2 shrink-0">{displayTitle}</h3>
      )}
      <div className="flex-1 min-h-0 min-w-0">
        {renderChart()}
      </div>
    </div>
  );
}
