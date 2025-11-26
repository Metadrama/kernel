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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      backgroundColor: 'hsl(var(--popover))',
      titleColor: 'hsl(var(--popover-foreground))',
      bodyColor: 'hsl(var(--popover-foreground))',
      borderColor: 'hsl(var(--border))',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 10,
        },
      },
    },
    y: {
      grid: {
        color: 'hsl(var(--border) / 0.5)',
      },
      ticks: {
        font: {
          size: 10,
        },
      },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: {
          size: 11,
        },
      },
    },
  },
  cutout: '60%',
};

export default function ChartComponent({ chartType = 'line', title }: ChartComponentProps) {
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
    switch (chartType) {
      case 'bar':
        return <Bar data={MOCK_BAR_DATA} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={MOCK_DOUGHNUT_DATA} options={doughnutOptions} />;
      case 'line':
      default:
        return <Line data={MOCK_LINE_DATA} options={chartOptions} />;
    }
  };

  return (
    <div ref={containerRef} className="h-full w-full p-4 flex flex-col">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="flex-1 min-h-0">
        {renderChart()}
      </div>
    </div>
  );
}
