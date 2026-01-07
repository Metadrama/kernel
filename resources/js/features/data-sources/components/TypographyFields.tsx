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
  Underline,
  Strikethrough,
  ChevronsLeftRightEllipsis,
} from 'lucide-react';
import { FontPicker } from '@/shared/components/ui/font-picker';
import { ToggleGroup, ToggleButtonGroup } from '@/shared/components/ui/toggle-group';
import { InlineScrubInput } from '@/shared/components/ui/number-scrub-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/utils';

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
    if (config.textDecoration === 'underline') {
      toggles.push('underline');
    }
    if (config.textDecoration === 'line-through') {
      toggles.push('strikethrough');
    }
    return toggles;
  };

  const handleStyleToggle = (values: string[]) => {
    // Handle bold
    const hasBold = values.includes('bold');
    const currentWeight = String(config.fontWeight || 'normal');
    const isBoldWeight = ['bold', 'semibold', 'extrabold'].includes(currentWeight);
    
    if (hasBold && !isBoldWeight) {
      onChange('fontWeight', 'bold');
    } else if (!hasBold && isBoldWeight) {
      onChange('fontWeight', 'normal');
    }

    // Handle italic
    onChange('fontStyle', values.includes('italic') ? 'italic' : 'normal');

    // Handle text decoration (underline vs strikethrough - mutually exclusive for now)
    if (values.includes('underline')) {
      onChange('textDecoration', 'underline');
    } else if (values.includes('strikethrough')) {
      onChange('textDecoration', 'line-through');
    } else {
      onChange('textDecoration', 'none');
    }
  };

  return (
    <div className="space-y-3">
      {/* Font Family */}
      <FontPicker
        value={String(config.fontFamily || 'inter')}
        onChange={(v) => onChange('fontFamily', v)}
        disabled={disabled}
      />

      {/* Font Weight + Size Row */}
      <div className="flex gap-2">
        <Select
          value={String(config.fontWeight || 'normal')}
          onValueChange={(v) => onChange('fontWeight', v)}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1 h-7 bg-muted/50 border-0 text-sm">
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

        <InlineScrubInput
          value={(config.fontSizePx as number) || 16}
          onChange={(v) => onChange('fontSizePx', v)}
          min={8}
          max={200}
          step={1}
          className="w-16"
          disabled={disabled}
        />
      </div>

      {/* Line Height + Letter Spacing Row */}
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Line height
          </Label>
          <div className="flex items-center h-7 px-2 rounded-md bg-muted/50 text-sm">
            <ChevronsLeftRightEllipsis className="w-3.5 h-3.5 text-muted-foreground mr-1.5 rotate-90" />
            <Select
              value={String(config.lineHeight || 'normal')}
              onValueChange={(v) => onChange('lineHeight', v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tight">Tight</SelectItem>
                <SelectItem value="snug">Snug</SelectItem>
                <SelectItem value="normal">Auto</SelectItem>
                <SelectItem value="relaxed">Relaxed</SelectItem>
                <SelectItem value="loose">Loose</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Letter spacing
          </Label>
          <div className="flex items-center h-7 px-2 rounded-md bg-muted/50 text-sm">
            <span className="text-muted-foreground mr-1.5 text-xs font-mono">|A|</span>
            <Select
              value={String(config.letterSpacing || 'normal')}
              onValueChange={(v) => onChange('letterSpacing', v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tighter">-2%</SelectItem>
                <SelectItem value="tight">-1%</SelectItem>
                <SelectItem value="normal">0%</SelectItem>
                <SelectItem value="wide">+1%</SelectItem>
                <SelectItem value="wider">+2%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alignment Row */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Alignment
        </Label>
        <div className="flex gap-2 items-center">
          {/* Horizontal Alignment */}
          <ToggleGroup
            value={String(config.align || 'left')}
            onChange={(v) => onChange('align', v)}
            disabled={disabled}
            options={[
              { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" />, label: 'Align Left' },
              { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />, label: 'Align Center' },
              { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" />, label: 'Align Right' },
              { value: 'justify', icon: <AlignJustify className="w-3.5 h-3.5" />, label: 'Justify' },
            ]}
          />

          <div className="w-px h-5 bg-border" />

          {/* Vertical Alignment */}
          <ToggleGroup
            value={String(config.verticalAlign || 'top')}
            onChange={(v) => onChange('verticalAlign', v)}
            disabled={disabled}
            options={[
              { value: 'top', icon: <AlignVerticalJustifyStart className="w-3.5 h-3.5" />, label: 'Align Top' },
              { value: 'middle', icon: <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />, label: 'Align Middle' },
              { value: 'bottom', icon: <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />, label: 'Align Bottom' },
            ]}
          />

          <div className="w-px h-5 bg-border" />

          {/* Style Toggles (B/I/U/S) */}
          <ToggleButtonGroup
            value={getStyleToggles()}
            onChange={handleStyleToggle}
            disabled={disabled}
            options={[
              { value: 'bold', icon: <Bold className="w-3.5 h-3.5" />, label: 'Bold' },
              { value: 'italic', icon: <Italic className="w-3.5 h-3.5" />, label: 'Italic' },
              { value: 'underline', icon: <Underline className="w-3.5 h-3.5" />, label: 'Underline' },
              { value: 'strikethrough', icon: <Strikethrough className="w-3.5 h-3.5" />, label: 'Strikethrough' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
