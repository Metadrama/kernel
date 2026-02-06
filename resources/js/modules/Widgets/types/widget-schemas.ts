/**
 * Config Schema Definitions for Chart and Widget components
 * Moved from features/data-sources to improve scalability and organization.
 */

import type { ConfigFieldSchema, ComponentConfigSchema } from '@/modules/DataLayer/types/component-config';

// Re-using constants from the original file to avoid duplication if we want to extract them later
// For now, I will inline or copy the necessary helper constants to make this file self-contained,
// OR import them if they were exported.
// Since they were local constants in the original file, I will duplicate the common definitions here
// for valid separation, or we should have a `common-config.ts`.
// Given the instructions, I'll copy the schemas here.

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
        description: 'Display the chart title above the visualization',
    },
    {
        key: 'showLegend',
        label: 'Show Legend',
        type: 'boolean',
        defaultValue: false,
        group: 'Display',
        description: 'Display legend showing data series and colors',
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
        description: 'Show data values on hover',
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

// Aggregation field variants for different chart families
const AGGREGATION_FIELD_FULL: ConfigFieldSchema = {
    key: 'aggregation',
    label: 'Aggregation',
    type: 'select',
    defaultValue: 'sum',
    group: 'Data',
    description: 'How to combine multiple values',
    options: [
        { value: 'sum', label: 'Sum' },
        { value: 'count', label: 'Count' },
        { value: 'average', label: 'Average' },
        { value: 'min', label: 'Minimum' },
        { value: 'max', label: 'Maximum' },
        { value: 'none', label: 'None (first value)' },
    ],
};

const AGGREGATION_FIELD_SIMPLE: ConfigFieldSchema = {
    key: 'aggregation',
    label: 'Aggregation',
    type: 'select',
    defaultValue: 'sum',
    group: 'Data',
    description: 'How to combine multiple values',
    options: [
        { value: 'sum', label: 'Sum' },
        { value: 'count', label: 'Count' },
        { value: 'average', label: 'Average' },
    ],
};

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
    {
        key: 'yAxis.decimals',
        label: 'Decimal Places',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 4,
        group: 'Settings',
    },
];

