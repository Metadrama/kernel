'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PanelHeader
 *
 * A reusable, consistent header row for side panels / drawers / inspectors.
 *
 * Design goals:
 * - Consistent height across panels: 56px (`h-14`)
 * - Consistent horizontal padding: 16px (`px-4`)
 * - Border bottom + subtle background compatibility
 * - Flexible left (title/leading) and right (actions/close) slots
 *
 * Usage:
 * <PanelHeader
 *   title="Artboard Inspector"
 *   right={<Button ...>Close</Button>}
 * />
 *
 * <PanelHeader
 *   left={<div className="flex items-center gap-2">...</div>}
 *   right={<Button variant="ghost" size="icon">...</Button>}
 * />
 */
export interface PanelHeaderProps {
  /**
   * Optional title string (renders as default left content).
   * If you provide `left`, it takes precedence over `title`.
   */
  title?: string;

  /**
   * Custom left content. Use this for icons + title, breadcrumbs, etc.
   */
  left?: React.ReactNode;

  /**
   * Right-side content (close button, actions).
   */
  right?: React.ReactNode;

  /**
   * Optional subheader row rendered below the main header line.
   * If provided, the header becomes taller than `h-14` to accommodate.
   */
  subheader?: React.ReactNode;

  /**
   * Optional className for the outer container.
   */
  className?: string;

  /**
   * Optional className for the main row (height/padding row).
   */
  rowClassName?: string;

  /**
   * Optional className for the title (when `title` is used).
   */
  titleClassName?: string;

  /**
   * Optional aria-label for the header region (defaults to title if provided).
   */
  ariaLabel?: string;
}

export function PanelHeader({
  title,
  left,
  right,
  subheader,
  className,
  rowClassName,
  titleClassName,
  ariaLabel,
}: PanelHeaderProps) {
  const label = ariaLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <div
      className={cn('shrink-0 border-b bg-background', className)}
      role="region"
      aria-label={label}
    >
      <div className={cn('flex h-14 items-center justify-between px-4', rowClassName)}>
        <div className="min-w-0 flex-1">
          {left ?? (title ? <div className={cn('truncate text-sm font-semibold', titleClassName)}>{title}</div> : null)}
        </div>

        {right ? <div className="ml-3 flex shrink-0 items-center gap-2">{right}</div> : null}
      </div>

      {subheader ? <div className="px-4 pb-3">{subheader}</div> : null}
    </div>
  );
}

export default PanelHeader;
