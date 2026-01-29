/**
 * Position Section Component
 * Figma-style 2x2 grid for position (X, Y) and dimensions (W, H)
 * Plus rotation input
 */

import { RotateCw } from 'lucide-react';
import { InlineScrubInput } from '@/modules/DesignSystem/ui/number-scrub-input';
import type { ComponentPosition } from '@/modules/Artboard/types/artboard';

interface PositionSectionProps {
  position: ComponentPosition;
  onChange: (updates: Partial<ComponentPosition>) => void;
  disabled?: boolean;
}

export function PositionSection({ position, onChange, disabled }: PositionSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {/* X */}
      <InlineScrubInput
        label="X"
        value={Math.round(position.x)}
        onChange={(x) => onChange({ x })}
        step={1}
        disabled={disabled}
      />
      {/* Y */}
      <InlineScrubInput
        label="Y"
        value={Math.round(position.y)}
        onChange={(y) => onChange({ y })}
        step={1}
        disabled={disabled}
      />
      {/* W */}
      <InlineScrubInput
        label="W"
        value={Math.round(position.width)}
        onChange={(width) => onChange({ width: Math.max(10, width) })}
        min={10}
        step={1}
        disabled={disabled}
      />
      {/* H */}
      <InlineScrubInput
        label="H"
        value={Math.round(position.height)}
        onChange={(height) => onChange({ height: Math.max(10, height) })}
        min={10}
        step={1}
        disabled={disabled}
      />
      {/* Rotation */}
      <InlineScrubInput
        label={<RotateCw className="w-3.5 h-3.5" />}
        value={position.rotation ?? 0}
        onChange={(rotation) => onChange({ rotation: rotation % 360 })}
        suffix="°"
        step={1}
        min={-360}
        max={360}
        disabled={disabled}
      />
    </div>
  );
}
