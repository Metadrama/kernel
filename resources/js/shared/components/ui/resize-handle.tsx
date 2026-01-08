/**
 * ResizeHandle - Visual resize handle component
 * 
 * A thin vertical bar that appears on hover and indicates
 * the resize drag zone between panels.
 */

import { cn } from '@/shared/lib/utils';

interface ResizeHandleProps {
  /** Props from useResizable hook */
  onMouseDown: (e: React.MouseEvent) => void;
  /** Whether resize is active */
  isResizing?: boolean;
  /** Position: 'left' or 'right' edge of panel */
  position?: 'left' | 'right';
  /** Additional className */
  className?: string;
}

export function ResizeHandle({
  onMouseDown,
  isResizing = false,
  position = 'right',
  className,
}: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'absolute top-0 bottom-0 z-20 w-1 cursor-col-resize',
        'transition-colors duration-150',
        'hover:bg-primary/30',
        isResizing && 'bg-primary/40',
        position === 'left' ? 'left-0' : 'right-0',
        className
      )}
      title="Drag to resize"
    >
      {/* Visual indicator line - appears on hover */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full',
          'bg-muted-foreground/30 opacity-0 transition-opacity',
          'group-hover:opacity-100',
          isResizing && 'opacity-100 bg-primary/60',
          position === 'left' ? 'left-0' : 'right-0'
        )}
      />
    </div>
  );
}
