/**
 * Config Schema Definitions for each component type
 * 
 * Re-exported from features/widgets/types/widget-schemas
 * for backward compatibility and centralized access.
 */

import type { ComponentConfigSchema } from './component-config';
import {
  LINE_CHART_SCHEMA,
  BAR_CHART_SCHEMA,
  COMBO_CHART_SCHEMA,
  DOUGHNUT_CHART_SCHEMA,
  GAUGE_SCHEMA,
  TEXT_SCHEMA,
  KPI_SCHEMA,
  IMAGE_SCHEMA,
  TABLE_SCHEMA,
  CHART_LEGEND_SCHEMA
} from '@/features/widgets/types/widget-schemas';

export * from '@/features/widgets/types/widget-schemas';

// ============================================================================
// Schema Registry
// ============================================================================

export const CONFIG_SCHEMAS: Record<string, ComponentConfigSchema> = {
  'chart-line': LINE_CHART_SCHEMA,
  'chart-bar': BAR_CHART_SCHEMA,
  'chart-combo': COMBO_CHART_SCHEMA,
  'chart-doughnut': DOUGHNUT_CHART_SCHEMA,
  'chart-gauge': GAUGE_SCHEMA,
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
