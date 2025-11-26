export interface ComponentCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'functions' | 'stores-utility' | 'marketplace' | 'node-files';
  isFavorite?: boolean;
}

export interface WidgetSchema {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  componentType: string;
  config?: Record<string, any>;
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
