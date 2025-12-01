import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ArrowLeft, PanelLeftClose, PanelLeft, Database, Table, Webhook, Code, FileText, BarChart3, Star, Layers, LayoutTemplate, FlaskConical, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import type { ComponentCard } from '@/types/dashboard';
import { ScrollArea } from '@/components/ui/scroll-area';

type NavLevel =
  | { view: 'root' }
  | { view: 'category'; category: string }
  | { view: 'subcategory'; category: string; subcategory: string };

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
  const [navStack, setNavStack] = useState<NavLevel[]>([{ view: 'root' }]);

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

  const filterItems = (items: ComponentCard[]) =>
    items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredComponents = useMemo(() => filterItems(AVAILABLE_COMPONENTS), [searchQuery]);

  const groupedComponents = useMemo(() => {
    const groups: Record<string, Record<string, ComponentCard[]>> = {};

    for (const component of AVAILABLE_COMPONENTS) {
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
  }, []);

  const getCategoryLabel = (category: string) =>
    CATEGORY_CONFIG[category]?.label || category.toUpperCase();

  const getSubcategoryLabel = (subcategory: string) =>
    SUBCATEGORY_CONFIG[subcategory]?.label || subcategory;

  const isSameLevel = (a: NavLevel, b: NavLevel) => {
    if (a.view !== b.view) return false;
    if (a.view === 'root') return true;
    if (a.view === 'category' && b.view === 'category') {
      return a.category === b.category;
    }
    if (a.view === 'subcategory' && b.view === 'subcategory') {
      return a.category === b.category && a.subcategory === b.subcategory;
    }
    return false;
  };

  const pushLevel = (nextLevel: NavLevel) => {
    setNavStack(prev => {
      const last = prev[prev.length - 1];
      if (isSameLevel(last, nextLevel)) {
        return prev;
      }
      return [...prev, nextLevel];
    });
  };

  const currentLevel = navStack[navStack.length - 1];

  const breadcrumbs = useMemo(() => {
    return navStack.map((level, index) => {
      let label = 'Components';
      if (level.view === 'category') {
        label = getCategoryLabel(level.category);
      } else if (level.view === 'subcategory') {
        label = getSubcategoryLabel(level.subcategory);
      }
      return {
        label,
        level,
        index,
        isCurrent: index === navStack.length - 1,
      };
    });
  }, [navStack]);

  const stackLength = Math.max(navStack.length, 1);
  const activeIndex = stackLength - 1;
  const sliderStyle = {
    width: `${stackLength * 100}%`,
    transform: `translateX(-${(activeIndex / stackLength) * 100}%)`,
  };
  const pageStyle = {
    width: `${100 / stackLength}%`,
  };

  const currentCount = useMemo(() => {
    if (currentLevel.view === 'root') {
      return AVAILABLE_COMPONENTS.length;
    }
    if (currentLevel.view === 'category') {
      const subcategories = groupedComponents[currentLevel.category] || {};
      return Object.values(subcategories).reduce((acc, components) => acc + components.length, 0);
    }
    const subcategoryComponents = groupedComponents[currentLevel.category]?.[currentLevel.subcategory];
    return subcategoryComponents ? subcategoryComponents.length : 0;
  }, [currentLevel, groupedComponents]);
  const canGoBack = navStack.length > 1;
  const isSearching = searchQuery.trim().length > 0;

  const handleCategorySelect = (category: string) => {
    pushLevel({ view: 'category', category });
  };

  const handleSubcategorySelect = (category: string, subcategory: string) => {
    pushLevel({ view: 'subcategory', category, subcategory });
  };

  const handleBack = () => {
    if (!canGoBack) return;
    setNavStack(prev => prev.slice(0, -1));
  };

  const handleBreadcrumbClick = (targetIndex: number) => {
    setNavStack(prev => {
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      return prev.slice(0, targetIndex + 1);
    });
  };

  const renderComponentCard = (component: ComponentCard) => {
    const IconComponent = ICON_MAP[component.icon];

    return (
      <button
        key={component.id}
        className="group flex w-full flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
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
        <div className="flex w-full items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
            {IconComponent && <IconComponent className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{component.name}</span>
              <Star
                className={`h-4 w-4 shrink-0 ${component.isFavorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{component.description}</p>
          </div>
        </div>
      </button>
    );
  };

  if (isCollapsed) {
    return (
      <div className="flex h-screen w-12 flex-col border-r bg-card">
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
    <div className="flex h-screen w-80 flex-col border-r bg-card shadow-sm">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
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
      <div className="border-b p-4 shrink-0 bg-card/95">
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

      {/* Page Navigation Controls */}
      <div className="border-b bg-card/95 px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
        {isSearching ? (
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold">Search results</span>
            <span className="text-xs text-muted-foreground">{filteredComponents.length}</span>
          </div>
        ) : (
          <div className="flex w-full items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={!canGoBack}
              className="h-7 w-7"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-1 items-center gap-1 overflow-hidden text-xs font-medium">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {crumb.isCurrent ? (
                    <span className="truncate text-sm text-foreground">{crumb.label}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBreadcrumbClick(index)}
                      className="truncate text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {crumb.label}
                    </button>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{currentCount}</span>
          </div>
        )}
      </div>

      {/* Component List */}
      <ScrollArea className="flex-1">
        {isSearching ? (
          <div className="space-y-3 px-4 py-5">
            {filteredComponents.length === 0 && (
              <p className="text-xs text-muted-foreground">No components match your search.</p>
            )}
            {filteredComponents.map(renderComponentCard)}
          </div>
        ) : (
          <div className="min-h-full overflow-hidden">
            <div
              className="flex min-h-full transition-transform duration-300 ease-in-out"
              style={sliderStyle}
            >
              {navStack.map((level, idx) => (
                <div
                  key={`${level.view}-${idx}-${'category' in level ? level.category : 'root'}-${'subcategory' in level ? level.subcategory : 'all'}`}
                  className="shrink-0 px-4 py-5"
                  style={pageStyle}
                >
                  {level.view === 'root' && (
                    <div className="space-y-3">
                      <p className="text-xs uppercase text-muted-foreground">Browse categories</p>
                      <div className="space-y-2">
                        {Object.entries(groupedComponents).map(([category, subcategories]) => {
                          const categoryConfig = CATEGORY_CONFIG[category] || { label: category.toUpperCase(), icon: 'Layers' };
                          const CategoryIcon = ICON_MAP[categoryConfig.icon];
                          const totalInCategory = Object.values(subcategories).reduce((acc, components) => acc + components.length, 0);

                          return (
                            <button
                              key={category}
                              onClick={() => handleCategorySelect(category)}
                              className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-muted/30 px-3 py-3 text-left transition hover:bg-muted/60"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 text-muted-foreground">
                                {CategoryIcon && <CategoryIcon className="h-4 w-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{categoryConfig.label}</p>
                                <p className="text-xs text-muted-foreground">{totalInCategory} components</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {level.view === 'category' && (
                    <div className="space-y-3">
                      <p className="text-xs uppercase text-muted-foreground">Select a subcategory</p>
                      <div className="space-y-2">
                        {Object.entries(groupedComponents[level.category] || {}).map(([subcategory, components]) => {
                          const subConfig = SUBCATEGORY_CONFIG[subcategory] || { label: subcategory, icon: 'Layers' };
                          const SubIcon = ICON_MAP[subConfig.icon];

                          return (
                            <button
                              key={subcategory}
                              onClick={() => handleSubcategorySelect(level.category, subcategory)}
                              className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-muted/30 px-3 py-3 text-left transition hover:bg-muted/60"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 text-muted-foreground">
                                {SubIcon && <SubIcon className="h-4 w-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{subConfig.label}</p>
                                <p className="text-xs text-muted-foreground">{components.length} components</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          );
                        })}
                        {Object.keys(groupedComponents[level.category] || {}).length === 0 && (
                          <p className="text-xs text-muted-foreground">No subcategories available.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {level.view === 'subcategory' && (
                    <div className="space-y-3">
                      <p className="text-xs uppercase text-muted-foreground">Components</p>
                      <div className="space-y-2">
                        {(groupedComponents[level.category]?.[level.subcategory] || []).map(renderComponentCard)}
                        {(!groupedComponents[level.category]?.[level.subcategory] || groupedComponents[level.category]?.[level.subcategory].length === 0) && (
                          <p className="text-xs text-muted-foreground">No components available in this subcategory.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer hint */}
      <div className="border-t p-3 shrink-0 bg-card/95">
        <p className="text-xs text-muted-foreground text-center">
          Drag components onto the canvas or into widgets
        </p>
      </div>
    </div>
  );
}
