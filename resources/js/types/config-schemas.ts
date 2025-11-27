/**
 * Config Schema Definitions for each component type
 * Used to dynamically render configuration UI panels
 */

import type { ConfigFieldSchema, ComponentConfigSchema } from './component-config';

// ============================================================================
// Chart Config Schemas
// ============================================================================

const DATA_SOURCE_FIELD: ConfigFieldSchema = {
  key: 'dataSource',
  label: 'Data Source',
  type: 'data-source',
  group: 'Data',
  description: 'Select where the chart data comes from',
};

const COMMON_DISPLAY_FIELDS: ConfigFieldSchema[] = [
  {
    key: 'title',
    label: 'Title',
    type: 'text',
    group: 'Display',
    description: 'Chart title text',
  },
  {
    key: 'showTitle',
    label: 'Show Title',
    type: 'boolean',
    defaultValue: false,
    group: 'Display',
  },
  {
    key: 'showLegend',
    label: 'Show Legend',
    type: 'boolean',
    defaultValue: false,
    group: 'Display',
  },
  {
    key: 'legendPosition',
    label: 'Legend Position',
    type: 'select',
    defaultValue: 'bottom',
    group: 'Display',
    options: [
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ],
    showWhen: { field: 'showLegend', operator: 'equals', value: true },
  },
  {
    key: 'showTooltip',
    label: 'Show Tooltip',
    type: 'boolean',
    defaultValue: true,
    group: 'Display',
  },
];

const COLOR_FIELDS: ConfigFieldSchema[] = [
  {
    key: 'colorPalette',
    label: 'Color Palette',
    type: 'select',
    defaultValue: 'vibrant',
    group: 'Style',
    options: [
      { value: 'vibrant', label: 'Vibrant' },
      { value: 'pastel', label: 'Pastel' },
      { value: 'cool', label: 'Cool Tones' },
      { value: 'warm', label: 'Warm Tones' },
    ],
  },
  {
    key: 'colors.primary',
    label: 'Primary Color',
    type: 'color',
    defaultValue: '#3b82f6',
    group: 'Style',
    description: 'Override primary color (for line charts)',
  },
  {
    key: 'colors.backgroundColor',
    label: 'Background',
    type: 'color',
    defaultValue: 'transparent',
    group: 'Style',
  },
];

export const LINE_CHART_SCHEMA: ComponentConfigSchema = {
  componentType: 'chart-line',
  label: 'Line Chart',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'dataSource.labelColumn',
      label: 'Label Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for X-axis labels',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.valueColumn',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for Y-axis values',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    ...COMMON_DISPLAY_FIELDS,
    {
      key: 'tension',
      label: 'Line Smoothing',
      type: 'range',
      defaultValue: 0.4,
      min: 0,
      max: 1,
      step: 0.1,
      group: 'Style',
      description: '0 = straight lines, 1 = very curved',
    },
    {
      key: 'fill',
      label: 'Fill Area',
      type: 'boolean',
      defaultValue: true,
      group: 'Style',
    },
    {
      key: 'showPoints',
      label: 'Show Points',
      type: 'boolean',
      defaultValue: true,
      group: 'Style',
    },
    {
      key: 'pointRadius',
      label: 'Point Size',
      type: 'range',
      defaultValue: 4,
      min: 0,
      max: 10,
      step: 1,
      group: 'Style',
      showWhen: { field: 'showPoints', operator: 'equals', value: true },
    },
    ...COLOR_FIELDS,
    {
      key: 'xAxis.showGridLines',
      label: 'X Grid Lines',
      type: 'boolean',
      defaultValue: false,
      group: 'Axis',
    },
    {
      key: 'yAxis.showGridLines',
      label: 'Y Grid Lines',
      type: 'boolean',
      defaultValue: true,
      group: 'Axis',
    },
    {
      key: 'xAxis.label',
      label: 'X Axis Label',
      type: 'text',
      group: 'Axis',
    },
    {
      key: 'yAxis.label',
      label: 'Y Axis Label',
      type: 'text',
      group: 'Axis',
    },
  ],
};

