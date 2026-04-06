import type { ComponentCard } from '@/types/dashboard';

export interface ComponentSize {
  width: number;
  height: number;
}

export interface ComponentCatalogEntry extends ComponentCard {
  rendererType?: string;
  configSchemaType?: string;
  supportsConfiguration?: boolean;
  supportsDataSource?: boolean;
  defaultConfig?: Record<string, unknown>;
  defaultSize: ComponentSize;
  minSize: ComponentSize;
  maxSize: ComponentSize | null;
  aspectRatio: number | null;
}

export const COMPONENT_CATALOG: ComponentCatalogEntry[] = [
  {
    id: 'chart-line',
    name: 'Line Chart',
    description: 'Line chart for trend visualization',
    icon: 'BarChart3',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
    rendererType: 'chart-line',
    configSchemaType: 'chart-line',
    supportsConfiguration: true,
    supportsDataSource: true,
    defaultConfig: {
      chartType: 'line',
      dataSource: { type: 'static' },
      showTitle: false,
      showLegend: false,
      legendPosition: 'bottom',
      showTooltip: true,
      enableAnimation: true,
      tension: 0,
      fill: true,
      showPoints: true,
      pointRadius: 4,
      xAxis: { showGridLines: false },
      yAxis: { showGridLines: true },
    },
    defaultSize: { width: 400, height: 250 },
    minSize: { width: 200, height: 150 },
    maxSize: null,
    aspectRatio: null,
  },
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    description: 'Bar chart for comparative data',
    icon: 'BarChart3',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
    rendererType: 'chart-bar',
    configSchemaType: 'chart-bar',
    supportsConfiguration: true,
    supportsDataSource: true,
    defaultConfig: {
      chartType: 'bar',
      dataSource: { type: 'static' },
      showTitle: false,
      showLegend: false,
      legendPosition: 'bottom',
      showTooltip: true,
      enableAnimation: true,
      horizontal: false,
      stacked: false,
      borderRadius: 4,
      aggregation: 'sum',
      sortBy: 'none',
      sortOrder: 'desc',
      xAxis: { showGridLines: false },
      yAxis: { showGridLines: true },
    },
    defaultSize: { width: 400, height: 250 },
    minSize: { width: 200, height: 150 },
    maxSize: null,
    aspectRatio: null,
  },
  {
    id: 'chart-doughnut',
    name: 'Doughnut Chart',
    description: 'Doughnut chart for proportional data',
    icon: 'BarChart3',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
    rendererType: 'chart-doughnut',
    configSchemaType: 'chart-doughnut',
    supportsConfiguration: true,
    supportsDataSource: true,
    defaultConfig: {
      chartType: 'doughnut',
      dataSource: { type: 'static' },
      showTitle: false,
      showLegend: true,
      legendPosition: 'bottom',
      showTooltip: true,
      enableAnimation: true,
      cutout: '60%',
      aggregation: 'sum',
      sortBy: 'value',
      sortOrder: 'desc',
      limit: 5,
      showOther: true,
    },
    defaultSize: { width: 280, height: 280 },
    minSize: { width: 150, height: 150 },
    maxSize: null,
    aspectRatio: 1,
  },
  {
    id: 'chart-legend',
    name: 'Chart Legend',
    description: 'Standalone legend for charts',
    icon: 'List',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
    rendererType: 'chart-legend',
    configSchemaType: 'chart-legend',
    supportsConfiguration: true,
    supportsDataSource: true,
    defaultSize: { width: 280, height: 200 },
    minSize: { width: 80, height: 60 },
    maxSize: null,
    aspectRatio: null,
  },
  {
    id: 'empty-widget',
    name: 'Empty Card',
    description: 'Blank widget container to drop components into later',
    icon: 'LayoutTemplate',
    category: 'test-components',
    subcategory: 'layout',
    isFavorite: false,
    supportsConfiguration: false,
    supportsDataSource: false,
    defaultSize: { width: 280, height: 200 },
    minSize: { width: 80, height: 60 },
    maxSize: null,
    aspectRatio: null,
  },
  {
    id: 'heading',
    name: 'Heading',
    description: 'Editable heading text component',
    icon: 'FileText',
    category: 'test-components',
    subcategory: 'text',
    isFavorite: false,
    rendererType: 'heading',
    configSchemaType: 'heading',
    supportsConfiguration: true,
    supportsDataSource: false,
    defaultConfig: {
      text: 'Heading',
      level: 'h2',
      align: 'left',
    },
    defaultSize: { width: 300, height: 48 },
    minSize: { width: 80, height: 32 },
    maxSize: { width: 800, height: 120 },
    aspectRatio: null,
  },
  {
    id: 'kpi',
    name: 'KPI Metric',
    description: 'Single metric value with optional trend',
    icon: 'Database',
    category: 'test-components',
    subcategory: 'chart',
    isFavorite: false,
    rendererType: 'kpi',
    configSchemaType: 'kpi',
    supportsConfiguration: true,
    supportsDataSource: true,
    defaultConfig: {
      dataSource: { type: 'static' },
      title: 'Metric',
      decimals: 0,
      showTrend: false,
      aggregation: 'sum',
      formatType: 'number',
    },
    defaultSize: { width: 180, height: 120 },
    minSize: { width: 100, height: 80 },
    maxSize: { width: 400, height: 300 },
    aspectRatio: null,
  },
  {
    id: 'default',
    name: 'Default',
    description: 'Fallback component metadata',
    icon: 'Layers',
    category: 'internal',
    subcategory: 'system',
    isFavorite: false,
    supportsConfiguration: false,
    supportsDataSource: false,
    defaultSize: { width: 280, height: 200 },
    minSize: { width: 80, height: 60 },
    maxSize: null,
    aspectRatio: null,
  },
];

export const COMPONENT_CARD_CATALOG: ComponentCard[] = COMPONENT_CATALOG.filter((component) => component.id !== 'default').map(({ defaultSize, minSize, maxSize, aspectRatio, defaultConfig, rendererType, configSchemaType, supportsConfiguration, supportsDataSource, ...card }) => card);

export const COMPONENT_CATALOG_BY_ID: Record<string, ComponentCatalogEntry> = COMPONENT_CATALOG.reduce((acc, component) => {
  acc[component.id] = component;
  return acc;
}, {} as Record<string, ComponentCatalogEntry>);

export function getComponentCatalogEntry(componentType: string): ComponentCatalogEntry | undefined {
  return COMPONENT_CATALOG_BY_ID[componentType] || COMPONENT_CATALOG_BY_ID.default;
}

export function getRenderableComponentEntries(): ComponentCatalogEntry[] {
  return COMPONENT_CATALOG.filter((component) => Boolean(component.rendererType));
}

export function validateComponentCatalog(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const entry of COMPONENT_CATALOG) {
    if (seen.has(entry.id)) {
      errors.push(`Duplicate component id: ${entry.id}`);
    }
    seen.add(entry.id);
  }

  if (!COMPONENT_CATALOG_BY_ID.default) {
    errors.push('Missing fallback catalog entry with id: default');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
