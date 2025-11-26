import { useEffect, useRef } from 'react';
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

// Mock data for demonstration
const MOCK_LINE_DATA = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Revenue',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 35000],
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
};

const MOCK_BAR_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Active Users',
      data: [650, 590, 800, 810, 560, 550, 400],
      backgroundColor: 'hsl(var(--primary) / 0.8)',
      borderRadius: 4,
    },
  ],
};

const MOCK_DOUGHNUT_DATA = {
  labels: ['Desktop', 'Mobile', 'Tablet'],
  datasets: [
    {
      data: [55, 35, 10],
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--primary) / 0.6)',
        'hsl(var(--primary) / 0.3)',
      ],
      borderWidth: 0,
    },
  ],
};

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

interface ChartComponentConfigProps {
  config?: {
    chartType?: 'line' | 'bar' | 'doughnut';
    title?: string;
    showTitle?: boolean;
    showLegend?: boolean;
  };
}

export default function ChartComponent({ config }: ChartComponentConfigProps) {
  const chartType = config?.chartType || 'line';
  const title = config?.title;
  const showTitle = config?.showTitle ?? false;  // Default: no title
  const showLegend = config?.showLegend ?? false;  // Default: no legend
  const containerRef = useRef<HTMLDivElement>(null);

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

  const renderChart = () => {
    const options = chartType === 'doughnut' 
      ? getDoughnutOptions(showLegend)
      : getChartOptions(showLegend);
      
    switch (chartType) {
      case 'bar':
        return <Bar data={MOCK_BAR_DATA} options={options} />;
      case 'doughnut':
        return <Doughnut data={MOCK_DOUGHNUT_DATA} options={options} />;
      case 'line':
      default:
        return <Line data={MOCK_LINE_DATA} options={options} />;
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
