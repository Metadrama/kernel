/**
 * ComponentSidebar - Main sidebar with components browser, layers panel, and dashboard picker
 */

import { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeft, FolderOpen, Download, LayoutGrid, Layers, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArtboardContext } from '@/context/ArtboardContext';
import { ComponentsPanel, LayersPanel } from './sidebar';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface SavedDashboard {
  id: string;
  name: string;
  updatedAt: string | null;
  artboardCount: number;
}

interface ComponentSidebarProps {
  savedDashboards?: SavedDashboard[];
  currentDashboardId?: string;
}

export default function ComponentSidebar({ savedDashboards = [], currentDashboardId }: ComponentSidebarProps) {
  const {
    artboards,
    setArtboards,
    archivedWidgets,
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
    moveArtboardLayer,
  } = useArtboardContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<'components' | 'layers'>('components');
  const [showDashboardPicker, setShowDashboardPicker] = useState(false);
  const pickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setIsCollapsed(JSON.parse(saved));
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  // Hover handlers for dashboard picker
  const handlePickerMouseEnter = () => {
    if (pickerTimeoutRef.current) clearTimeout(pickerTimeoutRef.current);
    setShowDashboardPicker(true);
  };

  const handlePickerMouseLeave = () => {
    pickerTimeoutRef.current = setTimeout(() => {
      setShowDashboardPicker(false);
    }, 300); // Small delay to allow moving to dropdown
  };

  const handleLoadDashboard = (id: string) => {
    router.visit(`/dashboard/${id}`);
    setShowDashboardPicker(false);
  };

  // Export a specific dashboard to desktop as JSON file
  const handleExportDashboard = async (dashId: string, dashName: string) => {
    try {
      // Fetch the dashboard data
      const response = await fetch(`/dashboard/${dashId}`, {
        headers: { 'Accept': 'application/json' },
      });

      // For current dashboard, use local state
      if (dashId === currentDashboardId) {
        const data = {
          id: dashId,
          name: dashName,
          artboards: artboards,
          archivedWidgets: archivedWidgets,
          exportedAt: new Date().toISOString(),
        };
        downloadJson(data, dashId);
      } else {
        // For other dashboards, just export metadata with a note
        const data = {
          id: dashId,
          name: dashName,
          note: 'Load this dashboard first to export full data',
          exportedAt: new Date().toISOString(),
        };
        downloadJson(data, dashId);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const downloadJson = (data: object, id: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export current dashboard
  const handleExportCurrent = () => {
    const data = {
      id: currentDashboardId ?? 'export',
      name: 'Current Dashboard',
      artboards: artboards,
      archivedWidgets: archivedWidgets,
      exportedAt: new Date().toISOString(),
    };
    downloadJson(data, currentDashboardId ?? 'export');
    setShowDashboardPicker(false);
  };

  // Layer actions
  const handleToggleVisibility = (id: string) => {
    setArtboards((prev) => prev.map((a) => a.id === id ? { ...a, visible: !a.visible } : a));
  };

  const handleToggleLock = (id: string) => {
    setArtboards((prev) => prev.map((a) => a.id === id ? { ...a, locked: !a.locked } : a));
  };

  const handleSelectArtboard = (id: string) => {
    setSelectedArtboardId(id);
    bringArtboardToFront(id);
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    moveArtboardLayer(id, direction);
  };

  if (isCollapsed) {
    return (
      <div className="flex h-screen w-12 flex-col border-r bg-card/50 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-center border-b">
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-80 flex-col border-r bg-card/95 backdrop-blur-xl shadow-sm z-20">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3 shrink-0">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                BM
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight leading-none">Builder</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">V1.0.0</span>
            </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Dashboard Picker with hover */}
          <div
            className="relative"
            onMouseEnter={handlePickerMouseEnter}
            onMouseLeave={handlePickerMouseLeave}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Dashboards"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>

            {/* Dropdown on hover */}
            {showDashboardPicker && (
              <div
                className="absolute right-0 top-full mt-1 w-72 rounded-xl border bg-card shadow-xl z-50 overflow-hidden ring-1 ring-border/50"
                onMouseEnter={handlePickerMouseEnter}
                onMouseLeave={handlePickerMouseLeave}
              >
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Saved Dashboards</p>
                </div>

                {savedDashboards.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No saved dashboards yet.</p>
                  </div>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5">
                    {savedDashboards.map((dash) => (
                      <div
                        key={dash.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg transition-colors group",
                          dash.id === currentDashboardId ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        )}
                      >
                        <button
                          onClick={() => handleLoadDashboard(dash.id)}
                          className="flex-1 text-left px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("truncate font-medium", dash.id === currentDashboardId ? "text-primary" : "text-foreground")}>
                              {dash.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border border-transparent group-hover:border-border/50">
                                {dash.artboardCount}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate opacity-70">
                            Last updated {dash.updatedAt ? new Date(dash.updatedAt).toLocaleDateString() : 'Never'}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDashboard(dash.id, dash.name);
                          }}
                          className="mr-1 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:text-foreground hover:shadow-sm"
                          title={`Export ${dash.name}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mode Switch - Segmented Control Style */}
      <div className="px-3 py-3 border-b">
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg">
          {(['components', 'layers'] as const).map((panel) => {
            const isActive = activePanel === panel;
            return (
              <button
                key={panel}
                type="button"
                onClick={() => setActivePanel(panel)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {panel === 'components' ? <LayoutGrid className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                {panel === 'components' ? 'Components' : 'Layers'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activePanel === 'components' ? (
          <ComponentsPanel />
        ) : (
          <LayersPanel
            artboards={artboards}
            artboardStackOrder={artboardStackOrder}
            selectedArtboardId={selectedArtboardId}
            onSelectArtboard={handleSelectArtboard}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onMoveLayer={handleMoveLayer}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3 shrink-0 bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center font-medium opacity-70">
          {activePanel === 'components'
            ? 'Drag & drop components to build'
            : 'Manage your layout hierarchy'
          }
        </p>
      </div>
    </div>
  );
}
