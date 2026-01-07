/**
 * Font Picker Component
 * Figma-style font family dropdown with preview
 */

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

// Curated list of web-safe and commonly available fonts
const FONT_FAMILIES = [
  { value: 'inter', label: 'Inter', fontFamily: 'Inter, system-ui, sans-serif' },
  { value: 'roboto', label: 'Roboto', fontFamily: 'Roboto, sans-serif' },
  { value: 'open-sans', label: 'Open Sans', fontFamily: '"Open Sans", sans-serif' },
  { value: 'lato', label: 'Lato', fontFamily: 'Lato, sans-serif' },
  { value: 'poppins', label: 'Poppins', fontFamily: 'Poppins, sans-serif' },
  { value: 'montserrat', label: 'Montserrat', fontFamily: 'Montserrat, sans-serif' },
  { value: 'source-sans-pro', label: 'Source Sans Pro', fontFamily: '"Source Sans Pro", sans-serif' },
  { value: 'nunito', label: 'Nunito', fontFamily: 'Nunito, sans-serif' },
  { value: 'raleway', label: 'Raleway', fontFamily: 'Raleway, sans-serif' },
  { value: 'ubuntu', label: 'Ubuntu', fontFamily: 'Ubuntu, sans-serif' },
  { value: 'system-ui', label: 'System UI', fontFamily: 'system-ui, -apple-system, sans-serif' },
  { value: 'serif', label: 'Serif', fontFamily: 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Monospace', fontFamily: 'ui-monospace, "SF Mono", monospace' },
] as const;

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FontPicker({ value, onChange, disabled, className }: FontPickerProps) {
  const selectedFont = FONT_FAMILIES.find((f) => f.value === value) || FONT_FAMILIES[0];

  return (
    <Select value={value || 'inter'} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'h-8 bg-muted/50 border-0 hover:bg-muted focus:ring-1 focus:ring-ring/20',
          className
        )}
      >
        <SelectValue>
          <span style={{ fontFamily: selectedFont.fontFamily }}>{selectedFont.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {FONT_FAMILIES.map((font) => (
          <SelectItem
            key={font.value}
            value={font.value}
            className="py-2"
          >
            <span style={{ fontFamily: font.fontFamily }}>{font.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { FONT_FAMILIES };
