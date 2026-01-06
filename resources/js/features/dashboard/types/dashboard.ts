/**
 * Dashboard Data Types
 * 
 * Figma-style direct manipulation architecture.
 * Components are placed directly on artboards with absolute pixel positioning.
 */

import type { ArtboardSchema } from '@/features/artboard/types/artboard';

/**
 * Component card in sidebar (catalog of available components)
 */
export interface ComponentCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  subcategory?: string;
  isFavorite?: boolean;
}

/**
 * Absolute position and size in pixels
 */
export interface ComponentPosition {
  x: number;           // Absolute X coordinate in pixels (relative to artboard)
  y: number;           // Absolute Y coordinate in pixels (relative to artboard)
  width: number;       // Width in pixels
  height: number;      // Height in pixels
  zIndex: number;      // Stacking order (higher = on top)
  rotation?: number;   // Rotation in degrees (0-360) - reserved for future
}

/**
 * Component instance placed on an artboard
 */
export interface ArtboardComponent {
  instanceId: string;
  componentType: string;
  position: ComponentPosition;
  config: Record<string, unknown>;
  locked?: boolean;    // If true, prevents drag/resize
}

/**
 * Dashboard layout containing artboards
 */
export interface DashboardLayout {
  id: string;
  name: string;
  artboards: ArtboardSchema[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Sidebar state
 */
export interface SidebarState {
  isCollapsed: boolean;
  expandedSections: string[];
}

