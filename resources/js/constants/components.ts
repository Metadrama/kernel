import type { ComponentCard } from '@/types/dashboard';

// Test components organized by subcategory
export const AVAILABLE_COMPONENTS: ComponentCard[] = [
  // Charts
  {
    id: 'chart-line',
    name: 'Line Chart',
    description: 'Line chart for trend visualization',
    icon: 'BarChart3',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
  },
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    description: 'Bar chart for comparative data',
    icon: 'BarChart3',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
  },
  {
    id: 'chart-doughnut',
    name: 'Doughnut Chart',
    description: 'Doughnut chart for proportional data',
    icon: 'BarChart3',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
  },
  // Layout
  {
    id: 'empty-widget',
    name: 'Empty Card',
    description: 'Blank widget container to drop components into later',
    icon: 'LayoutTemplate',
    category: 'test-components',
    subcategory: 'layout',
    isFavorite: false,
  },
  // Text
  {
    id: 'heading',
    name: 'Heading',
    description: 'Editable heading text component',
    icon: 'FileText',
    category: 'test-components',
    subcategory: 'text',
    isFavorite: false,
  },
];
