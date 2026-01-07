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
    group: 'Display',
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
    group: 'Display',
    description: 'Override primary color (for line charts)',
    appliesTo: ['chart-line'],
  },
  {
    key: 'colors.backgroundColor',
    label: 'Background',
    type: 'color',
    defaultValue: 'transparent',
    group: 'Display',
  },
];

const AXIS_FORMAT_FIELDS: ConfigFieldSchema[] = [
  {
    key: 'yAxis.formatType',
    label: 'Value Format',
    type: 'select',
    defaultValue: 'number',
    group: 'Settings',
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
    group: 'Settings',
    options: [
      { value: 'MYR', label: 'MYR (RM)' },
      { value: 'USD', label: 'USD ($)' },
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'GBP', label: 'GBP (£)' },
    ],
    showWhen: { field: 'yAxis.formatType', operator: 'equals', value: 'currency' },
  },
];

const COMMON_AXIS_FIELDS: ConfigFieldSchema[] = [
  {
    key: 'xAxis.showGridLines',
    label: 'X Grid Lines',
    type: 'boolean',
    defaultValue: false,
    group: 'Settings',
  },
  {
    key: 'yAxis.showGridLines',
    label: 'Y Grid Lines',
    type: 'boolean',
    defaultValue: true,
    group: 'Settings',
  },
  {
    key: 'xAxis.label',
    label: 'X Axis Label',
    type: 'text',
    group: 'Settings',
  },
  {
    key: 'yAxis.label',
    label: 'Y Axis Label',
    type: 'text',
    group: 'Settings',
  },
  ...AXIS_FORMAT_FIELDS,
];

const COMMON_TRANSFORM_FIELDS: ConfigFieldSchema[] = [
  {
    key: 'sortBy',
    label: 'Sort By',
    type: 'select',
    defaultValue: 'none',
    group: 'Data',
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
    group: 'Data',
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
    group: 'Data',
    description: 'Limit to top N items',
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
      label: 'Curve Smoothing',
      type: 'range',
      defaultValue: 0.4,
      min: 0,
      max: 1,
      step: 0.1,
      group: 'Settings',
      description: '0 = straight lines, 1 = very curved',
      appliesTo: ['chart-line'],
    },
    {
      key: 'lineWidth',
      label: 'Line Thickness',
      type: 'range',
      defaultValue: 3,
      min: 1,
      max: 10,
      step: 1,
      group: 'Settings',
      appliesTo: ['chart-line'],
    },
    {
      key: 'fill',
      label: 'Fill Area',
      type: 'boolean',
      defaultValue: true,
      group: 'Settings',
      appliesTo: ['chart-line'],
    },
    {
      key: 'showPoints',
      label: 'Show Points',
      type: 'boolean',
      defaultValue: true,
      group: 'Settings',
      appliesTo: ['chart-line'],
    },
    {
      key: 'pointRadius',
      label: 'Point Size',
      type: 'range',
      defaultValue: 4,
      min: 0,
      max: 10,
      step: 1,
      group: 'Settings',
      showWhen: { field: 'showPoints', operator: 'equals', value: true },
      appliesTo: ['chart-line'],
    },
    ...COLOR_FIELDS,
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
        { value: 'none', label: 'None (first value)' },
      ],
    },
    ...COMMON_AXIS_FIELDS,
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
      description: 'Column for axis labels',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.valueColumn',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for values',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    ...COMMON_DISPLAY_FIELDS,
    // Bar Options
    {
      key: 'horizontal',
      label: 'Horizontal Bars',
      type: 'boolean',
      defaultValue: false,
      group: 'Settings',
      appliesTo: ['chart-bar'],
    },
    {
      key: 'stacked',
      label: 'Stacked Bars',
      type: 'boolean',
      defaultValue: false,
      group: 'Settings',
      appliesTo: ['chart-bar'],
    },
    {
      key: 'borderRadius',
      label: 'Corner Radius',
      type: 'range',
      min: 0,
      max: 20,
      defaultValue: 4,
      group: 'Settings',
      appliesTo: ['chart-bar'],
    },
    {
      key: 'barRatio',
      label: 'Bar Width (Ratio)',
      type: 'range',
      min: 0.1,
      max: 1,
      step: 0.1,
      defaultValue: 0.6,
      group: 'Settings',
      appliesTo: ['chart-bar'],
    },
    ...COLOR_FIELDS,
    // Aggregation & Sort
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
        { value: 'none', label: 'None' },
      ],
    },
    ...COMMON_TRANSFORM_FIELDS,
    ...COMMON_AXIS_FIELDS,
  ],
};

