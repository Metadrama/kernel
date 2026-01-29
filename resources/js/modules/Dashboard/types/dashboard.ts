/**
 * Dashboard Data Types
 * 
 * Figma-style direct manipulation architecture.
 * Components are placed directly on artboards with absolute pixel positioning.
 */

import type { Artboard } from '@/modules/Artboard/types/artboard';

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

// Moved ComponentPosition and ArtboardComponent to @/features/artboard/types/artboard

/**
 * Dashboard layout containing artboards
 */
export interface DashboardLayout {
  id: string;
  name: string;
  artboards: Artboard[];
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

