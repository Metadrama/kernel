/**
 * ArtboardCanvas - Infinite canvas container for multiple artboards
 * 
 * Refactored to use extracted hooks and sub-components.
 * Now focuses on orchestrating canvas state and rendering artboards.
 * 
 * Cross-artboard widget transfer is enabled via GridStack acceptWidgets.
 * State updates are deferred during drag to prevent React/DOM conflicts.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import ArtboardContainer from './ArtboardContainer';
import ArtboardInspector from './ArtboardInspector';
import { ComponentInspector } from '@/components/config-panel';
import AddArtboardPanel from './AddArtboardPanel';
import FloatingToolbar, { ToolType } from '@/components/FloatingToolbar';
import CanvasTopBar from './CanvasTopBar';
import CanvasScrollbars, { Universe } from './CanvasScrollbars';
import CanvasEmptyState from './CanvasEmptyState';
import { useCanvasZoom, useCanvasPan, useWidgetTransfer } from '@/hooks';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetComponent, WidgetSchema } from '@/types/dashboard';
import { createArtboard } from '@/lib/artboard-utils';
import { useArtboardContext } from '@/context/ArtboardContext';

export default function ArtboardCanvas() {
  const {
    artboards,
    setArtboards,
    archivedWidgets,
    setArchivedWidgets,
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
  } = useArtboardContext();

  // Widget transfer hooks prepared for future custom implementation
  // NOTE: GridStack acceptWidgets between independent grids conflicts with React
  // These hooks are ready for a custom drag-out-of-bounds approach
  const { transferWidget, archiveWidget, unarchiveWidget } = useWidgetTransfer({
    artboards,
    setArtboards,
    archivedWidgets,
    setArchivedWidgets,
  });

  // Canvas zoom/pan from extracted hook
  const { scale, pan, setPan, viewportSize, adjustScale, canvasRef } = useCanvasZoom();

  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('pointer');
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Panel visibility
  const [showAddArtboard, setShowAddArtboard] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  // Component selection state
  const [selectedComponent, setSelectedComponent] = useState<{
    artboardId: string;
    widgetId: string;
    component: WidgetComponent;
  } | null>(null);

  const selectedArtboard = artboards.find(a => a.id === selectedArtboardId) || null;

  // Hand tool panning
  const isHandMode = activeTool === 'hand' || isSpacePressed;
  const { isPanning, handleCanvasMouseDown } = useCanvasPan({
    isHandMode,
    pan,
    setPan,
  });

  // Handle spacebar for temporary hand tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isSpacePressed) {
        setIsSpacePressed(true);
      }
      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.key.toLowerCase() === 'v') setActiveTool('pointer');
        if (e.key.toLowerCase() === 'h') setActiveTool('hand');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Calculate scrollable universe
  const universe: Universe = useMemo(() => {
    let contentMinX = 0, contentMinY = 0, contentMaxX = 0, contentMaxY = 0;

    if (artboards.length > 0) {
      contentMinX = contentMinY = Infinity;
      contentMaxX = contentMaxY = -Infinity;
      artboards.forEach((a) => {
        if (!a.visible) return;
        contentMinX = Math.min(contentMinX, a.position.x);
        contentMinY = Math.min(contentMinY, a.position.y);
        contentMaxX = Math.max(contentMaxX, a.position.x + a.dimensions.widthPx);
        contentMaxY = Math.max(contentMaxY, a.position.y + a.dimensions.heightPx);
      });
    }

    const viewMinX = -pan.x / scale;
    const viewMinY = -pan.y / scale;
    const viewMaxX = (viewportSize.width - pan.x) / scale;
    const viewMaxY = (viewportSize.height - pan.y) / scale;

    const minX = artboards.length > 0 ? Math.min(contentMinX, viewMinX) : viewMinX;
    const minY = artboards.length > 0 ? Math.min(contentMinY, viewMinY) : viewMinY;
    const maxX = artboards.length > 0 ? Math.max(contentMaxX, viewMaxX) : viewMaxX;
    const maxY = artboards.length > 0 ? Math.max(contentMaxY, viewMaxY) : viewMaxY;

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      viewMinX, viewMinY,
      viewWidth: viewportSize.width / scale,
      viewHeight: viewportSize.height / scale,
    };
  }, [artboards, pan, scale, viewportSize]);

  // Artboard CRUD
  const handleUpdateArtboard = useCallback((id: string, updates: Partial<ArtboardSchema>) => {
    setArtboards((prev) =>
      prev.map((a) => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)
    );
  }, [setArtboards]);

  const handleDeleteArtboard = useCallback((id: string) => {
    setArtboards((prev) => prev.filter((a) => a.id !== id));
    if (selectedArtboardId === id) setSelectedArtboardId(null);
  }, [selectedArtboardId, setArtboards, setSelectedArtboardId]);

  const handleAddCard = useCallback(() => {
    const targetId = selectedArtboardId || artboards[0]?.id;
    if (!targetId) return;

    const newWidget: WidgetSchema = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: 0, y: 0,
      w: 60, // 60 * 8px = 480px width
      h: 50, // 50 * 8px = 400px height
      components: [],
    };

    setArtboards((prev) =>
      prev.map((a) => a.id === targetId
        ? { ...a, widgets: [...a.widgets, newWidget], updatedAt: new Date().toISOString() }
        : a
      )
    );
    if (!selectedArtboardId) setSelectedArtboardId(targetId);
  }, [selectedArtboardId, artboards, setArtboards, setSelectedArtboardId]);

  // NOTE: Cross-artboard transfer handlers removed
  // GridStack's acceptWidgets between independent grids causes React/DOM conflicts
  // TODO: Implement custom drag-out-of-bounds detection for seamless transfer

  // Component selection
  const handleSelectComponent = useCallback((artboardId: string, widgetId: string, component: WidgetComponent) => {
    setSelectedComponent({ artboardId, widgetId, component });
    setShowInspector(true);
  }, []);

  const handleComponentConfigChange = useCallback((instanceId: string, config: Record<string, unknown>) => {
    if (!selectedComponent) return;
    setArtboards((prev) =>
      prev.map((a) => {
        if (a.id !== selectedComponent.artboardId) return a;
        return {
          ...a,
          widgets: a.widgets.map((w) => {
            if (w.id !== selectedComponent.widgetId) return w;
            return {
              ...w,
              components: w.components.map((c) => c.instanceId === instanceId ? { ...c, config } : c),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setSelectedComponent((prev) =>
      prev?.component.instanceId === instanceId
        ? { ...prev, component: { ...prev.component, config } }
        : prev
    );
  }, [selectedComponent, setArtboards]);

  const handleCloseInspector = useCallback(() => {
    setShowInspector(false);
    setSelectedComponent(null);
  }, []);

  // Persistence
  const handleSave = () => {
    try {
      window.localStorage.setItem('artboards', JSON.stringify(artboards));
      console.log('Artboards saved');
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        <CanvasTopBar
          artboardCount={artboards.length}
          scale={scale}
          onZoomIn={() => adjustScale((s) => s * 1.1)}
          onZoomOut={() => adjustScale((s) => s * 0.9)}
          onZoomReset={() => adjustScale(() => 1)}
          onSave={handleSave}
        />

        <div
          ref={canvasRef}
          className={`relative flex-1 overflow-hidden ${isHandMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleCanvasMouseDown}
        >
          {artboards.length === 0 && <CanvasEmptyState />}

          {/* Infinite Canvas */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Grid Background */}
            <div
              className="absolute opacity-[0.015] pointer-events-none"
              style={{
                left: -10000, top: -10000, width: 20000, height: 20000,
                backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Artboards */}
            {artboardStackOrder
              .map(id => artboards.find(a => a.id === id))
              .filter((a): a is ArtboardSchema => !!a)
              .map((artboard, index) => (
                <ArtboardContainer
                  key={artboard.id}
                  artboard={artboard}
                  isSelected={selectedArtboardId === artboard.id}
                  canvasScale={scale}
                  zIndex={index}
                  onUpdate={handleUpdateArtboard}
                  onDelete={handleDeleteArtboard}
                  onSelect={() => {
                    setSelectedArtboardId(artboard.id);
                    bringArtboardToFront(artboard.id);
                  }}
                  onSelectComponent={handleSelectComponent}
                  onDeselectComponent={() => setSelectedComponent(null)}
                  selectedComponentId={
                    selectedComponent?.artboardId === artboard.id
                      ? selectedComponent.component.instanceId
                      : undefined
                  }
                />
              ))}
          </div>

          {/* Hand mode overlay */}
          {isHandMode && (
            <div className="absolute inset-0 z-40 bg-transparent cursor-grab active:cursor-grabbing" />
          )}

          <CanvasScrollbars
            universe={universe}
            viewportSize={viewportSize}
            scale={scale}
            pan={pan}
            setPan={setPan}
          />
        </div>
      </div>

      {/* Panels */}
      {showInspector && selectedComponent && (
        <ComponentInspector
          component={selectedComponent.component}
          onConfigChange={handleComponentConfigChange}
          onClose={handleCloseInspector}
        />
      )}

      {selectedArtboard && (
        <ArtboardInspector
          artboard={selectedArtboard}
          onUpdate={(updates) => selectedArtboardId && handleUpdateArtboard(selectedArtboardId, updates)}
          onClose={() => setSelectedArtboardId(null)}
        />
      )}

      {showAddArtboard && (
        <AddArtboardPanel
          onAddArtboard={(format) => {
            const newArtboard = createArtboard({ format }, artboards);
            setArtboards((prev) => [...prev, newArtboard]);
          }}
          onClose={() => setShowAddArtboard(false)}
        />
      )}

      <FloatingToolbar
        activeTool={isSpacePressed ? 'hand' : activeTool}
        onToolChange={setActiveTool}
        onAddArtboard={() => {
          setShowAddArtboard(!showAddArtboard);
          if (!showAddArtboard) {
            setShowInspector(false);
            setSelectedArtboardId(null);
          }
        }}
        onAddCard={handleAddCard}
      />
    </div>
  );
}