export const COMBO_CHART_SCHEMA: ComponentConfigSchema = {
  componentType: 'chart-combo',
  label: 'Combo Chart',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'dataSource.labelColumn',
      label: 'X-Axis Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Label / Date column',
    },
    {
      key: 'barColumn',
      label: 'Bar Series Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Primary Metric (Bars)',
    },
    {
      key: 'lineColumn',
      label: 'Line Series Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Secondary Metric (Line)',
    },
    ...COMMON_DISPLAY_FIELDS,

    // Combo Options
    {
      key: 'barRatio',
      label: 'Bar Width',
      type: 'range',
      min: 0.1, max: 1, step: 0.1, defaultValue: 0.6,
      group: 'Settings',
    },
    {
      key: 'lineTension',
      label: 'Line Curve',
      type: 'range',
      min: 0, max: 1, step: 0.1, defaultValue: 0.4,
      group: 'Settings',
    },
    {
      key: 'showPoints',
      label: 'Show Points',
      type: 'boolean',
      defaultValue: true,
      group: 'Settings',
    },

    // Colors
    {
      key: 'colorPalette',
      label: 'Palette',
      type: 'select',
      defaultValue: 'vibrant',
      group: 'Display',
      options: [
        { value: 'vibrant', label: 'Vibrant' },
        { value: 'pastel', label: 'Pastel' },
        { value: 'cool', label: 'Cool' },
        { value: 'warm', label: 'Warm' },
      ],
    },
    {
      key: 'barColor',
      label: 'Bar Color (Override)',
      type: 'color',
      group: 'Display',
    },
    {
      key: 'lineColor',
      label: 'Line Color (Override)',
      type: 'color',
      group: 'Display',
    },

    // Transform
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
      ],
    },
    ...COMMON_TRANSFORM_FIELDS,

    // Axes - Custom dual axis handling? 
    // Reusing common fields for now but they map to 'xAxis' and 'yAxis'.
    // Combo needs explicit Left/Right configuration.
    // For V1, we will use the common fields for the PRIMARY axis (Left).
    // And add specific ones for Right Axis.
    ...COMMON_AXIS_FIELDS, // Maps to xAxis and yAxis (Left)

    // Right Axis
    {
      key: 'rightAxis.showGridLines',
      label: 'Right Axis Grid',
      type: 'boolean',
      defaultValue: false,
      group: 'Settings',
    },
    {
      key: 'rightAxis.label',
      label: 'Right Axis Label',
      type: 'text',
      group: 'Settings',
    },
    {
      key: 'rightAxis.formatType',
      label: 'Right Axis Format',
      type: 'select',
      defaultValue: 'number',
      group: 'Settings',
      options: [
        { value: 'number', label: 'Number' },
        { value: 'currency', label: 'Currency' },
        { value: 'percent', label: 'Percentage' },
      ],
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

    // Tailored Color Fields (No Primary Color for Doughnut)
    {
      key: 'colorPalette',
      label: 'Color Palette',
      type: 'select',
      defaultValue: 'vibrant',
      group: 'Display',
      options: [
        { value: 'vibrant', label: 'Vibrant' },
        { value: 'pastel', label: 'Pastel' },
        { value: 'cool', label: 'Cool Tones' },
        { value: 'warm', label: 'Warm Tones' },
      ],
    },
    {
      key: 'colors.backgroundColor',
      label: 'Background',
      type: 'color',
      defaultValue: 'transparent',
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
      ],
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      type: 'select',
      defaultValue: 'value',
      group: 'Data',
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
      group: 'Data',
      options: [
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' },
      ],
      showWhen: { field: 'sortBy', operator: 'not-equals', value: 'none' },
    },
    {
      key: 'limit',
      label: 'Show Top N Segments',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 20,
      group: 'Data',
      description: 'Number of segments to show',
    },
    {
      key: 'showOther',
      label: 'Show "Other"',
      type: 'boolean',
      defaultValue: true,
      group: 'Data',
      description: 'Combine remaining items into "Other" segment',
      showWhen: { field: 'limit', operator: 'exists' },
      appliesTo: ['chart-doughnut'],
    },
    {
      key: 'showDataLabels',
      label: 'Show Data Labels',
      type: 'boolean',
      defaultValue: false,
      group: 'Display',
      appliesTo: ['chart-doughnut'],
    },
    {
      key: 'dataLabelPosition',
      label: 'Label Position',
      type: 'select',
      defaultValue: 'outside',
      group: 'Display',
      options: [
        { value: 'inside', label: 'Inside' },
        { value: 'outside', label: 'Outside' },
      ],
      showWhen: { field: 'showDataLabels', operator: 'equals', value: true },
      appliesTo: ['chart-doughnut'],
    },
    {
      key: 'dataLabelType',
      label: 'Label Content',
      type: 'select',
      defaultValue: 'value',
      group: 'Display',
      options: [
        { label: 'Value', value: 'value' },
        { label: 'Percentage', value: 'percent' },
        { label: 'Label', value: 'label' },
        { label: 'All', value: 'all' },
      ],
      showWhen: { field: 'showDataLabels', operator: 'equals', value: true },
      appliesTo: ['chart-doughnut'],
    },
    {
      key: 'innerRadius',
      label: 'Inner Radius (0-1)',
      type: 'number',
      defaultValue: 0.6,
      min: 0,
      max: 0.95,
      step: 0.05,
      group: 'Settings',
      appliesTo: ['chart-doughnut'],
    },
    {
      key: 'padAngle',
      label: 'Padding Angle',
      type: 'number',
      defaultValue: 0.7,
      min: 0,
      max: 45,
      step: 0.1,
      group: 'Settings',
      appliesTo: ['chart-doughnut'],
    },
    {
      key: 'cornerRadius',
      label: 'Corner Radius',
      type: 'number',
      defaultValue: 3,
      min: 0,
      max: 45,
      step: 1,
      group: 'Settings',
      appliesTo: ['chart-doughnut'],
    },
  ],
};

