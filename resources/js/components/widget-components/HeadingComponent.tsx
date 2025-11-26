import { useState, useEffect, useRef } from 'react';

interface HeadingComponentProps {
  config?: {
    text?: string;
    level?: 1 | 2 | 3 | 4;
    align?: 'left' | 'center' | 'right';
  };
  onConfigChange?: (config: Record<string, unknown>) => void;
}

export default function HeadingComponent({ 
  config,
  onConfigChange,
}: HeadingComponentProps) {
  const text = config?.text ?? 'Heading';
  const level = config?.level ?? 2;
  const align = config?.align ?? 'left';
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (currentText !== text) {
        onConfigChange?.({ ...config, text: currentText });
      }
    }
    if (e.key === 'Escape') {
      setCurrentText(text);
      setIsEditing(false);
    }
  };

  const textSizeClass = {
    1: 'text-3xl font-bold',
    2: 'text-xl font-semibold',
    3: 'text-lg font-semibold',
    4: 'text-base font-medium',
  }[level];

  const alignClass = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  }[align];

  if (isEditing) {
    return (
      <div className={`h-full w-full px-4 py-3 flex items-center ${alignClass}`}>
        <input
          ref={inputRef}
          type="text"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent border-b-2 border-primary outline-none ${textSizeClass}`}
        />
      </div>
    );
  }

  return (
    <div 
      className={`h-full w-full px-4 py-3 flex items-center cursor-text ${alignClass} hover:bg-muted/30 transition-colors`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      <span className={`${textSizeClass} text-foreground`}>
        {currentText}
      </span>
    </div>
  );
}
