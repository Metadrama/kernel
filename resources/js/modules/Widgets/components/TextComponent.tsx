import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FONT_FAMILIES } from '@/modules/DesignSystem/constants/fonts';

export type FontFamily = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'montserrat' | 'source-sans-pro' | 'nunito' | 'raleway' | 'ubuntu' | 'system-ui' | 'serif' | 'mono';
// Presets kept for backward compatibility, but we prefer numbers now
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | number;
export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | string;
export type FontStyle = 'normal' | 'italic';
export type TextDecoration = 'none' | 'underline' | 'line-through';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type LineHeight = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose' | number | string;
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | number | string;
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TextComponentConfig {
  text?: string;
  fontFamily?: FontFamily | string;
  fontSize?: FontSize;
  fontSizePx?: number; // Legacy override, we should prefer fontSize as number now
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textDecoration?: TextDecoration;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  color?: string;
  lineHeight?: LineHeight;
  letterSpacing?: LetterSpacing;
  textTransform?: TextTransform;
  opacity?: number;
  autoWidth?: boolean;
  autoHeight?: boolean;
}

interface TextComponentProps {
  config?: TextComponentConfig;
  onConfigChange?: (config: Record<string, unknown>) => void;
  onDimensionsChange?: (dimensions: { width?: number; height?: number }) => void;
}

// Base font sizes in pixels for each Tailwind size class
type FontSizePreset = Exclude<FontSize, number>;
const fontSizePixels: Record<FontSizePreset, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

