import type { ComponentCard } from '@/types/dashboard';

export const AVAILABLE_COMPONENTS: ComponentCard[] = [
  // Charts
  {
    id: 'chart-line',
    name: 'Line Chart',
    description: 'Line chart for trend visualization',
    icon: 'BarChart3',
    category: 'components',
    isFavorite: false,
    defaultSize: { w: 60, h: 45 },  // Medium rectangle for charts
  },
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    description: 'Bar chart for comparative data',
    icon: 'BarChart3',
    category: 'components',
    isFavorite: false,
    defaultSize: { w: 60, h: 45 },  // Medium rectangle for charts
  },
  {
    id: 'chart-doughnut',
    name: 'Doughnut Chart',
    description: 'Doughnut chart for proportional data',
    icon: 'BarChart3',
    category: 'components',
    isFavorite: false,
    defaultSize: { w: 40, h: 40 },  // Square for doughnut
  },
  // Text
  {
    id: 'heading',
    name: 'Heading',
    description: 'Editable heading text component',
    icon: 'FileText',
    category: 'components',
    isFavorite: false,
    defaultSize: { w: 90, h: 15 },  // Wide but short for heading
  },
];

// Presets are pre-configured widget layouts
export const AVAILABLE_PRESETS: ComponentCard[] = [
  {
    id: 'preset-analytics',
    name: 'Analytics Dashboard',
    description: 'Pre-built analytics view with charts',
    icon: 'BarChart3',
    category: 'presets',
    isFavorite: false,
  },
];
