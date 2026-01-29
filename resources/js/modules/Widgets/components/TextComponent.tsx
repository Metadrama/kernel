import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FONT_FAMILIES } from '@/modules/DesignSystem/constants/fonts';

export type FontFamily = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'montserrat' | 'source-sans-pro' | 'nunito' | 'raleway' | 'ubuntu' | 'system-ui' | 'serif' | 'mono';
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type FontStyle = 'normal' | 'italic';
export type TextDecoration = 'none' | 'underline' | 'line-through';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type LineHeight = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TextComponentConfig {
  text?: string;
  fontFamily?: FontFamily;
  fontSize?: FontSize;
  fontSizePx?: number; // Custom px value (overrides fontSize preset)
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
}

interface TextComponentProps {
  config?: TextComponentConfig;
  onConfigChange?: (config: Record<string, unknown>) => void;
}

// Base font sizes in pixels for each Tailwind size class
const fontSizePixels: Record<FontSize, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

const fontWeightClasses: Record<FontWeight, string> = {
  thin: 'font-thin',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

const fontStyleClasses: Record<FontStyle, string> = {
  normal: 'not-italic',
  italic: 'italic',
};

const textDecorationClasses: Record<TextDecoration, string> = {
  none: 'no-underline',
  underline: 'underline',
  'line-through': 'line-through',
};

const textAlignClasses: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const lineHeightClasses: Record<LineHeight, string> = {
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const letterSpacingClasses: Record<LetterSpacing, string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
};

const textTransformClasses: Record<TextTransform, string> = {
  none: 'normal-case',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
};

export default function TextComponent({
  config,
  onConfigChange,
}: TextComponentProps) {
  // Extract config values with defaults
  const text = config?.text ?? 'Text';
  const fontFamily = config?.fontFamily ?? 'inter';
  const fontSize = config?.fontSize ?? 'base';
  const fontWeight = config?.fontWeight ?? 'normal';
  const fontStyle = config?.fontStyle ?? 'normal';
  const textDecoration = config?.textDecoration ?? 'none';
  const align = config?.align ?? 'left';
  const verticalAlign = config?.verticalAlign ?? 'middle';
  const color = config?.color;
  const lineHeight = config?.lineHeight ?? 'normal';
  const letterSpacing = config?.letterSpacing ?? 'normal';
  const textTransform = config?.textTransform ?? 'none';
  const opacity = config?.opacity ?? 100;

  // Get the CSS font-family string from the FONT_FAMILIES list
  const fontFamilyCSS = FONT_FAMILIES.find((f) => f.value === fontFamily)?.fontFamily || 'Inter, system-ui, sans-serif';

  const [isEditing, setIsEditing] = useState(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textSize, setTextSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Sync text from config
  useEffect(() => {
    if (textRef.current && !isEditing) {
      textRef.current.textContent = text;
    }
  }, [text, isEditing]);

  // Track container size with ResizeObserver
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Measure the natural text size (at base font size, scale=1)
  useLayoutEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;

    // Temporarily remove transform to measure natural size
    const prevTransform = textEl.style.transform;
    textEl.style.transform = 'none';

    const rect = textEl.getBoundingClientRect();
    setTextSize({ width: rect.width, height: rect.height });

    textEl.style.transform = prevTransform;
  }, [text, fontSize, fontWeight, fontStyle, letterSpacing, textTransform, isEditing]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
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
        const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
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

  // Calculate scale factor to fit text within container
  const calculateScaleFactor = (): number => {
    if (textSize.width === 0 || textSize.height === 0 || containerSize.width === 0 || containerSize.height === 0) {
      return 1;
    }
    // Scale to fit container, using the smaller scale to ensure text fits
    const widthScale = containerSize.width / textSize.width;
    const heightScale = containerSize.height / textSize.height;
    return Math.min(widthScale, heightScale);
  };

  const scaleFactor = calculateScaleFactor();
  const baseFontSizePx = config?.fontSizePx ?? fontSizePixels[fontSize];

  // Build class string (without font size - we use inline style)
  const textClasses = [
    fontWeightClasses[fontWeight],
    fontStyleClasses[fontStyle],
    textDecorationClasses[textDecoration],
    lineHeightClasses[lineHeight],
    letterSpacingClasses[letterSpacing],
    textTransformClasses[textTransform],
  ].join(' ');

  // Build inline styles with base font size (scaling handled by transform)
  const textStyles: React.CSSProperties = {
    fontFamily: fontFamilyCSS,
    color: color || undefined,
    opacity: opacity / 100,
    fontSize: `${baseFontSizePx}px`,
    transform: `scale(${scaleFactor})`,
    transformOrigin: [
      align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
      verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'bottom' : 'top',
    ].join(' '),
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
      className={`h-full w-full flex ${containerVerticalAlignClass} cursor-text ${containerAlignClass} transition-colors overflow-hidden`}
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
        className={`${textClasses} text-foreground whitespace-pre-wrap break-words focus:outline-none`}
        style={textStyles}
      >
        {text || 'Text'}
      </span>
    </div>
  );
}
