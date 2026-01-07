/**
 * Color Input Component
 * Figma-style color picker with swatch and opacity
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface ColorInputProps {
  color: string;
  opacity?: number;
  onChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  showOpacity?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ColorInput({
  color,
  opacity = 100,
  onChange,
  onOpacityChange,
  showOpacity = true,
  disabled = false,
  className,
}: ColorInputProps) {
  const [isVisible, setIsVisible] = React.useState(opacity > 0);

  const handleOpacityToggle = () => {
    if (onOpacityChange) {
      const newOpacity = opacity > 0 ? 0 : 100;
      onOpacityChange(newOpacity);
      setIsVisible(newOpacity > 0);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-muted/50 px-2 h-8',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {/* Color Swatch */}
      <div className="relative">
        <input
          type="color"
          value={color || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
        />
        <div
          className="w-5 h-5 rounded border border-border shadow-sm"
          style={{ backgroundColor: color || '#000000' }}
        />
      </div>

      {/* Hex Value */}
      <input
        type="text"
        value={(color || '#000000').replace('#', '').toUpperCase()}
        onChange={(e) => {
          const hex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
          if (hex.length === 6) {
            onChange(`#${hex}`);
          }
        }}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm outline-none min-w-0 uppercase"
        maxLength={6}
        placeholder="000000"
      />

      {/* Opacity */}
      {showOpacity && onOpacityChange && (
        <>
          <div className="w-px h-4 bg-border" />
          <input
            type="number"
            value={Math.round(opacity)}
            onChange={(e) => {
              const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
              onOpacityChange(val);
            }}
            disabled={disabled}
            className="w-10 bg-transparent text-sm text-right outline-none"
            min={0}
            max={100}
          />
          <span className="text-muted-foreground text-sm">%</span>
          
          {/* Visibility Toggle */}
          <button
            type="button"
            onClick={handleOpacityToggle}
            disabled={disabled}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {opacity > 0 ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