const COMMON_AXIS_FIELDS: ConfigFieldSchema[] = [
    {
        key: 'xAxis.showGridLines',
        label: 'X Grid Lines',
        type: 'boolean',
        defaultValue: false,
        group: 'Settings',
        description: 'Show vertical grid lines for easier reading',
    },
    {
        key: 'yAxis.showGridLines',
        label: 'Y Grid Lines',
        type: 'boolean',
        defaultValue: true,
        group: 'Settings',
        description: 'Show horizontal grid lines for easier reading',
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

// Reusable field fragments for transform/sort/limit functionality
const SORT_FIELD: ConfigFieldSchema = {
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
};

const SORT_ORDER_FIELD: ConfigFieldSchema = {
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
};

const LIMIT_FIELD: ConfigFieldSchema = {
    key: 'limit',
    label: 'Show Top N Items',
    type: 'number',
    defaultValue: 10,
    min: 1,
    max: 100,
    group: 'Data',
    description: 'Display only the top N items after sorting',
};

const COMMON_TRANSFORM_FIELDS: ConfigFieldSchema[] = [
    SORT_FIELD,
    SORT_ORDER_FIELD,
    LIMIT_FIELD,
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
            description: 'Column for X-axis labels (dates, categories, ordered values)',
            showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
        },
        {
            key: 'dataSource.valueColumn',
            label: 'Value Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column containing numeric values to plot',
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
            description: 'Fill the area under the line with color',
        },
        {
            key: 'swapAxes',
            label: 'Swap Axes',
            type: 'boolean',
            defaultValue: false,
            group: 'Settings',
            description: 'Flip X and Y axes (horizontal line chart)',
        },
        {
            key: 'showPoints',
            label: 'Show Points',
            type: 'boolean',
            defaultValue: true,
            group: 'Settings',
            description: 'Show dots at each data point on the line',
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
        AGGREGATION_FIELD_FULL,
        ...COMMON_TRANSFORM_FIELDS,
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
            label: 'Label Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column for bar labels (categories, regions, product names)',
            showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
        },
        {
            key: 'dataSource.valueColumn',
            label: 'Value Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column containing numeric values to display',
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
            description: 'Rotate bars 90° to display horizontally',
        },
        {
            key: 'stacked',
            label: 'Stacked Bars',
            type: 'boolean',
            defaultValue: false,
            group: 'Settings',
            description: 'Stack bars on top of each other instead of side-by-side',
        },
        {
            key: 'borderRadius',
            label: 'Corner Radius',
            type: 'range',
            min: 0,
            max: 20,
            step: 1,
            defaultValue: 4,
            group: 'Settings',
            description: 'Roundness of bar corners (0 = square, 20 = very rounded)',
        },
        {
            key: 'barRatio',
            label: 'Bar Width',
            type: 'range',
            min: 0.1,
            max: 1,
            step: 0.1,
            defaultValue: 0.6,
            group: 'Settings',
            description: 'Width of bars relative to available space (0.1 = thin, 1 = full width)',
        },
        ...COLOR_FIELDS,
        // Aggregation & Sort
        AGGREGATION_FIELD_FULL,
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
            label: 'Label Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column for X-axis labels (dates, time periods, categories)',
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
            description: 'Width of bars relative to available space',
        },
        {
            key: 'tension',
            label: 'Line Curve',
            type: 'range',
            min: 0, max: 1, step: 0.1, defaultValue: 0.4,
            group: 'Settings',
            description: '0 = straight lines, 1 = very curved',
        },
        {
            key: 'showPoints',
            label: 'Show Points',
            type: 'boolean',
            defaultValue: true,
            group: 'Settings',
            description: 'Show dots at each data point on the line series',
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
        AGGREGATION_FIELD_SIMPLE,
        ...COMMON_TRANSFORM_FIELDS,

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
        {
            key: 'rightAxis.currencyCode',
            label: 'Right Axis Currency',
            type: 'select',
            defaultValue: 'MYR',
            group: 'Settings',
            options: [
                { value: 'MYR', label: 'MYR (RM)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
            ],
            showWhen: { field: 'rightAxis.formatType', operator: 'equals', value: 'currency' },
        },
        {
            key: 'rightAxis.decimals',
            label: 'Right Axis Decimals',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 4,
            group: 'Settings',
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
            label: 'Label Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column for segment names (categories, product types, regions)',
            showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
        },
        {
            key: 'dataSource.valueColumn',
            label: 'Value Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column containing numeric values for segment sizes',
            showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
        },
        ...COMMON_DISPLAY_FIELDS,
        
        // Aggregation & Sort (using normalized fields)
        AGGREGATION_FIELD_SIMPLE,
        SORT_FIELD,
        SORT_ORDER_FIELD,
        // Limit field with doughnut-specific customization
        {
            ...LIMIT_FIELD,
            label: 'Show Top N Segments',
            defaultValue: 5,
            max: 20,
            description: 'Display only the top N segments',
        },
        {
            key: 'showOther',
            label: 'Show "Other"',
            type: 'boolean',
            defaultValue: true,
            group: 'Data',
            description: 'Combine remaining items into "Other" segment',
            showWhen: { field: 'limit', operator: 'exists' },
        },
        // Colors (using normalized fields, no duplication)
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
        // Doughnut-specific display options
        {
            key: 'showDataLabels',
            label: 'Show Data Labels',
            type: 'boolean',
            defaultValue: false,
            group: 'Display',
            description: 'Display values or percentages directly on segments',
        },
        {
            key: 'dataLabelPosition',
            label: 'Label Position',
            type: 'select',
            defaultValue: 'outside',
            group: 'Display',
            description: 'Where to display data labels relative to segments',
            options: [
                { value: 'inside', label: 'Inside' },
                { value: 'outside', label: 'Outside' },
            ],
            showWhen: { field: 'showDataLabels', operator: 'equals', value: true },
        },
        {
            key: 'dataLabelType',
            label: 'Label Content',
            type: 'select',
            defaultValue: 'value',
            group: 'Display',
            description: 'What information to show in data labels',
            options: [
                { label: 'Value', value: 'value' },
                { label: 'Percentage', value: 'percent' },
                { label: 'Label', value: 'label' },
                { label: 'All', value: 'all' },
            ],
            showWhen: { field: 'showDataLabels', operator: 'equals', value: true },
        },
        {
            key: 'innerRadius',
            label: 'Inner Radius',
            type: 'range',
            defaultValue: 0.6,
            min: 0,
            max: 0.95,
            step: 0.05,
            group: 'Settings',
            description: 'Size of the inner hole (0 = pie chart, 0.95 = thin ring)',
        },
        {
            key: 'padAngle',
            label: 'Segment Spacing',
            type: 'range',
            defaultValue: 2,
            min: 0,
            max: 10,
            step: 0.5,
            group: 'Settings',
            description: 'Space between segments (0 = no gap, 10 = large gaps)',
        },
        {
            key: 'cornerRadius',
            label: 'Corner Radius',
            type: 'range',
            defaultValue: 3,
            min: 0,
            max: 20,
            step: 1,
            group: 'Settings',
            description: 'Roundness of segment corners (0 = sharp, 20 = very rounded)',
        },
    ],
};

export const TEXT_SCHEMA: ComponentConfigSchema = {
    componentType: 'text',
    label: 'Text',
    fields: [
        // Content
        {
            key: 'text',
            label: 'Text Content',
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
            description: 'Label displayed above the metric value',
        },
        {
            key: 'showTrend',
            label: 'Show Trend',
            type: 'boolean',
            defaultValue: false,
            group: 'Display',
            description: 'Display trend indicator (up/down arrow with percentage)',
        },
        AGGREGATION_FIELD_SIMPLE,
        {
            key: 'prefix',
            label: 'Prefix',
            type: 'text',
            group: 'Display',
            description: 'Text before value (e.g., "$", "RM")',
        },
        {
            key: 'suffix',
            label: 'Suffix',
            type: 'text',
            group: 'Display',
            description: 'Text after value (e.g., "%", "units")',
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
            key: 'trendValue',
            label: 'Trend Value',
            type: 'number',
            defaultValue: 0,
            group: 'Display',
            description: 'Manual trend override (optional)',
            showWhen: { field: 'showTrend', operator: 'equals', value: true },
        },
        {
            key: 'trendType',
            label: 'Trend Direction',
            type: 'select',
            defaultValue: 'neutral',
            group: 'Display',
            options: [
                { value: 'up', label: 'Up (Good)' },
                { value: 'down', label: 'Down (Bad)' },
                { value: 'neutral', label: 'Neutral' },
            ],
            showWhen: { field: 'showTrend', operator: 'equals', value: true },
        },
        ...COLOR_FIELDS,
    ],
};

export const GAUGE_SCHEMA: ComponentConfigSchema = {
    componentType: 'gauge',
    label: 'Gauge Chart',
    fields: [
        DATA_SOURCE_FIELD,
        {
            key: 'valueField',
            label: 'Value Column',
            type: 'column-picker',
            group: 'Data',
            description: 'Column containing the metric value',
        },
        {
            key: 'min',
            label: 'Minimum Value',
            type: 'number',
            defaultValue: 0,
            group: 'Data',
        },
        {
            key: 'max',
            label: 'Maximum Value',
            type: 'number',
            defaultValue: 100,
            group: 'Data',
        },
        AGGREGATION_FIELD_FULL,
        {
            key: 'title',
            label: 'Title',
            type: 'text',
            defaultValue: 'Gauge',
            group: 'Display',
        },
        ...COLOR_FIELDS,
    ],
};

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
            description: 'How image scales within container (contain = full image visible, cover = fill container)',
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
            type: 'range',
            defaultValue: 0,
            min: 0,
            max: 50,
            step: 1,
            group: 'Settings',
            description: 'Roundness of image corners (0 = rectangle, 50 = circle if square)',
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
            description: 'Image transparency (0 = invisible, 100 = fully opaque)',
        },
    ],
};

