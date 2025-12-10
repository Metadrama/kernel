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
  // Freeform pixel positioning (relative to widget container)
  x: number;
  y: number;
  width: number;
  height: number;
  // Stacking order (higher = on top)
  zIndex?: number;
  // Optional: prevent auto-repositioning
  locked?: boolean;
  // Component-specific configuration
  config?: Record<string, unknown>;
}


export interface WidgetSchema {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Stacking order (higher = on top)
  zIndex?: number;
  // Canvas-space position (only for archived widgets on canvas)
  canvasX?: number;
  canvasY?: number;
  // Source artboard ID (for undo/restore from archive)
  sourceArtboardId?: string;
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
