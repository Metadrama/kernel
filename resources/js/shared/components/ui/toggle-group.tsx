/**
 * Toggle Group Component
 * Figma-style mutually exclusive icon button group
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface ToggleGroupOption {
  value: string;
  icon: React.ReactNode;
  label?: string;
}

interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function ToggleGroup({
  options,
  value,
  onChange,
  disabled = false,
  className,
  size = 'default',
}: ToggleGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md bg-muted/50 p-0.5',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          title={option.label}
          className={cn(
            'inline-flex items-center justify-center rounded-sm transition-all',
            size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

// Multi-select toggle (for B/I/U/S style toggles)
interface ToggleButtonGroupProps {
  options: ToggleGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default';
}

export function ToggleButtonGroup({
  options,
  value = [],
  onChange,
  disabled = false,
  className,
  size = 'default',
}: ToggleButtonGroupProps) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md bg-muted/50 p-0.5 gap-0.5',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleToggle(option.value)}
          disabled={disabled}
          title={option.label}
          className={cn(
            'inline-flex items-center justify-center rounded-sm transition-all',
            size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
            value.includes(option.value)
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
