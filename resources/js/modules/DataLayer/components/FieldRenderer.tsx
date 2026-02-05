/**
 * Field Renderer - Centralized Inspector Field Dispatcher
 * Single source of truth for all field type rendering in the inspector
 *
 * Responsibility: Map field.type → appropriate UI renderer
 * Pattern: Each case returns a specialized renderer component
 */

import { Input } from '@/modules/DesignSystem/ui/input';
import { Label } from '@/modules/DesignSystem/ui/label';
import { Switch } from '@/modules/DesignSystem/ui/switch';
import { Slider } from '@/modules/DesignSystem/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/DesignSystem/ui/select';
import type { ConfigFieldSchema, DataSource } from '@/modules/DataLayer/types/component-config';
import { TypographyFields } from './TypographyFields';
import { FillSection } from './FillSection';
import { TableColumnsField } from './TableColumnsField';
import { DataSourceField } from './DataSourceField';

interface FieldRendererProps {
  field: ConfigFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
  globalDataSource: DataSource | null;
  disabled?: boolean;
}

/**
 * Renders a single configuration field based on its type
 * This is the centralized dispatcher for all field types in the inspector
 */
export function FieldRenderer({
  field,
  value,
  onChange,
  config,
  onConfigChange,
  globalDataSource,
  disabled,
}: FieldRendererProps) {
  const id = `field-${field.key}`;

  // ============================================================================
  // COMPOSITE FIELDS (complex, multi-control renderers)
  // ============================================================================

  // Typography panel - all font/size/weight/alignment controls
  if (field.type === 'typography') {
    return (
      <TypographyFields
        config={config}
        onChange={onConfigChange}
        disabled={disabled}
      />
    );
  }

  // Fill section - color + opacity for text components
  if (field.type === 'color-fill') {
    return (
      <FillSection
        color={String(config.color || '#000000')}
        opacity={Number(config.opacity ?? 100)}
        onColorChange={(color) => onConfigChange('color', color)}
        onOpacityChange={(opacity) => onConfigChange('opacity', opacity)}
      />
    );
  }

  // Table column configuration
  if (field.type === 'table-columns') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-medium">
            {field.label}
          </Label>
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <TableColumnsField
          columns={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      </div>
    );
  }

  // Data source selector (global + local merge)
  if (field.type === 'data-source') {
    return (
      <DataSourceField
        globalConfig={globalDataSource}
        localConfig={(config.dataSource as any) || {}}
        onChange={(updates) => onChange({ ...(config.dataSource as any), ...updates })}
      />
    );
  }

  // ============================================================================
  // SIMPLE FIELDS (single control renderers)
  // ============================================================================

  // Text input
  if (field.type === 'text') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-medium">
            {field.label}
          </Label>
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <Input
          id={id}
          type="text"
          value={String(value ?? field.defaultValue ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  // Number input
  if (field.type === 'number') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-medium">
            {field.label}
          </Label>
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <Input
          id={id}
          type="number"
          value={value !== undefined ? Number(value) : (field.defaultValue as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          placeholder={field.label}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  // Boolean toggle switch
  if (field.type === 'boolean') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-medium">
            {field.label}
          </Label>
          <Switch
            id={id}
            checked={Boolean(value ?? field.defaultValue)}
            onCheckedChange={onChange}
            disabled={disabled}
          />
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  }

  // Select dropdown
  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {field.label}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <Select
          value={String(value ?? field.defaultValue ?? '')}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="h-8 text-sm">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Range slider
  if (field.type === 'range') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{field.label}</Label>
          <span className="text-xs text-muted-foreground w-8 text-right">
            {Number(value ?? field.defaultValue ?? field.min ?? 0)}
          </span>
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <Slider
          value={[Number(value ?? field.defaultValue ?? field.min ?? 0)]}
          onValueChange={(values: number[]) => onChange(values[0])}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          disabled={disabled}
        />
      </div>
    );
  }

  // Color picker
  if (field.type === 'color') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {field.label}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={String(value ?? field.defaultValue ?? '#000000')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-8 w-12 rounded border cursor-pointer disabled:opacity-50"
          />
          <Input
            type="text"
            value={String(value ?? field.defaultValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000 or hsl(...)"
            disabled={disabled}
            className="h-8 text-sm flex-1"
          />
        </div>
      </div>
    );
  }

  // ============================================================================
  // SKIPPED FIELDS (handled elsewhere or not yet implemented)
  // ============================================================================

  // Column picker - skip (handled by data source UI)
  if (field.type === 'column-picker') {
    return null;
  }

  // ============================================================================
  // FALLBACK (unknown field type)
  // ============================================================================

  return (
    <div className="text-xs text-destructive p-2 rounded bg-destructive/10">
      Unknown field type: <code className="font-mono">{field.type}</code>
    </div>
  );
}
