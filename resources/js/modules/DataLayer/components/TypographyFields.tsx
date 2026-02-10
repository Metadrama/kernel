/**
 * Typography Fields Component
 * Figma-style typography inspector panel for text components
 * Supports high-precision numeric values and legacy presets
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
  CaseUpper, // Replaced with text if not found
  Type,
  ArrowRightFromLine,
  ArrowDownFromLine,
  MoveHorizontal, // For auto width/height
  Expand,
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
  { value: 'thin', label: 'Thin (100)' },
  { value: 'light', label: 'Light (300)' },
  { value: 'normal', label: 'Regular (400)' },
  { value: 'medium', label: 'Medium (500)' },
  { value: 'semibold', label: 'Semibold (600)' },
  { value: 'bold', label: 'Bold (700)' },
  { value: 'extrabold', label: 'ExtraBold (800)' },
  { value: 'black', label: 'Black (900)' },
];

// Helper to resolve legacy values to numbers for UI
const resolveFontSize = (val: unknown): number => {
  if (typeof val === 'number') return val;
  const presets: Record<string, number> = {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36
  };
  return presets[String(val)] || 16;
};

// Heuristic to resolve line height to a number (unitless or px? assuming px for input)
// If logic becomes too complex, we default to font size * 1.5
const resolveLineHeight = (lh: unknown, fontSize: number): number => {
  if (typeof lh === 'number') return lh; // Assuming px if number? Or multiplier?
  // If it's a multiplier number stored as string?
  // Let's assume input is PX.
  const presets: Record<string, number> = {
    tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2
  };
  const multiplier = presets[String(lh)] || 1.5;
  return Math.round(fontSize * multiplier);
};

export function TypographyFields({ config, onChange, disabled }: TypographyFieldsProps) {
  // Resolved numeric values
  const fontSize = resolveFontSize(config.fontSize);
  const lineHeight = resolveLineHeight(config.lineHeight, fontSize);
  const letterSpacing = typeof config.letterSpacing === 'number' ? config.letterSpacing : 0;

  // Build style toggles for decoration & case
  const getDecorationToggles = (): string[] => {
    const toggles: string[] = [];
    if (config.textDecoration === 'underline') toggles.push('underline');
    if (config.textDecoration === 'line-through') toggles.push('line-through');
    if (config.textTransform === 'uppercase') toggles.push('uppercase');
    if (config.textTransform === 'lowercase') toggles.push('lowercase');
    return toggles;
  };

  const handleDecorationToggle = (values: string[]) => {
    // Check what changed
    const hasUnderline = values.includes('underline');
    const hasStrikethrough = values.includes('line-through');
    const hasUpper = values.includes('uppercase');
    const hasLower = values.includes('lowercase');

    // Decoration logic (mutually exclusive in CSS usually? No, underline+line-through works)
    // But our simplified TextComponent expects single string value?
    // Looking at TextComponent.tsx: textDecoration?: 'none' | 'underline' | 'line-through';
    // So it IS mutually exclusive in our type.
    if (hasUnderline && config.textDecoration !== 'underline') onChange('textDecoration', 'underline');
    else if (hasStrikethrough && config.textDecoration !== 'line-through') onChange('textDecoration', 'line-through');
    else if (!hasUnderline && !hasStrikethrough) onChange('textDecoration', 'none');

    // Case logic
    if (hasUpper && config.textTransform !== 'uppercase') onChange('textTransform', 'uppercase');
    else if (hasLower && config.textTransform !== 'lowercase') onChange('textTransform', 'lowercase');
    else if (!hasUpper && !hasLower) onChange('textTransform', 'none');
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Font Face & Weight */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1.5fr_1fr] gap-2">
            <FontPicker
                value={String(config.fontFamily || 'inter')}
                onChange={(v) => onChange('fontFamily', v)}
                disabled={disabled}
            />
            <Select
                value={String(config.fontWeight || 'normal')}
                onValueChange={(v) => onChange('fontWeight', v)}
                disabled={disabled}
            >
                <SelectTrigger className="h-7 bg-muted/50 border-0 text-xs px-2">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {FONT_WEIGHTS.map((w) => (
                    <SelectItem key={w.value} value={w.value} className="text-xs">
                    {w.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Row 2: Size & Line Height */}
      <div className="grid grid-cols-2 gap-2">
        <InlineScrubInput
            label={<span className="text-muted-foreground font-serif italic text-xs">Ag</span>}
            value={fontSize}
            onChange={(v) => onChange('fontSize', v)}
            suffix="px"
            min={1}
            step={1}
            disabled={disabled}
        />
        <InlineScrubInput
            label={<ArrowDownFromLine className="w-3.5 h-3.5 text-muted-foreground" />}
            value={lineHeight}
            onChange={(v) => onChange('lineHeight', `${v}px`)} // Store as px string for now? Or number? TextComponent supports number as px if not in presets.
            suffix="px"
            min={0}
            step={1}
            disabled={disabled}
        />
      </div>

      {/* Row 3: Spacing & Paragraph */}
      <div className="grid grid-cols-2 gap-2">
        <InlineScrubInput
            label={<MoveHorizontal className="w-3.5 h-3.5 text-muted-foreground" />}
            value={letterSpacing}
            onChange={(v) => onChange('letterSpacing', v)}
            suffix="%"
            step={1}
            disabled={disabled}
        />
        {/* Paragraph spacing - placeholder for now as TextComponent doesn't support it yet */}
        <InlineScrubInput
            label={<Type className="w-3.5 h-3.5 text-muted-foreground" />}
            value={0}
            onChange={() => {}}
            suffix="px"
            disabled={true}
            className="opacity-50"
        />
      </div>

      {/* Row 4: Auto-Resize (Layout Constraints) */}
      <div className="flex items-center gap-2 p-1 bg-muted/20 rounded-md border border-transparent">
        <Label className="text-[10px] uppercase text-muted-foreground px-1">Resize</Label>
        
        <ToggleButtonGroup
            value={config.autoWidth ? ['autoWidth'] : []}
            onChange={(vals) => onChange('autoWidth', vals.includes('autoWidth'))}
            options={[
                { value: 'autoWidth', label: 'Auto Width', icon: <ArrowRightFromLine className="w-3.5 h-3.5 rotate-180" /> }
            ]}
            size="sm"
            className="h-6"
        />
         <ToggleButtonGroup
            value={config.autoHeight ? ['autoHeight'] : []}
            onChange={(vals) => onChange('autoHeight', vals.includes('autoHeight'))}
            options={[
                { value: 'autoHeight', label: 'Auto Height', icon: <ArrowDownFromLine className="w-3.5 h-3.5 rotate-180" /> }
            ]}
            size="sm"
            className="h-6"
        />
         <div className="flex-1" />
         <span className="text-[10px] text-muted-foreground">Fixed</span>
      </div>

      {/* Row 5: Alignment & Styling */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
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
                value={String(config.verticalAlign || 'middle')} // Default changed to middle
                onChange={(v) => onChange('verticalAlign', v)}
                disabled={disabled}
                size="sm"
                options={[
                { value: 'top', icon: <AlignVerticalJustifyStart className="w-3 h-3" />, label: 'Top' },
                { value: 'middle', icon: <AlignVerticalJustifyCenter className="w-3 h-3" />, label: 'Middle' },
                { value: 'bottom', icon: <AlignVerticalJustifyEnd className="w-3 h-3" />, label: 'Bottom' },
                ]}
            />
        </div>

        <div className="flex items-center justify-between border-t pt-2">
             <ToggleGroup
                value={config.fontStyle === 'italic' ? 'italic' : ''}
                onChange={(v) => onChange('fontStyle', v === 'italic' ? 'italic' : 'normal')}
                size="sm"
                options={[
                    { value: 'italic', icon: <Italic className="w-3 h-3" />, label: 'Italic' }
                ]}
            />
            
            <div className="h-4 w-px bg-border mx-1" />

            {/* Decorations */}
             <ToggleButtonGroup
                value={getDecorationToggles()}
                onChange={handleDecorationToggle}
                disabled={disabled}
                size="sm"
                options={[
                { value: 'underline', icon: <Underline className="w-3 h-3" />, label: 'Underline' },
                { value: 'line-through', icon: <Strikethrough className="w-3 h-3" />, label: 'Strikethrough' },
                ]}
            />

            <div className="h-4 w-px bg-border mx-1" />
            
             {/* Casing - using Type icon for now */}
             <ToggleButtonGroup
                value={getDecorationToggles()} // Reusing logic
                onChange={handleDecorationToggle}
                disabled={disabled}
                size="sm"
                options={[
                    { value: 'uppercase', icon: <span className="text-[10px] font-bold">AA</span>, label: 'Uppercase' },
                    { value: 'lowercase', icon: <span className="text-[10px] font-bold">aa</span>, label: 'Lowercase' },
                ]}
            />
        </div>
      </div>
    </div>
  );
}
