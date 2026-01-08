/**
 * useResizable - Hook for resizable panel functionality
 * 
 * Provides mouse drag handling for panel resize with:
 * - Min/max constraints
 * - Optional localStorage persistence
 * - Cursor management during drag
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseResizableOptions {
  /** Initial width in pixels */
  defaultWidth: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** localStorage key for persistence (optional) */
  storageKey?: string;
  /** Direction: 'left' means handle on left edge, 'right' means handle on right edge */
  direction?: 'left' | 'right';
}

interface UseResizableReturn {
  /** Current width */
  width: number;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Props to spread on the resize handle element */
  handleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
    className: string;
  };
  /** Reset to default width */
  reset: () => void;
}

export function useResizable({
  defaultWidth,
  minWidth = 200,
  maxWidth = 600,
  storageKey,
  direction = 'right',
}: UseResizableOptions): UseResizableReturn {
  // Load initial width from storage or use default
  const getInitialWidth = () => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    }
    return defaultWidth;
  };

  const [width, setWidth] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Clamp value within bounds
  const clamp = useCallback(
    (value: number) => Math.min(maxWidth, Math.max(minWidth, value)),
    [minWidth, maxWidth]
  );

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsResizing(true);
      startX.current = e.clientX;
      startWidth.current = width;

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  // Handle mouse move and mouse up
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current;
      // For left-side handle, moving right shrinks; for right-side handle, moving right expands
      const newWidth = direction === 'left'
        ? startWidth.current - deltaX
        : startWidth.current + deltaX;
      
      setWidth(clamp(newWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Persist to storage
      if (storageKey) {
        localStorage.setItem(storageKey, String(width));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, clamp, storageKey, width]);

  // Save on width change (debounced via mouseup)
  useEffect(() => {
    if (storageKey && !isResizing) {
      localStorage.setItem(storageKey, String(width));
    }
  }, [width, storageKey, isResizing]);

  const reset = useCallback(() => {
    setWidth(defaultWidth);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [defaultWidth, storageKey]);

  const handleProps = {
    onMouseDown: handleMouseDown,
    style: {
      cursor: 'col-resize',
    } as React.CSSProperties,
    className: `absolute top-0 bottom-0 w-1.5 z-20 transition-colors duration-150 hover:bg-primary/25 ${
      isResizing ? 'bg-primary/40' : ''
    } ${
      direction === 'left' ? 'left-0 -ml-0.5' : 'right-0 -mr-0.5'
    }`,
  };

  return {
    width,
    isResizing,
    handleProps,
    reset,
  };
}
