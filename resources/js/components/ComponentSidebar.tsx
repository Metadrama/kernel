/**
 * ComponentSidebar - Main sidebar with components browser and layers panel
 * 
 * Refactored to use extracted sub-components for maintainability.
 */

import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArtboardContext } from '@/context/ArtboardContext';
import { ComponentsPanel, LayersPanel } from './sidebar';

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
  const [activePanel, setActivePanel] = useState<'components' | 'layers'>('components');

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
        <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
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
