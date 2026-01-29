/**
 * Font Picker Component
 * Figma-style font family dropdown with preview
 */

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/modules/DesignSystem/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

import { FONT_FAMILIES } from '@/modules/DesignSystem/constants/fonts';

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
          'h-7 w-full bg-muted/50 border-0 text-sm hover:bg-muted focus:ring-1 focus:ring-ring/20',
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
            className="py-1.5"
          >
            <span style={{ fontFamily: font.fontFamily }}>{font.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

