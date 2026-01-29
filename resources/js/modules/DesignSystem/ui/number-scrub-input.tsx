/**
 * Number Scrub Input Component
 * Figma-style numeric input with drag-to-scrub behavior
 * Drag left/right on the label to change value
 */

import * as React from 'react';
import { cn } from '@/modules/DesignSystem/lib/utils';

interface NumberScrubInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export function NumberScrubInput({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix,
  prefix,
  disabled = false,
  className,
  labelClassName,
}: NumberScrubInputProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(String(value));
  const startX = React.useRef(0);
  const startValue = React.useRef(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync input value when external value changes
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  const clamp = (val: number) => Math.min(max, Math.max(min, val));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isEditing) return;

    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startValue.current = value;

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      // Shift key for 10× increment
      const multiplier = e.shiftKey ? 10 : 1;
      const deltaValue = Math.round(deltaX / 5) * step * multiplier;
      const newValue = clamp(startValue.current + deltaValue);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, step, onChange, min, max]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    } else {
      setInputValue(String(value));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setInputValue(String(value));
      setIsEditing(false);
      inputRef.current?.blur();
    }
    // Arrow keys for increment/decrement
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const multiplier = e.shiftKey ? 10 : 1;
      onChange(clamp(value + step * multiplier));
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const multiplier = e.shiftKey ? 10 : 1;
      onChange(clamp(value - step * multiplier));
    }
  };

  const handleLabelClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span
          className={cn(
            'text-[10px] text-muted-foreground uppercase tracking-wide select-none',
            !disabled && !isEditing && 'cursor-ew-resize hover:text-foreground',
            labelClassName
          )}
          onMouseDown={handleMouseDown}
          onClick={handleLabelClick}
        >
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex items-center rounded-md bg-muted/50 h-7 px-2 text-sm',
          'border border-transparent',
          'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        {prefix && (
          <span className="text-muted-foreground mr-1 select-none text-xs">{prefix}</span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsEditing(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none min-w-0 text-right tabular-nums"
        />
        {suffix && (
          <span className="text-muted-foreground ml-1 select-none text-xs">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// Compact inline version without stacked label
interface InlineScrubInputProps extends Omit<NumberScrubInputProps, 'labelClassName'> { }

export function InlineScrubInput({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
  suffix,
  prefix,
  disabled = false,
  className,
}: InlineScrubInputProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(String(value));
  const startX = React.useRef(0);
  const startValue = React.useRef(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  const clamp = (val: number) => Math.min(max, Math.max(min, val));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startValue.current = value;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      const multiplier = e.shiftKey ? 10 : 1;
      const deltaValue = Math.round(deltaX / 5) * step * multiplier;
      onChange(clamp(startValue.current + deltaValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, step, onChange, min, max]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    } else {
      setInputValue(String(value));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setInputValue(String(value));
      setIsEditing(false);
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(clamp(value + step * (e.shiftKey ? 10 : 1)));
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(clamp(value - step * (e.shiftKey ? 10 : 1)));
    }
  };

  return (
    <div
      className={cn(
        'flex items-center rounded-md bg-muted/50 h-7 px-2 text-sm gap-1',
        'border border-transparent',
        'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {label && (
        <span
          className={cn(
            'text-muted-foreground text-xs select-none shrink-0',
            !disabled && !isEditing && 'cursor-ew-resize hover:text-foreground'
          )}
          onMouseDown={handleMouseDown}
        >
          {label}
        </span>
      )}
      {prefix && (
        <span className="text-muted-foreground select-none text-xs">{prefix}</span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsEditing(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        className="flex-1 bg-transparent outline-none min-w-0 tabular-nums"
      />
      {suffix && (
        <span className="text-muted-foreground select-none text-xs">{suffix}</span>
      )}
    </div>
  );
}
