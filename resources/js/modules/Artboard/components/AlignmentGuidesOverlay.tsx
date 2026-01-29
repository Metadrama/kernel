/**
 * AlignmentGuidesOverlay
 *
 * Renders smart alignment guides in *artboard space*.
 *
 * Expected coordinate space:
 * - `guides` positions, and `components` bounds are all in the same artboard-local pixel space
 *   (i.e., the same coordinate space used for component positioning within an artboard).
 *
 * Rendering:
 * - This component should be placed inside the artboard container, above the components layer,
 *   and clipped by the artboard (e.g. parent has `overflow: hidden` when clip is enabled).
 */

import React, { useEffect, useRef, useState } from 'react';
import { getGuideBounds } from '@/modules/Artboard/lib/alignment-helpers';
import type { AlignmentGuide, ComponentBounds } from '@/modules/Artboard/lib/alignment-helpers';

export interface AlignmentGuidesOverlayProps {
  /**
   * Active alignment guides to render.
   * Pass an empty array to render nothing.
   */
  guides: AlignmentGuide[];

  /**
   * Bounds for the involved components (typically all components on the artboard).
   * Used to compute the visible extent of each guide line.
   */
  components: ComponentBounds[];

  /**
   * Visual customization (optional).
   */
  color?: string;
  thicknessPx?: number;
  opacity?: number;
  zIndex?: number;
}

export default function AlignmentGuidesOverlay({
  guides,
  components,
  color = 'rgb(59 130 246)', // Tailwind blue-500
  thicknessPx = 1,
  opacity = 0.7,
  zIndex = 60,
}: AlignmentGuidesOverlayProps) {
  // Track guides for snap feedback animation
  const prevGuidesRef = useRef<string[]>([]);
  const [newGuideKeys, setNewGuideKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentKeys = guides.map((g) => `${g.type}-${g.position}`);
    const prevKeys = prevGuidesRef.current;

    // Find newly added guides
    const newKeys = currentKeys.filter((k) => !prevKeys.includes(k));

    if (newKeys.length > 0) {
      setNewGuideKeys(new Set(newKeys));
      // Clear the "new" state after animation
      const timer = setTimeout(() => setNewGuideKeys(new Set()), 200);
      return () => clearTimeout(timer);
    }

    prevGuidesRef.current = currentKeys;
  }, [guides]);

  if (!guides || guides.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex,
      }}
      aria-hidden="true"
    >
      {guides.map((guide) => {
        const { start, end } = getGuideBounds(guide, components);
        const guideKey = `${guide.type}-${guide.position}`;
        const isNew = newGuideKeys.has(guideKey);

        if (guide.type === 'vertical') {
          const top = start;
          const height = Math.max(0, end - start);

          return (
            <div
              key={`v-${guide.position}`}
              className="absolute transition-all duration-150 ease-out"
              style={{
                left: guide.position,
                top,
                width: thicknessPx,
                height,
                backgroundColor: color,
                opacity: isNew ? 1 : opacity,
                boxShadow: isNew ? `0 0 8px ${color}` : undefined,
                transform: isNew ? 'scaleY(1.02)' : undefined,
              }}
            />
          );
        }

        // horizontal
        const left = start;
        const width = Math.max(0, end - start);

        return (
          <div
            key={`h-${guide.position}`}
            className="absolute transition-all duration-150 ease-out"
            style={{
              top: guide.position,
              left,
              height: thicknessPx,
              width,
              backgroundColor: color,
              opacity: isNew ? 1 : opacity,
              boxShadow: isNew ? `0 0 8px ${color}` : undefined,
              transform: isNew ? 'scaleX(1.02)' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

