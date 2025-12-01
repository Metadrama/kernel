import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock, PanelLeftClose, PanelLeft, Database, Table, Webhook, Code, FileText, BarChart3, Star, Layers, LayoutTemplate, FlaskConical, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import type { ComponentCard, WidgetSchema } from '@/types/dashboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ArtboardSchema } from '@/types/artboard';
import { useArtboardContext } from '@/context/ArtboardContext';

type NavLevel =
  | { view: 'root' }
  | { view: 'category'; category: string };

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
  const {
    artboards,
    setArtboards,
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
    moveArtboardLayer,
  } = useArtboardContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navStack, setNavStack] = useState<NavLevel[]>([{ view: 'root' }]);
  const [activePanel, setActivePanel] = useState<'components' | 'layers'>('components');

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

  const isSameLevel = (a: NavLevel, b: NavLevel) => {
    if (a.view !== b.view) return false;
    if (a.view === 'root') return true;
    if (a.view === 'category' && b.view === 'category') {
      return a.category === b.category;
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
      }
      return {
        label,
        level,
        index,
        isCurrent: index === navStack.length - 1,
      };
    });
  }, [navStack]);


  const currentCount = useMemo(() => {
    if (currentLevel.view === 'root') {
      return AVAILABLE_COMPONENTS.length;
    }
    const subcategories = groupedComponents[currentLevel.category] || {};
    return Object.values(subcategories).reduce((acc, components) => acc + components.length, 0);
  }, [currentLevel, groupedComponents]);
  const canGoBack = navStack.length > 1;
  const isSearching = searchQuery.trim().length > 0;

  const handleCategorySelect = (category: string) => {
    pushLevel({ view: 'category', category });
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

  const componentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const component of AVAILABLE_COMPONENTS) {
      map[component.id] = component.name;
    }
    return map;
  }, []);

  const artboardOrder = useMemo(() => {
    if (artboardStackOrder.length > 0) {
      return artboardStackOrder;
    }
    return artboards.map((artboard) => artboard.id);
  }, [artboardStackOrder, artboards]);

  const orderedArtboards = useMemo(() => {
    const resolved = artboardOrder
      .map((id) => artboards.find((artboard) => artboard.id === id))
      .filter((artboard): artboard is ArtboardSchema => Boolean(artboard));
    return resolved.reverse();
  }, [artboards, artboardOrder]);

  const toggleArtboardVisibility = (artboardId: string) => {
    setArtboards((prev) =>
      prev.map((artboard) =>
        artboard.id === artboardId ? { ...artboard, visible: !artboard.visible } : artboard
      )
    );
  };

  const toggleArtboardLock = (artboardId: string) => {
    setArtboards((prev) =>
      prev.map((artboard) =>
        artboard.id === artboardId ? { ...artboard, locked: !artboard.locked } : artboard
      )
    );
  };

  const selectArtboardFromLayers = (artboardId: string) => {
    setSelectedArtboardId(artboardId);
    bringArtboardToFront(artboardId);
  };

  const handleLayerMove = (artboardId: string, direction: 'up' | 'down') => {
    moveArtboardLayer(artboardId, direction);
  };

  const getWidgetLabel = (widget: WidgetSchema, index: number) => {
    if (widget.components.length > 0) {
      const primary = widget.components[0];
      const name = componentNameMap[primary.componentType] || primary.componentType;
      return name;
    }

    if (widget.componentType) {
      return componentNameMap[widget.componentType] || widget.componentType;
    }

    return `Layer ${index + 1}`;
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

      {/* Mode Switch */}
      <div className="border-b bg-card/95 px-4 py-2.5">
        <div className="grid grid-cols-2 gap-2">
          {(['components', 'layers'] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => setActivePanel(panel)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                activePanel === panel
                  ? 'border-foreground/40 bg-background text-foreground shadow-sm'
                  : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {panel === 'components' ? 'Components' : 'Layers'}
            </button>
          ))}
        </div>
      </div>

      {activePanel === 'components' && (
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
      )}

      {activePanel === 'components' ? (
        <>
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
                  style={{ transform: `translateX(-${(navStack.length - 1) * 100}%)` }}
                >
                  {navStack.map((level, idx) => (
                    <div
                      key={`${level.view}-${idx}-${'category' in level ? level.category : 'root'}`}
                      className="min-w-full shrink-0 px-4 py-5"
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
                                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted/60"
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
                        <div className="space-y-4">
                          <p className="text-xs uppercase text-muted-foreground">Components</p>
                          <div className="space-y-3">
                            {Object.entries(groupedComponents[level.category] || {}).map(([subcategory, components], subIndex) => {
                              const subConfig = SUBCATEGORY_CONFIG[subcategory] || { label: subcategory, icon: 'Layers' };
                              const SubIcon = ICON_MAP[subConfig.icon];

                              return (
                                <div
                                  key={subcategory}
                                  className={`space-y-2 ${subIndex === 0 ? '' : 'border-t border-border/60 pt-3'}`}
                                >
                                  <div className="flex items-center gap-3 px-1 text-muted-foreground">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80">
                                      {SubIcon && <SubIcon className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-1 items-center justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{subConfig.label}</p>
                                        <p className="text-xs text-muted-foreground">{components.length} components</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {components.map(renderComponentCard)}
                                  </div>
                                </div>
                              );
                            })}
                            {Object.keys(groupedComponents[level.category] || {}).length === 0 && (
                              <p className="text-xs text-muted-foreground">No components available in this category.</p>
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
        </>
      ) : (
        <>
          <div className="border-b bg-card/95 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
            <span>Layer stack</span>
            <span>{artboards.length} {artboards.length === 1 ? 'artboard' : 'artboards'}</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-3 px-4 py-5">
              {orderedArtboards.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add an artboard to start managing layers.</p>
              ) : (
                orderedArtboards.map((artboard) => {
                  const isSelected = selectedArtboardId === artboard.id;
                  const layerIndex = artboardOrder.indexOf(artboard.id);
                  const isTopLayer = layerIndex === artboardOrder.length - 1;
                  const isBottomLayer = layerIndex === 0;
                  const topWidget = artboard.widgets[artboard.widgets.length - 1];
                  const topComponentCount = topWidget ? topWidget.components.length : 0;

                  return (
                    <div
                      key={artboard.id}
                      className={`group rounded-xl px-3 py-2 transition hover:bg-muted/40 ${
                        isSelected ? 'ring-1 ring-foreground/40' : 'ring-1 ring-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => selectArtboardFromLayers(artboard.id)}
                          className="flex flex-1 flex-col text-left"
                        >
                          <span className="text-sm font-semibold text-foreground">{artboard.name || 'Untitled artboard'}</span>
                          <span className="text-xs text-muted-foreground">{artboard.dimensions.label ?? artboard.format}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleLayerMove(artboard.id, 'up')}
                            disabled={isTopLayer}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleLayerMove(artboard.id, 'down')}
                            disabled={isBottomLayer}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleArtboardLock(artboard.id)}
                          >
                            {artboard.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleArtboardVisibility(artboard.id)}
                          >
                            {artboard.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                          <span>{artboard.widgets.length} {artboard.widgets.length === 1 ? 'widget' : 'widgets'}</span>
                          <span>Top layer: {topComponentCount} components</span>
                        </div>
                        {artboard.widgets.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-1">No components yet.</p>
                        ) : (
                          artboard.widgets.slice().reverse().map((widget, widgetIndex) => (
                            <div key={widget.id} className="rounded-lg px-3 py-2 transition hover:bg-muted/30">
                              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                                <span>{getWidgetLabel(widget, widgetIndex)}</span>
                                <span className="text-[11px] text-muted-foreground">Layer {artboard.widgets.length - widgetIndex}</span>
                              </div>
                              {widget.components.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {widget.components.map((component) => (
                                    <span
                                      key={component.instanceId}
                                      className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                                    >
                                      {componentNameMap[component.componentType] || component.componentType}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Footer hint */}
      <div className="border-t p-3 shrink-0 bg-card/95">
        <p className="text-xs text-muted-foreground text-center">
          Drag components onto the canvas or into widgets
        </p>
      </div>
    </div>
  );
}
