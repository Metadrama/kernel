import * as React from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  cursorPosition?: { x: number; y: number } | null;
}

export function DropdownMenu({ children, open, onOpenChange, cursorPosition }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const isControlled = typeof open === 'boolean';
  const actualOpen = isControlled ? open : internalOpen;

  const context = React.useMemo(
    () => ({
      open: actualOpen,
      setOpen: (value: boolean) => {
        if (isControlled) onOpenChange?.(value);
        else setInternalOpen(value);
      },
      triggerRef,
      cursorPosition,
    }),
    [actualOpen, isControlled, onOpenChange, cursorPosition]
  );

  return <DropdownMenuContext.Provider value={context}>{children}</DropdownMenuContext.Provider>;
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  cursorPosition?: { x: number; y: number } | null;
} | null>(null);

interface TriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
}

export function DropdownMenuTrigger({ asChild = false, children }: TriggerProps) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) return children;

  const props = {
    ref: (el: HTMLElement | null) => {
      if (ctx.triggerRef) {
        (ctx.triggerRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      ctx.setOpen(!ctx.open);
    },
  };

  return asChild ? React.cloneElement(children, props) : (
    <button {...props} className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-2 text-sm">
      {children}
    </button>
  );
}

interface ContentProps {
  align?: 'start' | 'center' | 'end';
  className?: string;
  children: React.ReactNode;
}

import { createPortal } from 'react-dom';

export function DropdownMenuContent({ align = 'start', className, children }: ContentProps) {
  const ctx = React.useContext(DropdownMenuContext);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null);

  React.useEffect(() => {
    if (ctx?.open) {
      // Use cursor position if provided (context menu), otherwise use trigger button
      if (ctx.cursorPosition) {
        setPosition({ left: ctx.cursorPosition.x, top: ctx.cursorPosition.y });
        setAnchorRect(null);
      } else if (ctx.triggerRef?.current) {
        const rect = ctx.triggerRef.current.getBoundingClientRect();
        setAnchorRect(rect);

        let left = rect.left;
        if (align === 'center') left = rect.left + rect.width / 2;
        if (align === 'end') left = rect.right;
        const top = rect.bottom + 8;

        setPosition({ left, top });
      }
    }
  }, [ctx?.open, ctx?.cursorPosition, align]);

  if (!ctx || !ctx.open || !position) return null;

  const content = (
    <div
      className={`fixed z-[1000] min-w-[16rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className || ''}`}
      style={{
        left: position.left,
        top: position.top,
        transform: anchorRect && align === 'center' ? 'translateX(-50%)' : anchorRect && align === 'end' ? 'translateX(-100%)' : undefined,
      }}
      role="menu"
    >
      {children}
    </div>
  );

  const overlay = (
    <div
      className="fixed inset-0 z-[999]"
      onClick={() => ctx.setOpen(false)}
      aria-hidden="true"
    />
  );

  return createPortal(
    <>
      {overlay}
      {content}
    </>,
    document.body
  );
}

interface ItemProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function DropdownMenuItem({ className, children, onClick }: ItemProps) {
  const ctx = React.useContext(DropdownMenuContext);
  return (
    <button
      className={`flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className || ''}`}
      onClick={() => {
        onClick?.();
        ctx?.setOpen(false);
      }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px w-full bg-muted" />;
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-2 py-1.5 text-xs font-medium text-muted-foreground ${className || ''}`}>{children}</div>;
}
