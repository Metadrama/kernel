import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft, Database, Table, Webhook, Code, FileText, BarChart3, Star, Layers, LayoutTemplate, FlaskConical, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import type { ComponentCard } from '@/types/dashboard';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Table,
  Webhook,
  Code,
  FileText,
  BarChart3,
  Layers,
  LayoutTemplate,
  FlaskConical,
  Type,
};

// Category configuration with display names and icons
const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  'test-components': { label: 'TEST COMPONENTS', icon: 'FlaskConical' },
};

// Subcategory configuration
const SUBCATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  'chart': { label: 'Chart', icon: 'BarChart3' },
  'text': { label: 'Text', icon: 'Type' },
};

export default function ComponentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['test-components', 'test-components/chart', 'test-components/text']);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const filterItems = (items: ComponentCard[]) =>
    items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredComponents = filterItems(AVAILABLE_COMPONENTS);

  // Group components by category and subcategory
  const groupedComponents = useMemo(() => {
    const groups: Record<string, Record<string, ComponentCard[]>> = {};

    for (const component of filteredComponents) {
      const category = component.category;
      const subcategory = component.subcategory || 'other';

      if (!groups[category]) {
        groups[category] = {};
      }
      if (!groups[category][subcategory]) {
        groups[category][subcategory] = [];
      }
      groups[category][subcategory].push(component);
    }

    return groups;
  }, [filteredComponents]);

  const renderComponentCard = (component: ComponentCard) => {
    const IconComponent = ICON_MAP[component.icon];
    return (
      <Card
        key={component.id}
        className="group cursor-grab p-3 transition-all duration-150 hover:bg-accent hover:shadow-md active:cursor-grabbing active:scale-[0.98] active:shadow-lg"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('application/json', JSON.stringify(component));
          const target = e.currentTarget as HTMLElement;
          target.style.opacity = '0.5';
        }}
        onDragEnd={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.opacity = '1';
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-sm">{component.name}</h3>
              <Star
                className={`h-4 w-4 shrink-0 ${component.isFavorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                  }`}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {component.description}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  if (isCollapsed) {
    return (
      <div className="flex h-screen w-12 flex-col border-r bg-background">
        <div className="flex h-14 items-center justify-center border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-80 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">BM://</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto">
        {/* Render categories with nested subcategories */}
        {Object.entries(groupedComponents).map(([category, subcategories]) => {
          const categoryConfig = CATEGORY_CONFIG[category] || { label: category.toUpperCase(), icon: 'Layers' };
          const CategoryIcon = ICON_MAP[categoryConfig.icon];
          const categoryKey = category;
          const isCategoryExpanded = expandedSections.includes(categoryKey);
          const totalInCategory = Object.values(subcategories).flat().length;

          return (
            <div key={category} className="border-b">
              {/* Category Header */}
              <button
                onClick={() => toggleSection(categoryKey)}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                {isCategoryExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {CategoryIcon && <CategoryIcon className="h-4 w-4 text-muted-foreground" />}
                {categoryConfig.label}
                <span className="ml-auto text-xs text-muted-foreground">
                  {totalInCategory}
                </span>
              </button>

              {/* Subcategories */}
              {isCategoryExpanded && (
                <div className="pb-2">
                  {Object.entries(subcategories).map(([subcategory, components]) => {
                    const subConfig = SUBCATEGORY_CONFIG[subcategory] || { label: subcategory, icon: 'Layers' };
                    const SubIcon = ICON_MAP[subConfig.icon];
                    const subKey = `${category}/${subcategory}`;
                    const isSubExpanded = expandedSections.includes(subKey);

                    return (
                      <div key={subcategory}>
                        {/* Subcategory Header */}
                        <button
                          onClick={() => toggleSection(subKey)}
                          className="flex w-full items-center gap-2 pl-8 pr-4 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          {isSubExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          {SubIcon && <SubIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="text-muted-foreground">{subConfig.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {components.length}
                          </span>
                        </button>

                        {/* Components in subcategory */}
                        {isSubExpanded && components.length > 0 && (
                          <div className="space-y-2 px-4 pl-10 py-2">
                            {components.map(renderComponentCard)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground text-center">
          Drag components onto the canvas or into widgets
        </p>
      </div>
    </div>
  );
}
