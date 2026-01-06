import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ComponentCard } from '@/features/dashboard/types/dashboard';

/**
 * DragDropContext
 *
 * Why this exists:
 * - Relying on `DataTransfer.getData(...)` during `dragover` is unreliable in some browsers/framework setups.
 *   In practice, the payload is often empty on `dragover` (even though it works on `drop`).
 * - For live previews (ghost box) and snapping during drag-over, we need a reliable, in-memory source of truth.
 *
 * What this provides:
 * - The currently dragged sidebar component card (if any)
 * - A monotonically increasing "drag session id" to help consumers ignore stale events
 *
 * Coordinate space:
 * - This context is agnostic to coordinates; it only tracks the dragged payload.
 */

export interface DragSession {
  id: string;
  startedAt: number;
}

export interface DraggedComponent {
  component: ComponentCard;
  session: DragSession;
}

interface DragDropContextValue {
  dragged: DraggedComponent | null;

  /**
   * Begin a drag session for a component card.
   * Call this from sidebar `onDragStart`.
   */
  beginDrag: (component: ComponentCard) => void;

  /**
   * End the current drag session.
   * Call this from sidebar `onDragEnd`, and also defensively on successful `drop`.
   */
  endDrag: () => void;

  /**
   * Helper to get the dragged component without causing re-renders.
   * Useful for very high-frequency `dragover` handlers.
   */
  getDragged: () => DraggedComponent | null;
}

const DragDropContext = createContext<DragDropContextValue | undefined>(undefined);

function newSessionId(): string {
  // fast-enough unique id; do not depend on crypto
  return `drag-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [dragged, setDragged] = useState<DraggedComponent | null>(null);

  // Ref mirror to avoid stale closures and reduce re-render pressure in consumers.
  const draggedRef = useRef<DraggedComponent | null>(null);

  const beginDrag = useCallback((component: ComponentCard) => {
    const next: DraggedComponent = {
      component,
      session: { id: newSessionId(), startedAt: Date.now() },
    };
    draggedRef.current = next;
    setDragged(next);
  }, []);

  const endDrag = useCallback(() => {
    draggedRef.current = null;
    setDragged(null);
  }, []);

  const getDragged = useCallback(() => {
    return draggedRef.current;
  }, []);

  const value = useMemo<DragDropContextValue>(
    () => ({
      dragged,
      beginDrag,
      endDrag,
      getDragged,
    }),
    [dragged, beginDrag, endDrag, getDragged]
  );

  return <DragDropContext.Provider value={value}>{children}</DragDropContext.Provider>;
}

export function useDragDrop() {
  const ctx = useContext(DragDropContext);
  if (!ctx) throw new Error('useDragDrop must be used within a DragDropProvider');
  return ctx;
}

/**
 * Convenience hook for high-frequency read access (e.g., inside dragover).
 * This avoids subscribing the consumer to `dragged` state updates.
 */
export function useDraggedComponentRef() {
  const { getDragged } = useDragDrop();
  return getDragged;
}