export const BAR_CHART_SCHEMA: ComponentConfigSchema = {
  componentType: 'chart-bar',
  label: 'Bar Chart',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'dataSource.labelColumn',
      label: 'Category Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for bar labels (e.g., Vendor Name)',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.valueColumn',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for bar values (e.g., Total Amount)',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.filterColumn',
      label: 'Filter Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Optional: Filter data by this column',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.filterValue',
      label: 'Filter Value',
      type: 'text',
      group: 'Data',
      description: 'Value to filter by',
      showWhen: { field: 'dataSource.filterColumn', operator: 'exists' },
    },
    ...COMMON_DISPLAY_FIELDS,
    {
      key: 'horizontal',
      label: 'Horizontal Bars',
      type: 'boolean',
      defaultValue: false,
      group: 'Style',
    },
    {
      key: 'stacked',
      label: 'Stacked Bars',
      type: 'boolean',
      defaultValue: false,
      group: 'Style',
    },
    {
      key: 'borderRadius',
      label: 'Bar Roundness',
      type: 'range',
      defaultValue: 4,
      min: 0,
      max: 20,
      step: 1,
      group: 'Style',
    },
    ...COLOR_FIELDS,
    {
      key: 'aggregation',
      label: 'Aggregation',
      type: 'select',
      defaultValue: 'sum',
      group: 'Transform',
      options: [
        { value: 'sum', label: 'Sum' },
        { value: 'count', label: 'Count' },
        { value: 'average', label: 'Average' },
        { value: 'min', label: 'Minimum' },
        { value: 'max', label: 'Maximum' },
        { value: 'none', label: 'None (first value)' },
      ],
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      type: 'select',
      defaultValue: 'none',
      group: 'Transform',
      options: [
        { value: 'none', label: 'Original Order' },
        { value: 'label', label: 'Label (A-Z)' },
        { value: 'value', label: 'Value' },
      ],
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'select',
      defaultValue: 'desc',
      group: 'Transform',
      options: [
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' },
      ],
      showWhen: { field: 'sortBy', operator: 'not-equals', value: 'none' },
    },
    {
      key: 'limit',
      label: 'Show Top N',
      type: 'number',
      min: 1,
      max: 100,
      group: 'Transform',
      description: 'Limit to top N items (leave empty for all)',
    },
    {
      key: 'xAxis.showGridLines',
      label: 'X Grid Lines',
      type: 'boolean',
      defaultValue: false,
      group: 'Axis',
    },
    {
      key: 'yAxis.showGridLines',
      label: 'Y Grid Lines',
      type: 'boolean',
      defaultValue: true,
      group: 'Axis',
    },
    {
      key: 'yAxis.formatType',
      label: 'Value Format',
      type: 'select',
      defaultValue: 'number',
      group: 'Axis',
      options: [
        { value: 'number', label: 'Number' },
        { value: 'currency', label: 'Currency' },
        { value: 'percent', label: 'Percentage' },
      ],
    },
    {
      key: 'yAxis.currencyCode',
      label: 'Currency',
      type: 'select',
      defaultValue: 'MYR',
      group: 'Axis',
      options: [
        { value: 'MYR', label: 'MYR (RM)' },
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
      ],
      showWhen: { field: 'yAxis.formatType', operator: 'equals', value: 'currency' },
    },
  ],
};

export const DOUGHNUT_CHART_SCHEMA: ComponentConfigSchema = {
  componentType: 'chart-doughnut',
  label: 'Doughnut Chart',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'dataSource.labelColumn',
      label: 'Category Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for segment labels',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.valueColumn',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for segment values',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    ...COMMON_DISPLAY_FIELDS,
    {
      key: 'cutout',
      label: 'Center Cutout',
      type: 'range',
      defaultValue: 60,
      min: 0,
      max: 90,
      step: 5,
      group: 'Style',
      description: '0 = pie chart, higher = thinner ring',
    },
    ...COLOR_FIELDS,
    {
      key: 'aggregation',
      label: 'Aggregation',
      type: 'select',
      defaultValue: 'sum',
      group: 'Transform',
      options: [
        { value: 'sum', label: 'Sum' },
        { value: 'count', label: 'Count' },
        { value: 'average', label: 'Average' },
      ],
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      type: 'select',
      defaultValue: 'value',
      group: 'Transform',
      options: [
        { value: 'none', label: 'Original Order' },
        { value: 'label', label: 'Label (A-Z)' },
        { value: 'value', label: 'Value' },
      ],
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'select',
      defaultValue: 'desc',
      group: 'Transform',
      options: [
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' },
      ],
      showWhen: { field: 'sortBy', operator: 'not-equals', value: 'none' },
    },
    {
      key: 'limit',
      label: 'Show Top N',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 20,
      group: 'Transform',
      description: 'Number of segments to show',
    },
    {
      key: 'showOther',
      label: 'Show "Other"',
      type: 'boolean',
      defaultValue: true,
      group: 'Transform',
      description: 'Combine remaining items into "Other" segment',
      showWhen: { field: 'limit', operator: 'exists' },
    },
  ],
};

// ============================================================================
// Text Config Schemas
// ============================================================================

