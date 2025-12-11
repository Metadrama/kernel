/**
 * ComponentSidebar - Main sidebar with components browser, layers panel, and dashboard picker
 */

import { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, PanelLeft, FolderOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArtboardContext } from '@/context/ArtboardContext';
import { ComponentsPanel, LayersPanel } from './sidebar';
import { router } from '@inertiajs/react';

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
      <div className="flex h-screen w-12 flex-col border-r bg-card">
        <div className="flex h-14 items-center justify-center border-b">
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
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
              className="h-8 w-8"
              title="Dashboards"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>

            {/* Dropdown on hover */}
            {showDashboardPicker && (
              <div
                className="absolute right-0 top-full mt-1 w-64 rounded-lg border bg-card shadow-lg z-50"
                onMouseEnter={handlePickerMouseEnter}
                onMouseLeave={handlePickerMouseLeave}
              >
                <div className="p-3 border-b">
                  <p className="text-xs font-medium text-muted-foreground">SAVED DASHBOARDS</p>
                </div>

                {savedDashboards.length === 0 ? (
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">No saved dashboards yet.</p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto p-1">
                    {savedDashboards.map((dash) => (
                      <div
                        key={dash.id}
                        className={`flex items-center gap-1 rounded-md transition hover:bg-muted ${dash.id === currentDashboardId ? 'bg-muted' : ''
                          }`}
                      >
                        <button
                          onClick={() => handleLoadDashboard(dash.id)}
                          className="flex-1 text-left px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`truncate ${dash.id === currentDashboardId ? 'font-medium' : ''}`}>
                              {dash.name}
                            </span>
                            <span className="text-xs text-muted-foreground">{dash.artboardCount}</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDashboard(dash.id, dash.name);
                          }}
                          className="p-2 hover:bg-background rounded-md transition"
                          title={`Export ${dash.name}`}
                        >
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mode Switch */}
      <div className="border-b bg-card/95 px-4 py-2.5">
        <div className="grid grid-cols-2 gap-2">
          {(['components', 'layers'] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => setActivePanel(panel)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${activePanel === panel
                ? 'border-foreground/40 bg-background text-foreground shadow-sm'
                : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70'
                }`}
            >
              {panel === 'components' ? 'Components' : 'Layers'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Panel */}
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

      {/* Footer */}
      <div className="border-t p-3 shrink-0 bg-card/95">
        <p className="text-xs text-muted-foreground text-center">
          Drag components onto the canvas or into widgets
        </p>
      </div>
    </div>
  );
}
