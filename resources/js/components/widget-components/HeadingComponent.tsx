import { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface HeadingComponentProps {
  text?: string;
  level?: 1 | 2 | 3 | 4;
  align?: 'left' | 'center' | 'right';
  editable?: boolean;
  onTextChange?: (text: string) => void;
}

export default function HeadingComponent({ 
  text = 'Heading Text', 
  level = 2, 
  align = 'left',
  editable = true,
  onTextChange,
}: HeadingComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTextChange?.(currentText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onTextChange?.(currentText);
    }
    if (e.key === 'Escape') {
      setCurrentText(text);
      setIsEditing(false);
    }
  };

  const textSizeClass = {
    1: 'text-4xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-medium',
  }[level];

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  if (isEditing) {
    return (
      <div className="h-full w-full p-4 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent border-b-2 border-primary outline-none ${textSizeClass} ${alignClass}`}
        />
      </div>
    );
  }

  return (
    <div 
      className={`h-full w-full p-4 flex items-center cursor-text group/heading ${alignClass}`}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex items-center gap-2 w-full">
        {editable && (
          <GripVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover/heading:opacity-100 transition-opacity cursor-grab shrink-0" />
        )}
        <span className={`${textSizeClass} text-foreground flex-1 ${alignClass}`}>
          {currentText}
        </span>
      </div>
      {editable && (
        <span className="text-xs text-muted-foreground opacity-0 group-hover/heading:opacity-100 transition-opacity ml-2">
          Double-click to edit
        </span>
      )}
    </div>
  );
}
