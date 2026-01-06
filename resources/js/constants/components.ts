import type { ComponentCard } from '@/features/dashboard/types/dashboard';

// Unified list of draggable components
export const AVAILABLE_COMPONENTS: ComponentCard[] = [
    {
        id: 'chart-line',
        name: 'Line Chart',
        description: 'Line chart for trend visualization',
        icon: 'TrendingUp',
        category: 'charts',
        subcategory: 'basic',
        isFavorite: true,
    },
    {
        id: 'chart-bar',
        name: 'Bar Chart',
        description: 'Bar chart for categorical comparison',
        icon: 'BarChart3',
        category: 'charts',
        subcategory: 'basic',
    },
    {
        id: 'chart-combo',
        name: 'Combo Chart',
        description: 'Dual-axis bar and line chart',
        icon: 'BarChart4',
        category: 'charts',
        subcategory: 'advanced',
    },
    {
        id: 'chart-doughnut',
        name: 'Doughnut Chart',
        description: 'Circular chart for proportions',
        icon: 'PieChart',
        category: 'charts',
        subcategory: 'basic',
    },
    {
        id: 'text',
        name: 'Text',
        description: 'Rich text block with full formatting options',
        icon: 'Type',
        category: 'typography',
        subcategory: 'basic',
    },
    {
        id: 'chart-legend',
        name: 'Legend',
        description: 'Legend for chart datasets',
        icon: 'List',
        category: 'charts',
        subcategory: 'helper',
    },
];

