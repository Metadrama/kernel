/**
 * DEPRECATED: ConfigField is now a backward-compatibility wrapper
 * 
 * This component existed to handle field-type dispatching in the inspector.
 * That responsibility has been moved to FieldRenderer.tsx for centralization.
 * 
 * ConfigField now simply delegates to FieldRenderer. It's kept for backward
 * compatibility in case any external code still imports it.
 * 
 * @deprecated Use FieldRenderer directly instead
 */

import type { ConfigFieldSchema } from '@/modules/DataLayer/types/component-config';
import { FieldRenderer } from './FieldRenderer';

interface ConfigFieldProps {
  field: ConfigFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  config?: Record<string, unknown>;
  onConfigChange?: (key: string, value: unknown) => void;
}

/**
 * @deprecated Use FieldRenderer directly instead
 */
export function ConfigField({
  field,
  value,
  onChange,
  disabled,
  config = {},
  onConfigChange = () => {},
}: ConfigFieldProps) {
  return (
    <FieldRenderer
      field={field}
      value={value}
      onChange={onChange}
      config={config}
      onConfigChange={onConfigChange}
      globalDataSource={null}
      disabled={disabled}
    />
  );
}

/**
 * @deprecated ConfigSwitch is no longer needed; use FieldRenderer with boolean field type instead
 */
export function ConfigSwitch({ field, value, onChange, disabled }: ConfigFieldProps) {
  return (
    <FieldRenderer
      field={field}
      value={value}
      onChange={onChange}
      config={{}}
      onConfigChange={() => {}}
      globalDataSource={null}
      disabled={disabled}
    />
  );
}