// ============================================================================
// Text Config Schemas
// ============================================================================

export const TEXT_SCHEMA: ComponentConfigSchema = {
  componentType: 'text',
  label: 'Text',
  fields: [
    // Content
    {
      key: 'text',
      label: '',
      type: 'text',
      defaultValue: 'Text',
      group: 'Display',
      description: 'The text to display',
    },
    // Typography Panel - all typography controls in one Figma-style panel
    {
      key: '_typography',
      label: 'Typography',
      type: 'typography',
      group: 'Typography',
      description: 'Font, size, weight, alignment, and text styles',
    },
    // Fill - Color with opacity (Figma style)
    {
      key: 'color',
      label: 'Fill',
      type: 'color-fill',
      group: 'Fill',
      description: 'Text color and opacity',
    },
  ],
};

// ============================================================================
// Chart Legend Schema
// ============================================================================

export const CHART_LEGEND_SCHEMA: ComponentConfigSchema = {
  componentType: 'chart-legend',
  label: 'Chart Legend',
  fields: [
    {
      key: 'linkedChartId',
      label: 'Link to Chart',
      type: 'select',
      group: 'Data',
      description: 'Select a chart to use its data and colors',
      options: [], // Populated dynamically
    },
    DATA_SOURCE_FIELD,
    {
      key: 'dataSource.labelColumn',
      label: 'Label Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for legend labels',
      showWhen: { field: 'linkedChartId', operator: 'not-exists' }, // Only show if NOT linking
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      group: 'Display',
      description: 'Legend title text',
    },
    ...COLOR_FIELDS,
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
      group: 'Data',
    },
    {
      key: 'trendField',
      label: 'Compare To Column',
      type: 'column-picker',
      group: 'Data',
      showWhen: { field: 'showTrend', operator: 'equals', value: true },
    },
    {
      key: 'valueColor',
      label: 'Value Color',
      type: 'color',
      group: 'Display',
    },
    {
      key: 'trendUpColor',
      label: 'Trend Up Color',
      type: 'color',
      defaultValue: '#22c55e',
      group: 'Display',
      showWhen: { field: 'showTrend', operator: 'equals', value: true },
    },
    {
      key: 'trendDownColor',
      label: 'Trend Down Color',
      type: 'color',
      defaultValue: '#ef4444',
      group: 'Display',
      showWhen: { field: 'showTrend', operator: 'equals', value: true },
    },
  ],
};

// ============================================================================
// Gauge Chart Config Schema
// ============================================================================

export const GAUGE_CHART_SCHEMA: ComponentConfigSchema = {
  componentType: 'chart-gauge',
  label: 'Gauge Chart',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'valueField',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column containing the gauge value',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'label',
      label: 'Label',
      type: 'text',
      defaultValue: 'Value',
      group: 'Display',
    },
    {
      key: 'min',
      label: 'Minimum Value',
      type: 'number',
      defaultValue: 0,
      group: 'Settings',
    },
    {
      key: 'max',
      label: 'Maximum Value',
      type: 'number',
      defaultValue: 100,
      group: 'Settings',
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
      key: 'showValue',
      label: 'Show Value',
      type: 'boolean',
      defaultValue: true,
      group: 'Display',
    },
    {
      key: 'showLabel',
      label: 'Show Label',
      type: 'boolean',
      defaultValue: true,
      group: 'Display',
    },
    {
      key: 'colors.primary',
      label: 'Gauge Color',
      type: 'color',
      defaultValue: '#3b82f6',
      group: 'Display',
    },
    {
      key: 'colors.track',
      label: 'Track Color',
      type: 'color',
      defaultValue: '#e5e7eb',
      group: 'Display',
    },
  ],
};

