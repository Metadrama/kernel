export interface ComponentCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'components' | 'presets';
  isFavorite?: boolean;
}

// Instance of a component placed inside a widget
export interface WidgetComponent {
  instanceId: string;
  componentType: string;
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
  widgets: WidgetSchema[];
  createdAt: string;
  updatedAt: string;
}

export interface SidebarState {
  isCollapsed: boolean;
  expandedSections: string[];
}
