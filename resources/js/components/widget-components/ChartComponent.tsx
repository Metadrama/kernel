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

interface ChartComponentProps {
  chartType?: 'line' | 'bar' | 'doughnut';
  title?: string;
}

interface ChartComponentConfigProps {
  config?: Partial<ChartConfig> & {
    chartType?: 'line' | 'bar' | 'doughnut';
    title?: string;
    showTitle?: boolean;
    showLegend?: boolean;
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
        callback: function(value: number | string) {
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
    sortOrder: (config as BarChartConfig | DoughnutChartConfig)?.sortOrder,
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

  // Build Chart.js data object
  const lineBarData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        label: title || (chartType === 'line' ? 'Revenue' : 'Value'),
        data: chartData.values,
        borderColor: config?.colors?.primary || 'hsl(var(--primary))',
        backgroundColor: chartType === 'line' 
          ? (config?.colors?.primary || 'hsl(var(--primary))').replace(')', ' / 0.1)')
          : (config?.colors?.primary || 'hsl(var(--primary) / 0.8)'),
        fill: chartType === 'line' ? ((config as LineChartConfig)?.fill ?? true) : undefined,
        tension: chartType === 'line' ? ((config as LineChartConfig)?.tension ?? 0.4) : undefined,
        pointRadius: chartType === 'line' ? ((config as LineChartConfig)?.pointRadius ?? 4) : undefined,
        pointHoverRadius: chartType === 'line' ? 6 : undefined,
        borderRadius: chartType === 'bar' ? ((config as BarChartConfig)?.borderRadius ?? 4) : undefined,
      },
    ],
  }), [chartData, chartType, title, config]);

  const doughnutData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.values,
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--primary) / 0.75)',
          'hsl(var(--primary) / 0.5)',
          'hsl(var(--primary) / 0.35)',
          'hsl(var(--primary) / 0.2)',
          'hsl(var(--muted-foreground) / 0.3)',
        ],
        borderWidth: 0,
      },
    ],
  }), [chartData]);

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
