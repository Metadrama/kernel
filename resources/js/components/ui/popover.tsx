'use client';

/**
 * Lightweight Popover (no external deps)
 *
 * Purpose:
 * - Provide a small, dependency-free popover primitive suitable for simple menus/panels
 *   (e.g., IDE-style version control strip).
 *
 * Features:
 * - Controlled/uncontrolled open state
 * - Anchor alignment: start/center/end
 * - Side: top/bottom/left/right with offset
 * - Click-outside + Escape to close
 * - Minimal focus handling (focus first focusable element on open)
 *
 * Notes:
 * - This is intentionally minimal and not a full replacement for Radix Popover.
 * - Rendering uses a fixed-position layer attached to `document.body` for reliable overlaying.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

type PopoverContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  contentId: string;
  triggerId: string;
};

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined);

function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover components must be used within <Popover>.');
  return ctx;
}

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof open === 'boolean';
  const actualOpen = isControlled ? (open as boolean) : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const reactId = useId();
  const value = useMemo<PopoverContextValue>(
    () => ({
      open: actualOpen,
      setOpen,
      anchorEl,
      setAnchorEl,
      contentId: `popover-content-${reactId}`,
      triggerId: `popover-trigger-${reactId}`,
    }),
    [actualOpen, anchorEl, reactId, setOpen]
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

type TriggerChildProps = {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  id?: string;
  tabIndex?: number;
  role?: string;
  'aria-haspopup'?: React.AriaAttributes['aria-haspopup'];
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
};

export type PopoverTriggerProps = {
  children: React.ReactElement<TriggerChildProps>;
};

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, setOpen, setAnchorEl, contentId } = usePopoverContext();

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    children.props.onClick?.(e);
    setOpen(!open);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    children.props.onKeyDown?.(e);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(!open);
    }
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const refCallback = (node: HTMLElement | null) => {
    setAnchorEl(node);
    // We intentionally do not attempt to compose refs here to avoid typing issues.
  };

  return React.cloneElement(children, {
    id: children.props.id,
    ref: refCallback,
    tabIndex: children.props.tabIndex,
    role: children.props.role,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': contentId,
    onClick,
    onKeyDown,
  } as unknown as TriggerChildProps);
}

export type PopoverContentProps = {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
  children: React.ReactNode;
};

function getFocusable(root: HTMLElement): HTMLElement | null {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return (root.querySelector(selector) as HTMLElement | null) ?? null;
}

function computePosition(opts: {
  anchorRect: DOMRect;
  contentRect: DOMRect;
  side: Side;
  align: Align;
  sideOffset: number;
  alignOffset: number;
}): { left: number; top: number } {
  const { anchorRect, contentRect, side, align, sideOffset, alignOffset } = opts;

  let left = 0;
  let top = 0;

  const anchorMidX = anchorRect.left + anchorRect.width / 2;
  const anchorMidY = anchorRect.top + anchorRect.height / 2;

  // primary axis
  switch (side) {
    case 'bottom':
      top = anchorRect.bottom + sideOffset;
      break;
    case 'top':
      top = anchorRect.top - contentRect.height - sideOffset;
      break;
    case 'right':
      left = anchorRect.right + sideOffset;
      break;
    case 'left':
      left = anchorRect.left - contentRect.width - sideOffset;
      break;
  }

  // secondary axis alignment
  if (side === 'top' || side === 'bottom') {
    if (align === 'start') left = anchorRect.left + alignOffset;
    if (align === 'center') left = anchorMidX - contentRect.width / 2 + alignOffset;
    if (align === 'end') left = anchorRect.right - contentRect.width + alignOffset;
  } else {
    if (align === 'start') top = anchorRect.top + alignOffset;
    if (align === 'center') top = anchorMidY - contentRect.height / 2 + alignOffset;
    if (align === 'end') top = anchorRect.bottom - contentRect.height + alignOffset;
  }

  // clamp to viewport with small padding
  const pad = 8;
  left = Math.max(pad, Math.min(left, window.innerWidth - contentRect.width - pad));
  top = Math.max(pad, Math.min(top, window.innerHeight - contentRect.height - pad));

  return { left, top };
}

export function PopoverContent({
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
  alignOffset = 0,
  className,
  children,
}: PopoverContentProps) {
  const { open, setOpen, anchorEl, contentId, triggerId } = usePopoverContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!anchorEl || !contentRef.current) return;
    const anchorRect = anchorEl.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    setPosition(
      computePosition({
        anchorRect,
        contentRect,
        side,
        align,
        sideOffset,
        alignOffset,
      })
    );
  }, [align, alignOffset, anchorEl, side, sideOffset]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onResize = () => updatePosition();
    const onScroll = () => updatePosition();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const content = contentRef.current;
      if (content && content.contains(target)) return;
      if (anchorEl && anchorEl.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [anchorEl, open, setOpen]);

  useEffect(() => {
    if (!open) return;
    // Focus first focusable control for keyboard UX
    const el = contentRef.current;
    if (!el) return;
    const focusable = getFocusable(el);
    focusable?.focus();
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      id={contentId}
      role="dialog"
      aria-labelledby={triggerId}
      ref={contentRef}
      className={cn(
        'fixed z-[1000] min-w-[12rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className
      )}
      data-state={open ? 'open' : 'closed'}
      style={{
        left: position?.left ?? 0,
        top: position?.top ?? 0,
      }}
    >
      {children}
    </div>
  );

  // During SSR, `document` won't exist; but this component is client-only in practice.
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
