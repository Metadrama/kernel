/**
 * Component Configuration Type System
 * Defines typed schemas for all component configurations
 */

// ============================================================================
// Data Source Types
// ============================================================================

export type DataSourceType = 'static' | 'google-sheets' | 'api';

export interface StaticDataSource {
  type: 'static';
}

export interface GoogleSheetsDataSource {
  type: 'google-sheets';
  spreadsheetId: string;
  sheetName: string;
  range: string;
  // Column mappings (letter or header name)
  labelColumn?: string;
  valueColumn?: string;
  // Optional filtering
  filterColumn?: string;
  filterOperator?: 'equals' | 'contains' | 'greater' | 'less';
  filterValue?: string;
  // Header row handling
  headerRow?: number; // 1-based row number (default: 1)
  dataStartRow?: number; // 1-based row number (default: 2)

  // Label configuration
  labelMode?: 'column' | 'generated';
  generatedLabels?: {
    mode?: 'step' | 'fit'; // 'step' = add interval per row. 'fit' = spread rows between start/end.
    startDate: string;
    endDate?: string; // Required for 'fit' mode
    interval?: 'day' | 'week' | 'month' | 'quarter' | 'year'; // Required for 'step' mode
    count?: number;
    useDateColumn?: string; // Optional: Use actual dates from this column instead of row index
  };

  // Data Aggregation
  aggregation?: 'sum' | 'count' | 'average' | 'min' | 'max' | 'none';
}

export interface ApiDataSource {
  type: 'api';
  endpoint: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  // Response mapping
  dataPath?: string; // JSONPath to data array
  labelField?: string;
  valueField?: string;
}

export type DataSource = StaticDataSource | GoogleSheetsDataSource | ApiDataSource;

// ============================================================================
// Saved Data Source Types
// ============================================================================

export interface SavedDataSource {
  id: string;
  name: string;
  type: 'google-sheets' | 'api';
  config: Omit<GoogleSheetsDataSource, 'type'> | Omit<ApiDataSource, 'type'>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Chart Configuration Types
// ============================================================================

export type ChartType = 'line' | 'bar' | 'doughnut' | 'pie' | 'area' | 'combo';

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export type AggregationType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'none';

export type SortOrder = 'asc' | 'desc' | 'none';

export interface ChartAxisConfig {
  label?: string;
  showGridLines?: boolean;
  min?: number;
  max?: number;
  formatType?: 'number' | 'currency' | 'percent';
  currencyCode?: string; // e.g., 'MYR', 'USD'
}

export interface ChartColorsConfig {
  primary?: string;
  secondary?: string;
  palette?: string[]; // For multi-series or doughnut/pie
  backgroundColor?: string;
}

export interface BaseChartConfig {
  // Data
  dataSource: DataSource;

  // Display
  title?: string;
  showTitle?: boolean;
  showLegend?: boolean;
  legendPosition?: LegendPosition;

  // Interactivity
  showTooltip?: boolean;
  enableAnimation?: boolean;

  // Colors
  colors?: ChartColorsConfig;
}

export interface LineChartConfig extends BaseChartConfig {
  chartType: 'line';

  // Line specific
  tension?: number; // 0 = straight, 0.4 = curved
  fill?: boolean; // Fill area under line
  pointRadius?: number;
  showPoints?: boolean;
  lineWidth?: number;

  // Data transformation
  aggregation?: AggregationType;

  // Axis
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
}

export interface BarChartConfig extends BaseChartConfig {
  chartType: 'bar';

  // Bar specific
  horizontal?: boolean;
  stacked?: boolean;
  borderRadius?: number;
  barThickness?: number | 'flex';

  // Axis
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;

  // Data transformation
  aggregation?: AggregationType;
  groupBy?: string; // Column to group by
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: SortOrder;
  limit?: number; // Top N items
}

export interface DoughnutChartConfig extends BaseChartConfig {
  chartType: 'doughnut';

  // Doughnut specific
  cutout?: string | number; // e.g., '60%' or 60
  rotation?: number; // Starting angle in degrees
  circumference?: number; // Arc span in degrees (360 = full circle)

  // Data transformation
  aggregation?: AggregationType;
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: SortOrder;
  limit?: number;
  showOther?: boolean; // Combine remaining items into "Other" segment

  // Labels
  showDataLabels?: boolean;
  dataLabelPosition?: 'outside' | 'inside';
  dataLabelType?: 'value' | 'percent' | 'label' | 'all';
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
}

export interface ComboChartConfig extends BaseChartConfig {
  chartType: 'combo';

  // Data Column Mapping
  // labelColumn is from dataSource
  barColumn?: string;
  lineColumn?: string;

  // Visuals
  barColor?: string;
  lineColor?: string;
  barOpacity?: number;
  lineOpacity?: number;
  lineTension?: number;
  showPoints?: boolean;

  // Axis - Combo needs explicit left/right control
  leftAxis?: ChartAxisConfig;
  rightAxis?: ChartAxisConfig;

  // Options
  // Note: stacked applies to bars only in this context usually,
  // but let's keep it simple.
  stacked?: boolean;
  barRatio?: number; // 0-1 width