export const HEADING_SCHEMA: ComponentConfigSchema = {
  componentType: 'heading',
  label: 'Heading',
  fields: [
    {
      key: 'text',
      label: 'Text',
      type: 'text',
      defaultValue: 'Heading',
      group: 'Content',
    },
    {
      key: 'level',
      label: 'Heading Level',
      type: 'select',
      defaultValue: 'h2',
      group: 'Style',
      options: [
        { value: 'h1', label: 'H1 - Largest' },
        { value: 'h2', label: 'H2' },
        { value: 'h3', label: 'H3' },
        { value: 'h4', label: 'H4' },
        { value: 'h5', label: 'H5' },
        { value: 'h6', label: 'H6 - Smallest' },
      ],
    },
    {
      key: 'align',
      label: 'Alignment',
      type: 'select',
      defaultValue: 'left',
      group: 'Style',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    },
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      group: 'Style',
    },
  ],
};

// ============================================================================
// KPI Config Schema
// ============================================================================

export const KPI_SCHEMA: ComponentConfigSchema = {
  componentType: 'kpi',
  label: 'KPI Metric',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'valueField',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column containing the metric value',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'Metric',
      group: 'Display',
    },
    {
      key: 'aggregation',
      label: 'Aggregation',
      type: 'select',
      defaultValue: 'sum',
      group: 'Data',
      options: [
        { value: 'sum', label: 'Sum' },
        { value: 'count', label: 'Count' },
        { value: 'average', label: 'Average' },
        { value: 'min', label: 'Minimum' },
        { value: 'max', label: 'Maximum' },
      ],
    },
    {
      key: 'formatType',
      label: 'Format',
      type: 'select',
      defaultValue: 'number',
      group: 'Display',
      options: [
        { value: 'number', label: 'Number' },
        { value: 'currency', label: 'Currency' },
        { value: 'percent', label: 'Percentage' },
      ],
    },
    {
      key: 'currencyCode',
      label: 'Currency',
      type: 'select',
      defaultValue: 'MYR',
      group: 'Display',
      options: [
        { value: 'MYR', label: 'MYR (RM)' },
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
      ],
      showWhen: { field: 'formatType', operator: 'equals', value: 'currency' },
    },
    {
      key: 'decimals',
      label: 'Decimal Places',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 4,
      group: 'Display',
    },
    {
      key: 'prefix',
      label: 'Prefix',
      type: 'text',
      group: 'Display',
      description: 'Text before value (e.g., "$")',
    },
    {
      key: 'suffix',
      label: 'Suffix',
      type: 'text',
      group: 'Display',
      description: 'Text after value (e.g., "%")',
    },
    {
      key: 'showTrend',
      label: 'Show Trend',
      type: 'boolean',
      defaultValue: false,
      group: 'Trend',
    },
    {
      key: 'trendField',
      label: 'Compare To Column',
      type: 'column-picker',
      group: 'Trend',
      showWhen: { field: 'showTrend', operator: 'equals', value: true },
    },
    {
      key: 'valueColor',
      label: 'Value Color',
      type: 'color',
      group: 'Style',
    },
    {
      key: 'trendUpColor',
      label: 'Trend Up Color',
      type: 'color',
      defaultValue: '#22c55e',
      group: 'Style',
      showWhen: { field: 'showTrend', operator: 'equals', value: true },
    },
    {
      key: 'trendDownColor',
      label: 'Trend Down Color',
      type: 'color',
      defaultValue: '#ef4444',
      group: 'Style',
      showWhen: { field: 'showTrend', operator: 'equals', value: true },
    },
  ],
};

// ============================================================================
// Schema Registry
// ============================================================================

export const CONFIG_SCHEMAS: Record<string, ComponentConfigSchema> = {
  'chart-line': LINE_CHART_SCHEMA,
  'chart-bar': BAR_CHART_SCHEMA,
  'chart-doughnut': DOUGHNUT_CHART_SCHEMA,
  'heading': HEADING_SCHEMA,
  'kpi': KPI_SCHEMA,
};

export function getConfigSchema(componentType: string): ComponentConfigSchema | undefined {
  return CONFIG_SCHEMAS[componentType];
}

// ============================================================================
// Config Field Groups (for UI organization)
// ============================================================================

export const CONFIG_GROUPS = [
  { id: 'Data', label: 'Data Source', icon: 'Database' },
  { id: 'Display', label: 'Display', icon: 'Eye' },
  { id: 'Transform', label: 'Transform', icon: 'Shuffle' },
  { id: 'Style', label: 'Style', icon: 'Palette' },
  { id: 'Axis', label: 'Axis', icon: 'Grid3x3' },
  { id: 'Content', label: 'Content', icon: 'Type' },
  { id: 'Trend', label: 'Trend', icon: 'TrendingUp' },
] as const;

export type ConfigGroupId = typeof CONFIG_GROUPS[number]['id'];
