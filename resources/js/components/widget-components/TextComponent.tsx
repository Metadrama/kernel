import { useState, useEffect, useRef } from 'react';

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

// Tailwind class mappings
const fontSizeClasses: Record<FontSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize textarea
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
    // Allow Enter for new lines in multi-line mode
    // Use Ctrl+Enter or Cmd+Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      setIsEditing(false);
      if (currentText !== text) {
        onConfigChange?.({ ...config, text: currentText });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
    adjustTextareaHeight();
  };

  // Build class string
  const textClasses = [
    fontSizeClasses[fontSize],
    fontWeightClasses[fontWeight],
    fontStyleClasses[fontStyle],
    textDecorationClasses[textDecoration],
    textAlignClasses[align],
    lineHeightClasses[lineHeight],
    letterSpacingClasses[letterSpacing],
    textTransformClasses[textTransform],
  ].join(' ');

  // Build inline styles
  const textStyles: React.CSSProperties = {
    color: color || undefined,
    opacity: opacity / 100,
  };

  // Container alignment classes
  const containerAlignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    justify: 'justify-start',
  }[align];

  if (isEditing) {
    return (
      <div className={`h-full w-full px-4 py-3 flex items-start ${containerAlignClass}`}>
        <textarea
          ref={textareaRef}
          value={currentText}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent border-b-2 border-primary outline-none resize-none min-h-[1.5em] ${textClasses}`}
          style={textStyles}
          placeholder="Enter text..."
        />
      </div>
    );
  }

  return (
    <div 
      className={`h-full w-full px-4 py-3 flex items-start cursor-text ${containerAlignClass} hover:bg-muted/30 transition-colors`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit (Ctrl+Enter to save)"
    >
      <span 
        className={`${textClasses} text-foreground whitespace-pre-wrap break-words`}
        style={textStyles}
      >
        {currentText || 'Text'}
      </span>
    </div>
  );
}