export const TABLE_SCHEMA: ComponentConfigSchema = {
    componentType: 'table',
    label: 'Table',
    fields: [
        DATA_SOURCE_FIELD,
        {
            key: 'columns',
            label: 'Columns',
            type: 'table-columns',
            group: 'Data',
            description: 'Configure which columns to display and their formatting',
        },
        {
            key: 'title',
            label: 'Title',
            type: 'text',
            group: 'Display',
            description: 'Table title text',
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
            description: 'Display column names at the top of the table',
        },
        {
            key: 'striped',
            label: 'Striped Rows',
            type: 'boolean',
            defaultValue: false,
            group: 'Display',
            description: 'Alternate row background colors for easier reading',
        },
        {
            key: 'bordered',
            label: 'Bordered',
            type: 'boolean',
            defaultValue: false,
            group: 'Display',
            description: 'Show borders around table cells',
        },
        {
            key: 'compact',
            label: 'Compact Mode',
            type: 'boolean',
            defaultValue: false,
            group: 'Display',
            description: 'Reduce row height and padding for denser display',
        },
        {
            key: 'showPagination',
            label: 'Show Pagination',
            type: 'boolean',
            defaultValue: false,
            group: 'Settings',
            description: 'Split large tables into pages',
        },
        {
            key: 'pageSize',
            label: 'Page Size',
            type: 'number',
            defaultValue: 10,
            min: 1,
            max: 200,
            group: 'Settings',
            showWhen: { field: 'showPagination', operator: 'equals', value: true },
        },
        {
            key: 'sortable',
            label: 'Sortable',
            type: 'boolean',
            defaultValue: false,
            group: 'Settings',
            description: 'Enable column sorting',
        },
        {
            key: 'filterable',
            label: 'Filterable',
            type: 'boolean',
            defaultValue: false,
            group: 'Settings',
            description: 'Enable per-column filters',
        },
        {
            key: 'searchable',
            label: 'Searchable',
            type: 'boolean',
            defaultValue: false,
            group: 'Settings',
            description: 'Enable search box',
        },
    ]
};
