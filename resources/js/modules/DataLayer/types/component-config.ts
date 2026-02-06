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
  currencyCode?: string; // Optional display currency (e.g., 'MYR')
  // Column mappings (letter or header name)
  labelColumn?: string;
  valueColumn?: string;
  // Optional filtering
  filterColumn?: string;
  filterOperator?: 'equals' | 'contains' | 'greater' | 'less' | 'date-range';
  filterValue?: string;
  filterStartDate?: string;
  filterEndDate?: string;
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
  /** The chart type this source was originally created for (informational only) */
  sourceChartType?: string;
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
  decimals?: number; // Explicit decimal places for formatting
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
  swapAxes?: boolean;

  // Data transformation
  aggregation?: AggregationType;
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: SortOrder;
  limit?: number;

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
  barRatio?: number; // 0-1, ratio of bar width to category width

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
  tension?: number;
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

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export type FontStyle = 'normal' | 'italic';

export type TextDecoration = 'none' | 'underline' | 'line-through';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export type LineHeight = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider';

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export type FontFamily = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'montserrat' | 'source-sans-pro' | 'nunito' | 'raleway' | 'ubuntu' | 'system-ui' | 'serif' | 'mono';

export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface TextConfig {
  text?: string;
  fontFamily?: FontFamily;
  fontSize?: FontSize;
  fontSizePx?: number; // Custom px value (overrides fontSize preset)
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textDecoration?: TextDecoration;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  color?: string;
  lineHeight?: LineHeight;
  letterSpacing?: LetterSpacing;
  textTransform?: TextTransform;
  opacity?: number; // 0-100
  // Data binding (optional - can bind to a cell value)
  dataSource?: DataSource;
  dataField?: string; // Which field to display
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
// Gauge Chart Component Configuration
// ============================================================================

export interface GaugeChartConfig {
  dataSource: DataSource;
  valueField?: string;
  min?: number;
  max?: number;
  aggregation?: AggregationType;
  formatType?: 'number' | 'currency' | 'percent';
  currencyCode?: string;
  colors?: { primary?: string; track?: string };
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
}

// ============================================================================
// Image Component Configuration
// ============================================================================

export interface ImageConfig {
  src?: string;
  alt?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  borderRadius?: number;
  opacity?: number;
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
  | TextConfig
  | KpiConfig
  | GaugeChartConfig
  | ImageConfig
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
  | 'column-picker'
  | 'typography'      // Figma-style typography panel
  | 'font-picker'     // Font family dropdown
  | 'alignment-icons' // Icon toggle group for alignment
  | 'style-toggles'   // B/I/U/S style buttons
  | 'color-fill'      // Color with opacity
  | 'multi-select'    // Select multiple options
  | 'table-columns';  // Table column configuration

export interface ConfigFieldSchema {
  key: string;
  label: string;
  type: FieldType;
  defaultValue?: unknown;
  description?: string;
  group?: string; // For grouping in UI (e.g., 'Data', 'Display', 'Style')
  hidden?: boolean; // Hide field from UI (use default value instead)

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
  swapAxes: false,
  sortBy: 'none',
  sortOrder: 'desc',
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
  barRatio: 0.8,
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
  showLegend: false,
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
  showLegend: false,
  legendPosition: 'bottom',
  showTooltip: true,
  enableAnimation: true,
  barOpacity: 1,
  lineOpacity: 1,
  tension: 0.4,
  showPoints: true,
  barRatio: 0.6,
  aggregation: 'sum',
  leftAxis: { showGridLines: true },
  rightAxis: { showGridLines: false },
};

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  text: 'Text',
  fontSize: 'base',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  align: 'left',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  textTransform: 'none',
  opacity: 100,
};

export const DEFAULT_KPI_CONFIG: KpiConfig = {
  dataSource: { type: 'static' },
  title: 'Metric',
  decimals: 0,
  showTrend: false,
  aggregation: 'sum',
  formatType: 'number',
};

export const DEFAULT_GAUGE_CHART_CONFIG: GaugeChartConfig = {
  dataSource: { type: 'static' },
  min: 0,
  max: 100,
  aggregation: 'sum',
  formatType: 'number',
  showValue: true,
  showLabel: true,
  label: 'Value',
  colors: { primary: '#3b82f6', track: '#e5e7eb' },
};

export const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  src: '',
  alt: '',
  objectFit: 'contain',
  borderRadius: 0,
  opacity: 100,
};

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  dataSource: { type: 'static' },
  columns: [],
  showTitle: false,
  showHeader: true,
  striped: false,
  bordered: false,
  compact: false,
  pageSize: 10,
  showPagination: false,
  sortable: false,
  filterable: false,
  searchable: false,
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
    'chart-gauge': DEFAULT_GAUGE_CHART_CONFIG,
    'text': DEFAULT_TEXT_CONFIG,
    'heading': DEFAULT_TEXT_CONFIG, // Legacy alias -> text
    'kpi': DEFAULT_KPI_CONFIG,
    'image': DEFAULT_IMAGE_CONFIG,
    'table': DEFAULT_TABLE_CONFIG,
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