const fontWeightClasses: Record<string, string> = {
  thin: 'font-thin',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

const fontStyleClasses: Record<string, string> = {
  normal: 'not-italic',
  italic: 'italic',
};

const textDecorationClasses: Record<string, string> = {
  none: 'no-underline',
  underline: 'underline',
  'line-through': 'line-through',
};

const lineHeightClasses: Record<string, string> = {
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const letterSpacingClasses: Record<string, string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
};

const textTransformClasses: Record<string, string> = {
  none: 'normal-case',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
};

// Map legacy presets to numeric values
const normalizeFontSize = (val?: FontSize | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 16;
  return fontSizePixels[val as keyof typeof fontSizePixels] || 16;
};

const normalizeLineHeight = (val?: LineHeight | number | string): string | number => {
  if (typeof val === 'number') return val; // 1.5 etc
  if (!val || val === 'normal') return 'normal';
  if (lineHeightClasses[val as keyof typeof lineHeightClasses]) return ''; // handled by class
    // If it's a string like "120%" or "24px", return it
  return val;
};

const normalizeLetterSpacing = (val?: LetterSpacing | number | string): string | number => {
    if (typeof val === 'number') return `${val}%`; // convert number to percentage string for CSS
    if (!val || val === 'normal') return 'normal';
    if (letterSpacingClasses[val as keyof typeof letterSpacingClasses]) return ''; // handled by class
    return val;
};

export default function TextComponent({
  config,
  onConfigChange,
  onDimensionsChange,
}: TextComponentProps) {
  // Extract config values with defaults
  const text = config?.text ?? 'Text';
  const fontFamily = config?.fontFamily ?? 'inter';
  // Prefer explicit fontSize number, fallback to legacy presets
  // HANDLE LEGACY: fontSizePx overrides fontSize if present
  const fontSizeRaw = config?.fontSizePx ?? config?.fontSize ?? 'base'; 
  const fontWeight = config?.fontWeight ?? 'normal';
  const fontStyle = config?.fontStyle ?? 'normal';
  const textDecoration = config?.textDecoration ?? 'none';
  const align = config?.align ?? 'left';
  const verticalAlign = config?.verticalAlign ?? 'middle';
  const color = config?.color;
  const lineHeightRaw = config?.lineHeight ?? 'normal';
  const letterSpacingRaw = config?.letterSpacing ?? 'normal';
  const textTransform = config?.textTransform ?? 'none';
  const opacity = config?.opacity ?? 100;
  const autoWidth = config?.autoWidth ?? false;
  const autoHeight = config?.autoHeight ?? false;

  // Get the CSS font-family string from the FONT_FAMILIES list
  const fontFamilyCSS = FONT_FAMILIES.find((f) => f.value === fontFamily)?.fontFamily || fontFamily || 'Inter, system-ui, sans-serif';

  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Auto-resize logic
  useLayoutEffect(() => {
    if (!textRef.current || !onDimensionsChange || (!autoWidth && !autoHeight)) return;

    // Measure text content
    const { width, height } = textRef.current.getBoundingClientRect();
    
    // Add padding compensation (container has p-1 = 4px on each side = 8px total)
    const padding = 8;
    const newWidth = Math.ceil(width + padding);
    const newHeight = Math.ceil(height + padding);

    const updates: { width?: number; height?: number } = {};
    if (autoWidth) updates.width = newWidth;
    if (autoHeight) updates.height = newHeight;

    if (Object.keys(updates).length > 0) {
        onDimensionsChange(updates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    text, fontFamily, fontSizeRaw, fontWeight, fontStyle, letterSpacingRaw, lineHeightRaw, textTransform, 
    autoWidth, autoHeight, onDimensionsChange
  ]);

  // Sync text from config
  useEffect(() => {
    if (textRef.current && !isEditing) {
      textRef.current.textContent = text;
    }
  }, [text, isEditing]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Wait for focus to be applied before selecting
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // When in edit mode, stop propagation and focus the text element
    if (isEditing) {
      e.stopPropagation();
      textRef.current?.focus();
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // When in edit mode and clicking within container (but outside span),
    // prevent default to stop the blur event from firing
    if (isEditing && e.target === containerRef.current) {
      e.preventDefault();
      // Focus the text and place cursor at end
      textRef.current?.focus();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only exit edit mode if focus is truly leaving the text element
    // Check if the new focus target is still within our component
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
      return; // Focus stayed within our component
    }

    if (!isEditing) return;
    setIsEditing(false);
    const newText = textRef.current?.textContent || '';
    if (newText !== text) {
      onConfigChange?.({ ...config, text: newText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Restore original text and exit
      if (textRef.current) {
        textRef.current.textContent = text;
      }
      setIsEditing(false);
      textRef.current?.blur();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Save and exit
      const newText = textRef.current?.textContent || '';
      setIsEditing(false);
      textRef.current?.blur();
      if (newText !== text) {
        onConfigChange?.({ ...config, text: newText });
      }
    }

    // Text formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        const newWeight = (fontWeight === 'bold' || fontWeight === '700') ? 'normal' : 'bold';
        onConfigChange?.({ ...config, fontWeight: newWeight });
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
        onConfigChange?.({ ...config, fontStyle: newStyle });
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        const newDecoration = textDecoration === 'underline' ? 'none' : 'underline';
        onConfigChange?.({ ...config, textDecoration: newDecoration });
      }
    }
  };

  const finalFontSize = normalizeFontSize(fontSizeRaw);
  const finalLineHeight = normalizeLineHeight(lineHeightRaw);
  const finalLetterSpacing = normalizeLetterSpacing(letterSpacingRaw);

  const isLegacyLineHeight = typeof lineHeightRaw === 'string' && lineHeightRaw in lineHeightClasses;
  const isLegacyLetterSpacing = typeof letterSpacingRaw === 'string' && letterSpacingRaw in letterSpacingClasses;

  // Build class string
  const textClasses = [
    typeof fontWeight === 'string' && fontWeight in fontWeightClasses ? fontWeightClasses[fontWeight as FontWeight] : '', // Only use class if it's a preset
    fontStyleClasses[fontStyle],
    textDecorationClasses[textDecoration],
    isLegacyLineHeight ? lineHeightClasses[lineHeightRaw as LineHeight] : '',
    isLegacyLetterSpacing ? letterSpacingClasses[letterSpacingRaw as LetterSpacing] : '',
    textTransformClasses[textTransform],
  ].join(' ');

  // Build inline styles with explicit font size (no scaling)
  const textStyles: React.CSSProperties = {
    fontFamily: fontFamilyCSS,
    color: color || undefined,
    opacity: opacity / 100,
    fontSize: `${finalFontSize}px`,
    // Use raw value if not legacy class
    lineHeight: !isLegacyLineHeight ? finalLineHeight : undefined,
    letterSpacing: !isLegacyLetterSpacing ? finalLetterSpacing : undefined,
    fontWeight: (typeof fontWeight === 'number' || !(fontWeight in fontWeightClasses)) ? fontWeight : undefined,
  };

  // Container alignment classes for horizontal and vertical positioning
  const containerAlignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    justify: 'justify-start',
  }[align];

  const containerVerticalAlignClass = {
    top: 'items-start',
    middle: 'items-center',
    bottom: 'items-end',
  }[verticalAlign];

  return (
    <div
      ref={containerRef}
      className={`h-full w-full flex ${containerVerticalAlignClass} cursor-text ${containerAlignClass} transition-colors overflow-hidden p-1`}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      onMouseDown={handleContainerMouseDown}
      title="Double-click to edit | Ctrl+B: Bold | Ctrl+I: Italic | Ctrl+U: Underline | Ctrl+Enter: Save"
    >
      <span
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => isEditing && e.stopPropagation()}
        onClick={(e) => isEditing && e.stopPropagation()}
        className={`${textClasses} text-foreground whitespace-pre-wrap break-words focus:outline-none max-w-full`}
        style={textStyles}
      >
        {text || 'Text'}
      </span>
    </div>
  );
}