  // Transform
  aggregation?: AggregationType;
  limit?: number;
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: SortOrder;
}

export type ChartConfig = LineChartConfig | BarChartConfig | DoughnutChartConfig | ComboChartConfig;

// ============================================================================
// Text Component Configuration Types
// ============================================================================

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type TextAlign = 'left' | 'center' | 'right';

export interface HeadingConfig {
  text?: string;
  level?: HeadingLevel;
  align?: TextAlign;
  color?: string;
  // Data binding (optional - can bind to a cell value)
  dataSource?: DataSource;
  dataField?: string; // Which field to display
}

export interface TextConfig {
  content?: string;
  align?: TextAlign;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
}

// ============================================================================
// KPI/Metric Component Configuration
// ============================================================================

export interface KpiConfig {
  dataSource: DataSource;
  valueField?: string;

  // Display
  title?: string;
  prefix?: string; // e.g., '$', 'RM'
  suffix?: string; // e.g., '%', 'units'
  decimals?: number;

  // Comparison
  showTrend?: boolean;
  trendField?: string; // Field to compare against
  trendPeriod?: 'day' | 'week' | 'month' | 'year';

  // Formatting
  aggregation?: AggregationType;
  formatType?: 'number' | 'currency' | 'percent';
  currencyCode?: string;

  // Styling
  valueColor?: string;
  trendUpColor?: string;
  trendDownColor?: string;
}

// ============================================================================
// Table Component Configuration
// ============================================================================

export interface TableColumnConfig {
  field: string;
  header: string;
  width?: number | string;
  align?: TextAlign;
  formatType?: 'text' | 'number' | 'currency' | 'date' | 'percent';
  currencyCode?: string;
  sortable?: boolean;
}

export interface TableConfig {
  dataSource: DataSource;
  columns: TableColumnConfig[];

  // Display
  title?: string;
  showTitle?: boolean;
  showHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;

  // Pagination
  pageSize?: number;
  showPagination?: boolean;

  // Features
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
}

// ============================================================================
// Component Config Union Type
// ============================================================================

export type ComponentConfig =
  | ChartConfig
  | HeadingConfig
  | TextConfig
  | KpiConfig
  | TableConfig;

// ============================================================================
// Config Schema Metadata (for building UI dynamically)
// ============================================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'range'
  | 'data-source'
  | 'column-picker';

export interface ConfigFieldSchema {
  key: string;
  label: string;
  type: FieldType;
  defaultValue?: unknown;
  description?: string;
  group?: string; // For grouping in UI (e.g., 'Data', 'Display', 'Style')

  // For select fields
  options?: Array<{ value: string; label: string }>;

  // For number/range fields
  min?: number;
  max?: number;
  step?: number;

  // Component type filtering - only show field for these component types
  appliesTo?: string[];

  // Conditional visibility
  showWhen?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'exists' | 'not-exists';
    value?: unknown;
  };
}

export interface ComponentConfigSchema {
  componentType: string;
  label: string;
  fields: ConfigFieldSchema[];
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_LINE_CHART_CONFIG: LineChartConfig = {
  chartType: 'line',
  dataSource: { type: 'static' },
  showTitle: false,
  showLegend: false,
  legendPosition: 'bottom',
  showTooltip: true,
  enableAnimation: true,
  tension: 0.4,
  fill: true,
  showPoints: true,
  pointRadius: 4,
  xAxis: { showGridLines: false },
  yAxis: { showGridLines: true },
};

export const DEFAULT_BAR_CHART_CONFIG: BarChartConfig = {
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
};

export const DEFAULT_DOUGHNUT_CHART_CONFIG: DoughnutChartConfig = {
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
};

export const DEFAULT_COMBO_CHART_CONFIG: ComboChartConfig = {
  chartType: 'combo',
  dataSource: { type: 'static' },
  showTitle: false,
  showLegend: true,
  legendPosition: 'bottom',
  showTooltip: true,
  enableAnimation: true,
  barOpacity: 1,
  lineOpacity: 1,
  lineTension: 0.4,
  showPoints: true,
  barRatio: 0.6,
  aggregation: 'sum',
  leftAxis: { showGridLines: true },
  rightAxis: { showGridLines: false },
};

export const DEFAULT_HEADING_CONFIG: HeadingConfig = {
  text: 'Heading',
  level: 'h2',
  align: 'left',
};

export const DEFAULT_KPI_CONFIG: KpiConfig = {
  dataSource: { type: 'static' },
  title: 'Metric',
  decimals: 0,
  showTrend: false,
  aggregation: 'sum',
  formatType: 'number',
};

// ============================================================================
// Helper: Get default config by component type
// ============================================================================

export function getDefaultConfig(componentType: string): ComponentConfig | undefined {
  const defaults: Record<string, ComponentConfig> = {
    'chart-line': DEFAULT_LINE_CHART_CONFIG,
    'chart-bar': DEFAULT_BAR_CHART_CONFIG,
    'chart-combo': DEFAULT_COMBO_CHART_CONFIG,
    'chart-doughnut': DEFAULT_DOUGHNUT_CHART_CONFIG,
    'heading': DEFAULT_HEADING_CONFIG,
    'kpi': DEFAULT_KPI_CONFIG,
  };

  return defaults[componentType];
}

// ============================================================================
// Helper: Merge config with defaults
// ============================================================================

export function mergeWithDefaults<T extends ComponentConfig>(
  componentType: string,
  config?: Partial<T>
): T {
  const defaults = getDefaultConfig(componentType) as T | undefined;
  if (!defaults) {
    return config as T;
  }
  return { ...defaults, ...config } as T;
}
