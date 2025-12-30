import type { ComponentCard } from '@/types/dashboard';

// Only "real" component for now
export const AVAILABLE_COMPONENTS: ComponentCard[] = [
    {
        id: 'chart-line',
        name: 'Line Chart',
        description: 'Line chart for trend visualization',
        icon: 'BarChart3',
        category: 'charts',
        subcategory: 'line',
        isFavorite: true,
    },
];
