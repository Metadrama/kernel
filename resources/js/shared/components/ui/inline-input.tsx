/**
 * Inline Input Component
 * Compact number/text input for Figma-style inspector panels
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface InlineInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  suffix?: string;
  prefix?: string;
  size?: 'sm' | 'default';
}

export function InlineInput({
  value,
  onChange,
  label,
  suffix,
  prefix,
  className,
  type = 'text',
  size = 'default',
  ...props
}: InlineInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (type === 'number') {
      onChange(newValue === '' ? '' : Number(newValue));
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex items-center rounded-md bg-muted/50 border border-transparent',
          'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20',
          size === 'sm' ? 'h-6 px-1.5 text-xs' : 'h-7 px-2 text-sm'
        )}
      >
        {prefix && (
          <span className="text-muted-foreground mr-1 select-none">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          className={cn(
            'flex-1 bg-transparent outline-none min-w-0',
            'placeholder:text-muted-foreground/50',
            type === 'number' && 'text-right'
          )}
          {...props}
        />
        {suffix && (
          <span className="text-muted-foreground ml-1 select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// Two inputs side by side
interface InlineInputPairProps {
  leftLabel?: string;
  rightLabel?: string;
  leftValue: string | number;
  rightValue: string | number;
  onLeftChange: (value: string | number) => void;
  onRightChange: (value: string | number) => void;
  leftPrefix?: string;
  rightPrefix?: string;
  leftSuffix?: string;
  rightSuffix?: string;
  leftType?: 'text' | 'number';
  rightType?: 'text' | 'number';
  className?: string;
}

export function InlineInputPair({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  leftPrefix,
  rightPrefix,
  leftSuffix,
  rightSuffix,
  leftType = 'number',
  rightType = 'number',
  className,
}: InlineInputPairProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <InlineInput
        label={leftLabel}
        value={leftValue}
        onChange={onLeftChange}
        prefix={leftPrefix}
        suffix={leftSuffix}
        type={leftType}
        className="flex-1"
      />
      <InlineInput
        label={rightLabel}
        value={rightValue}
        onChange={onRightChange}
        prefix={rightPrefix}
        suffix={rightSuffix}
        type={rightType}
        className="flex-1"
      />
    </div>
  );
}
