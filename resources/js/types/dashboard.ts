import type { GridPosition } from '@/lib/component-layout';
import type { ArtboardSchema } from './artboard';

export interface ComponentCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  subcategory?: string;
  isFavorite?: boolean;
}

// Instance of a component placed inside a widget
export interface WidgetComponent {
  instanceId: string;
  componentType: string;
  // Grid-based layout position (calculated by layout system if not provided)
  gridPosition?: GridPosition;
  // Component-specific configuration
  config?: Record<string, unknown>;
}

export interface WidgetSchema {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Support multiple components per widget
  components: WidgetComponent[];
  // Legacy single component support (deprecated)
  componentType?: string;
  config?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  // Artboards contain widgets (new architecture)
  artboards: ArtboardSchema[];
  // Legacy: Direct widgets on canvas (deprecated, kept for backward compatibility)
  widgets?: WidgetSchema[];
  createdAt: string;
  updatedAt: string;
}

export interface SidebarState {
  isCollapsed: boolean;
  expandedSections: string[];
}
