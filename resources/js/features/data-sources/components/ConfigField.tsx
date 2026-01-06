/**
 * Config Field Components
 * Reusable form controls for component configuration
 */

import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Slider } from '@/shared/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { ConfigFieldSchema } from '@/features/data-sources/types/component-config';

interface ConfigFieldProps {
  field: ConfigFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function ConfigField({ field, value, onChange, disabled }: ConfigFieldProps) {
  const id = `config-${field.key}`;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {field.label}
        </Label>
        {field.type === 'boolean' && (
          <Switch
            id={id}
            checked={Boolean(value ?? field.defaultValue)}
            onCheckedChange={onChange}
            disabled={disabled}
          />
        )}
      </div>
      
      {field.description && field.type !== 'boolean' && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      {field.type === 'text' && (
        <Input
          id={id}
          type="text"
          value={String(value ?? field.defaultValue ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled}
          className="h-8 text-sm"
        />
      )}
      
      {field.type === 'number' && (
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
      )}
      
      {field.type === 'select' && field.options && (
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
      )}
      
      {field.type === 'range' && (
        <div className="flex items-center gap-3">
          <Slider
            id={id}
            value={[Number(value ?? field.defaultValue ?? field.min ?? 0)]}
            onValueChange={(values: number[]) => onChange(values[0])}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            disabled={disabled}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">
            {Number(value ?? field.defaultValue ?? field.min ?? 0)}
          </span>
        </div>
      )}
      
      {field.type === 'color' && (
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
      )}
    </div>
  );
}

// Boolean field inline version (for more compact layouts)
export function ConfigSwitch({ field, value, onChange, disabled }: ConfigFieldProps) {
  const id = `config-${field.key}`;
  
  return (
    <div className="flex items-center justify-between py-1">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {field.label}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={Boolean(value ?? field.defaultValue)}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}