// ============================================================================
// Image Config Schema
// ============================================================================

export const IMAGE_SCHEMA: ComponentConfigSchema = {
  componentType: 'image',
  label: 'Image',
  fields: [
    {
      key: 'src',
      label: 'Image URL',
      type: 'text',
      group: 'Display',
      description: 'URL of the image to display',
    },
    {
      key: 'alt',
      label: 'Alt Text',
      type: 'text',
      group: 'Display',
      description: 'Alternative text for accessibility',
    },
    {
      key: 'objectFit',
      label: 'Object Fit',
      type: 'select',
      defaultValue: 'contain',
      group: 'Settings',
      options: [
        { value: 'contain', label: 'Contain' },
        { value: 'cover', label: 'Cover' },
        { value: 'fill', label: 'Fill' },
        { value: 'none', label: 'None' },
      ],
    },
    {
      key: 'borderRadius',
      label: 'Border Radius',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      group: 'Settings',
    },
    {
      key: 'opacity',
      label: 'Opacity',
      type: 'range',
      defaultValue: 100,
      min: 0,
      max: 100,
      step: 5,
      group: 'Settings',
    },
  ],
};

// ============================================================================
// Table Config Schema
// ============================================================================

export const TABLE_SCHEMA: ComponentConfigSchema = {
  componentType: 'table',
  label: 'Table',
  fields: [
    DATA_SOURCE_FIELD,
    {
      key: 'dataSource.labelColumn',
      label: 'Label Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for row labels',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'dataSource.valueColumn',
      label: 'Value Column',
      type: 'column-picker',
      group: 'Data',
      description: 'Column for row values',
      showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      group: 'Display',
    },
    {
      key: 'showTitle',
      label: 'Show Title',
      type: 'boolean',
      defaultValue: false,
      group: 'Display',
    },
    {
      key: 'showHeader',
      label: 'Show Header',
      type: 'boolean',
      defaultValue: true,
      group: 'Display',
    },
    {
      key: 'striped',
      label: 'Striped Rows',
      type: 'boolean',
      defaultValue: false,
      group: 'Display',
    },
    {
      key: 'bordered',
      label: 'Bordered',
      type: 'boolean',
      defaultValue: false,
      group: 'Display',
    },
    {
      key: 'compact',
      label: 'Compact Mode',
      type: 'boolean',
      defaultValue: false,
      group: 'Display',
    },
    {
      key: 'showPagination',
      label: 'Show Pagination',
      type: 'boolean',
      defaultValue: false,
      group: 'Settings',
    },
    {
      key: 'pageSize',
      label: 'Rows Per Page',
      type: 'number',
      defaultValue: 10,
      min: 5,
      max: 100,
      group: 'Settings',
      showWhen: { field: 'showPagination', operator: 'equals', value: true },
    },
  ],
};

// ============================================================================
// Schema Registry
// ============================================================================

export const CONFIG_SCHEMAS: Record<string, ComponentConfigSchema> = {
  'chart-line': LINE_CHART_SCHEMA,
  'chart-bar': BAR_CHART_SCHEMA,
  'chart-combo': COMBO_CHART_SCHEMA,
  'chart-doughnut': DOUGHNUT_CHART_SCHEMA,
  'chart-gauge': GAUGE_CHART_SCHEMA,
  'text': TEXT_SCHEMA,
  'heading': TEXT_SCHEMA, // Legacy alias -> text
  'kpi': KPI_SCHEMA,
  'image': IMAGE_SCHEMA,
  'table': TABLE_SCHEMA,
  'chart-legend': CHART_LEGEND_SCHEMA,
};

export function getConfigSchema(componentType: string): ComponentConfigSchema | undefined {
  return CONFIG_SCHEMAS[componentType];
}

// ============================================================================
// Config Field Groups (for UI organization)
// ============================================================================

export const CONFIG_GROUPS = [
  { id: 'Data', label: 'Data', icon: 'Database' },
  { id: 'Display', label: 'Content', icon: 'Type' },
  { id: 'Typography', label: 'Typography', icon: 'ALargeSmall' },
  { id: 'Fill', label: 'Fill', icon: 'Palette' },
  { id: 'Settings', label: 'Settings', icon: 'Sliders' },
] as const;

export type ConfigGroupId = typeof CONFIG_GROUPS[number]['id'];
