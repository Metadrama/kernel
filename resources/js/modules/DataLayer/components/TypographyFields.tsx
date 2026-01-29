/**
 * Typography Fields Component
 * Figma-style typography inspector panel for text components
 */

import * as React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Bold,
  Italic,
} from 'lucide-react';
import { FontPicker } from '@/modules/DesignSystem/ui/font-picker';
import { ToggleGroup, ToggleButtonGroup } from '@/modules/DesignSystem/ui/toggle-group';
import { InlineScrubInput } from '@/modules/DesignSystem/ui/number-scrub-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/DesignSystem/ui/select';
import { Label } from '@/modules/DesignSystem/ui/label';

interface TypographyFieldsProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const FONT_WEIGHTS = [
  { value: 'thin', label: 'Thin' },
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
  { value: 'extrabold', label: 'ExtraBold' },
];

const LINE_HEIGHTS = [
  { value: 'tight', label: 'Tight' },
  { value: 'snug', label: 'Snug' },
  { value: 'normal', label: 'Auto' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'loose', label: 'Loose' },
];

const LETTER_SPACINGS = [
  { value: 'tighter', label: '-2%' },
  { value: 'tight', label: '-1%' },
  { value: 'normal', label: '0%' },
  { value: 'wide', label: '+1%' },
  { value: 'wider', label: '+2%' },
];

export function TypographyFields({ config, onChange, disabled }: TypographyFieldsProps) {
  // Build style toggles value array
  const getStyleToggles = (): string[] => {
    const toggles: string[] = [];
    if (config.fontWeight === 'bold' || config.fontWeight === 'semibold' || config.fontWeight === 'extrabold') {
      toggles.push('bold');
    }
    if (config.fontStyle === 'italic') {
      toggles.push('italic');
    }
    return toggles;
  };

  const handleStyleToggle = (values: string[]) => {
    // Handle bold
    const hasBold = values.includes('bold');
    const currentWeight = String(config.fontWeight || 'normal');
    const isBoldWeight = ['bold', 'semibold', 'extrabold'].includes(currentWeight);

    // Handle italic
    const hasItalic = values.includes('italic');
    const currentStyle = String(config.fontStyle || 'normal');
    const isItalic = currentStyle === 'italic';

    // Only fire onChange for values that actually changed
    if (hasBold !== isBoldWeight) {
      onChange('fontWeight', hasBold ? 'bold' : 'normal');
    }

    if (hasItalic !== isItalic) {
      onChange('fontStyle', hasItalic ? 'italic' : 'normal');
    }
  };

  return (
    <div className="space-y-2">
      {/* Row 1: Font Family (full width) */}
      <FontPicker
        value={String(config.fontFamily || 'inter')}
        onChange={(v) => onChange('fontFamily', v)}
        disabled={disabled}
        className="w-full"
      />

      {/* Row 2: Font Weight (full width) */}
      <Select
        value={String(config.fontWeight || 'normal')}
        onValueChange={(v) => onChange('fontWeight', v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-7 w-full bg-muted/50 border-0 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_WEIGHTS.map((w) => (
            <SelectItem key={w.value} value={w.value}>
              {w.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Row 3: Line Height + Letter Spacing (2 columns) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Line height
          </Label>
          <Select
            value={String(config.lineHeight || 'normal')}
            onValueChange={(v) => onChange('lineHeight', v)}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-full bg-muted/50 border-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_HEIGHTS.map((lh) => (
                <SelectItem key={lh.value} value={lh.value}>
                  {lh.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Letter spacing
          </Label>
          <Select
            value={String(config.letterSpacing || 'normal')}
            onValueChange={(v) => onChange('letterSpacing', v)}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 w-full bg-muted/50 border-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LETTER_SPACINGS.map((ls) => (
                <SelectItem key={ls.value} value={ls.value}>
                  {ls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Alignment (stacked rows for clean fit) */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Alignment
        </Label>
        <div className="flex items-center justify-between gap-1">
          {/* Horizontal Alignment */}
          <ToggleGroup
            value={String(config.align || 'left')}
            onChange={(v) => onChange('align', v)}
            disabled={disabled}
            size="sm"
            options={[
              { value: 'left', icon: <AlignLeft className="w-3 h-3" />, label: 'Left' },
              { value: 'center', icon: <AlignCenter className="w-3 h-3" />, label: 'Center' },
              { value: 'right', icon: <AlignRight className="w-3 h-3" />, label: 'Right' },
              { value: 'justify', icon: <AlignJustify className="w-3 h-3" />, label: 'Justify' },
            ]}
          />

          {/* Vertical Alignment */}
          <ToggleGroup
            value={String(config.verticalAlign || 'top')}
            onChange={(v) => onChange('verticalAlign', v)}
            disabled={disabled}
            size="sm"
            options={[
              { value: 'top', icon: <AlignVerticalJustifyStart className="w-3 h-3" />, label: 'Top' },
              { value: 'middle', icon: <AlignVerticalJustifyCenter className="w-3 h-3" />, label: 'Middle' },
              { value: 'bottom', icon: <AlignVerticalJustifyEnd className="w-3 h-3" />, label: 'Bottom' },
            ]}
          />

          {/* Style Toggles (B/I only - simpler) */}
          <ToggleButtonGroup
            value={getStyleToggles()}
            onChange={handleStyleToggle}
            disabled={disabled}
            size="sm"
            options={[
              { value: 'bold', icon: <Bold className="w-3 h-3" />, label: 'Bold' },
              { value: 'italic', icon: <Italic className="w-3 h-3" />, label: 'Italic' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
