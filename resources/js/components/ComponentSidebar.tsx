/**
 * ComponentSidebar - Main sidebar with components browser, layers panel, and dashboard picker
 */

import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeft, FolderOpen, ChevronDown } from 'lucide-react';
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
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
    moveArtboardLayer,
  } = useArtboardContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<'components' | 'layers'>('components');
  const [showDashboardPicker, setShowDashboardPicker] = useState(false);

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

  const handleLoadDashboard = (id: string) => {
    router.visit(`/dashboard/${id}`);
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDashboardPicker(!showDashboardPicker)}
            className="h-8 w-8"
            title="Load Dashboard"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard Picker Dropdown */}
      {showDashboardPicker && (
        <div className="border-b bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">SAVED DASHBOARDS</p>
          {savedDashboards.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved dashboards yet. Click Save to create one.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {savedDashboards.map((dash) => (
                <button
                  key={dash.id}
                  onClick={() => handleLoadDashboard(dash.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition hover:bg-background ${dash.id === currentDashboardId ? 'bg-background font-medium' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{dash.name}</span>
                    <span className="text-xs text-muted-foreground">{dash.artboardCount} artboards</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
