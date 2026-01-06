import { useState, useEffect, useRef, useLayoutEffect } from 'react';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type FontStyle = 'normal' | 'italic';
export type TextDecoration = 'none' | 'underline' | 'line-through';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type LineHeight = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TextComponentConfig {
  text?: string;
  fontSize?: FontSize;
  fontSizePx?: number; // Custom px value (overrides fontSize preset)
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textDecoration?: TextDecoration;
  align?: TextAlign;
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
  const fontSize = config?.fontSize ?? 'base';
  const fontWeight = config?.fontWeight ?? 'normal';
  const fontStyle = config?.fontStyle ?? 'normal';
  const textDecoration = config?.textDecoration ?? 'none';
  const align = config?.align ?? 'left';
  const color = config?.color;
  const lineHeight = config?.lineHeight ?? 'normal';
  const letterSpacing = config?.letterSpacing ?? 'normal';
  const textTransform = config?.textTransform ?? 'none';
  const opacity = config?.opacity ?? 100;

  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textSize, setTextSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

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
    if (!textEl || isEditing) return;

    // Temporarily remove transform to measure natural size
    const prevTransform = textEl.style.transform;
    textEl.style.transform = 'none';

    const rect = textEl.getBoundingClientRect();
    setTextSize({ width: rect.width, height: rect.height });

    textEl.style.transform = prevTransform;
  }, [currentText, fontSize, fontWeight, fontStyle, letterSpacing, textTransform, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      adjustTextareaHeight();
    }
  }, [isEditing]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (currentText !== text) {
      onConfigChange?.({ ...config, text: currentText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCurrentText(text);
      setIsEditing(false);
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      setIsEditing(false);
      if (currentText !== text) {
        onConfigChange?.({ ...config, text: currentText });
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
    adjustTextareaHeight();
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
    color: color || undefined,
    opacity: opacity / 100,
    fontSize: `${baseFontSizePx}px`,
    transform: `scale(${scaleFactor})`,
    transformOrigin: align === 'center' ? 'center center' : align === 'right' ? 'right center' : 'left center',
  };

  // Container alignment classes for horizontal positioning
  const containerAlignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    justify: 'justify-start',
  }[align];

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className={`h-full w-full flex items-center ${containerAlignClass} overflow-hidden`}
      >
        <textarea
          ref={textareaRef}
          value={currentText}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent border-b-2 border-primary outline-none resize-none min-h-[1.5em] ${textClasses} ${textAlignClasses[align]}`}
          style={{
            color: color || undefined,
            opacity: opacity / 100,
            fontSize: `${baseFontSizePx}px`,
          }}
          placeholder="Enter text..."
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-full w-full flex items-center cursor-text ${containerAlignClass} hover:bg-muted/30 transition-colors overflow-hidden`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit | Ctrl+B: Bold | Ctrl+I: Italic | Ctrl+U: Underline | Ctrl+Enter: Save"
    >
      <span
        ref={textRef}
        className={`${textClasses} text-foreground whitespace-nowrap`}
        style={textStyles}
      >
        {currentText || 'Text'}
      </span>
    </div>
  );
}
