/**
 * Fill Section Component
 * Figma-style fill/color section with color swatch, hex, and opacity
 */

import { ColorInput } from '@/modules/DesignSystem/ui/color-input';

interface FillSectionProps {
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  disabled?: boolean;
}

export function FillSection({
  color,
  opacity,
  onColorChange,
  onOpacityChange,
  disabled,
}: FillSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between w-full">
        <ColorInput
          color={color || '#000000'}
          opacity={opacity ?? 100}
          onChange={onColorChange}
          onOpacityChange={onOpacityChange}
          showOpacity={true}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
}
