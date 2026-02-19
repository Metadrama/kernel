import {
    BarChart3,
    Type,
    PieChart,
    Activity,
    Table as TableIcon,
    List,
    TrendingUp,
    Layout
} from 'lucide-react';
import ChartComponent from './ChartComponent';
// import ChartLegendComponent from './ChartLegendComponent';
import {
    DEFAULT_BAR_CHART_CONFIG,
    DEFAULT_LINE_CHART_CONFIG,
    DEFAULT_DOUGHNUT_CHART_CONFIG,
    DEFAULT_HEADING_CONFIG,
    DEFAULT_KPI_CONFIG,
    // DEFAULT_TABLE_CONFIG // removed for now
} from '@/types/component-config';

// Registry of available components for the builder
export const COMPONENT_REGISTRY = {
    'chart-line': {
        name: 'Line Chart',
        icon: Activity,
        component: ChartComponent,
        defaultConfig: DEFAULT_LINE_CHART_CONFIG,
    },
    'chart-bar': {
        name: 'Bar Chart',
        icon: BarChart3,
        component: ChartComponent,
        defaultConfig: DEFAULT_BAR_CHART_CONFIG,
    },
    'chart-doughnut': {
        name: 'Doughnut Chart',
        icon: PieChart,
        component: ChartComponent,
        defaultConfig: DEFAULT_DOUGHNUT_CHART_CONFIG,
    },
    'heading': {
        name: 'Heading',
        icon: Type,
        // component: HeadingComponent, // Placeholder
        defaultConfig: DEFAULT_HEADING_CONFIG,
    },
    'kpi': {
        name: 'Metric / KPI',
        icon: TrendingUp,
        // component: KpiComponent, // Placeholder
        defaultConfig: DEFAULT_KPI_CONFIG,
    }
};

export const getComponent = (type: string) => {
    // @ts-ignore
    return COMPONENT_REGISTRY[type]?.component || null;
};

export const isComponentRegistered = (type: string) => {
    return type in COMPONENT_REGISTRY;
};
