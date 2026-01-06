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

import React from 'react';
import { getGuideBounds } from '@/features/artboard/lib/alignment-helpers';
import type { AlignmentGuide, ComponentBounds } from '@/features/artboard/lib/alignment-helpers';

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

        if (guide.type === 'vertical') {
          const top = start;
          const height = Math.max(0, end - start);

          return (
            <div
              key={`v-${guide.position}`}
              className="absolute"
              style={{
                left: guide.position,
                top,
                width: thicknessPx,
                height,
                backgroundColor: color,
                opacity,
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
            className="absolute"
            style={{
              top: guide.position,
              left,
              height: thicknessPx,
              width,
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

