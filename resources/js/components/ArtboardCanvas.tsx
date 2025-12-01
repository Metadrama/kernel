/**
 * ArtboardCanvas - Infinite canvas container for multiple artboards
 * 
 * Replaces the single-GridStack approach with an infinite canvas where
 * artboards can be freely positioned. Each artboard contains its own
 * GridStack instance for widget management.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtboardToolbar from '@/components/ArtboardToolbar';
import ArtboardContainer from '@/components/ArtboardContainer';
import ArtboardInspector from '@/components/ArtboardInspector';
import { ComponentInspector } from '@/components/config-panel';
import AddArtboardPanel from '@/components/AddArtboardPanel';
import type { ArtboardSchema, CanvasPosition } from '@/types/artboard';
import type { WidgetComponent } from '@/types/dashboard';
import { createArtboard } from '@/lib/artboard-utils';
import { useArtboardContext } from '@/context/ArtboardContext';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

const clampScale = (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

export default function ArtboardCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    artboards,
    setArtboards,
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
  } = useArtboardContext();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<CanvasPosition>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<CanvasPosition>({ x: 0, y: 0 });
  const selectedArtboard = artboards.find(a => a.id === selectedArtboardId) || null;

  // Component selection state for inspector
  const [selectedComponent, setSelectedComponent] = useState<{
    artboardId: string;
    widgetId: string;
    component: WidgetComponent;
  } | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [showAddArtboard, setShowAddArtboard] = useState(false);

  // Header context menu state (for scale-independent headers)
  const [headerContextMenuState, setHeaderContextMenuState] = useState<{
    [artboardId: string]: {
      open: boolean;
      position: { x: number; y: number } | null;
    };
  }>({});

  // ============================================================================
  // Zoom Controls
  // ============================================================================

  const adjustScale = useCallback(
    (scaleUpdater: (prev: number) => number, focusPoint?: CanvasPosition) => {
      setScale((prevScale) => {
        const nextScale = clampScale(scaleUpdater(prevScale));
        const canvasElement = canvasRef.current;

        if (!canvasElement || prevScale === nextScale) {
          return nextScale;
        }

        const rect = canvasElement.getBoundingClientRect();
        const fallbackFocus = { x: rect.width / 2, y: rect.height / 2 };
        const targetFocus = focusPoint ?? fallbackFocus;

        setPan((prevPan) => {
          const canvasPoint = {
            x: (targetFocus.x - prevPan.x) / prevScale,
            y: (targetFocus.y - prevPan.y) / prevScale,
          };

          return {
            x: targetFocus.x - canvasPoint.x * nextScale,
            y: targetFocus.y - canvasPoint.y * nextScale,
          };
        });

        return nextScale;
      });
    },
    []
  );

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;

      e.preventDefault();
      const canvasElement = canvasRef.current;
      let focusPoint: CanvasPosition | undefined;

      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        focusPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      adjustScale((prev) => prev * delta, focusPoint);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        adjustScale((prev) => prev * 1.1);
      } else if (e.key === '-') {
        e.preventDefault();
        adjustScale((prev) => prev * 0.9);
      } else if (e.key === '0') {
        e.preventDefault();
        adjustScale(() => 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [adjustScale]);

  // ============================================================================
  // Pan Controls
  // ============================================================================

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan with middle mouse button
    // (Space+drag requires tracking spacebar state separately)
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // ============================================================================
  // Artboard Management
  // ============================================================================

  const handleUpdateArtboard = useCallback((artboardId: string, updates: Partial<ArtboardSchema>) => {
    setArtboards((prev) =>
      prev.map((artboard) =>
        artboard.id === artboardId
          ? { ...artboard, ...updates, updatedAt: new Date().toISOString() }
          : artboard
      )
    );
  }, []);

  const handleDeleteArtboard = useCallback((artboardId: string) => {
    setArtboards((prev) => prev.filter((a) => a.id !== artboardId));
    if (selectedArtboardId === artboardId) {
      setSelectedArtboardId(null);
    }
  }, [selectedArtboardId]);

  // ============================================================================
  // Persistence
  // ============================================================================

  const handleSave = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem('artboards', JSON.stringify(artboards));
      // Could add a toast notification here
      console.log('Artboards saved manually');
    } catch (e) {
      console.error('Failed to save artboards:', e);
    }
  };

  // ============================================================================
  // Component Selection & Configuration
  // ============================================================================

  const handleSelectComponent = useCallback((
    artboardId: string,
    widgetId: string,
    component: WidgetComponent
  ) => {
    setSelectedComponent({ artboardId, widgetId, component });
    setShowInspector(true);
  }, []);

  const handleComponentConfigChange = useCallback((
    instanceId: string,
    config: Record<string, unknown>
  ) => {
    if (!selectedComponent) return;

    setArtboards((prev) =>
      prev.map((artboard) => {
        if (artboard.id !== selectedComponent.artboardId) return artboard;

        return {
          ...artboard,
          widgets: artboard.widgets.map((widget) => {
            if (widget.id !== selectedComponent.widgetId) return widget;

            return {
              ...widget,
              components: widget.components.map((c) =>
                c.instanceId === instanceId ? { ...c, config } : c
              ),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // Update selected component reference
    setSelectedComponent((prev) => {
      if (prev && prev.component.instanceId === instanceId) {
        return {
          ...prev,
          component: { ...prev.component, config },
        };
      }
      return prev;
    });
  }, [selectedComponent]);

  const handleCloseInspector = useCallback(() => {
    setShowInspector(false);
    setSelectedComponent(null);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        {/* Top Bar */}
        <div className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-6 supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Untitled Dashboard</h1>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {artboards.length} {artboards.length === 1 ? 'artboard' : 'artboards'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="mr-2 flex items-center rounded-md border bg-background shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none rounded-l-md border-r"
                onClick={() => adjustScale((prev) => prev * 0.9)}
                title="Zoom Out (Ctrl+-)"
              >
                <span className="text-xs">-</span>
              </Button>
              <div className="flex w-14 items-center justify-center px-2 text-xs font-medium">
                {Math.round(scale * 100)}%
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border-r"
                onClick={() => adjustScale((prev) => prev * 1.1)}
                title="Zoom In (Ctrl++)"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none rounded-r-md"
                onClick={() => adjustScale(() => 1)}
                title="Reset Zoom (Ctrl+0)"
              >
                <span className="text-xs">1:1</span>
              </Button>
            </div>

            <Button variant="outline" size="sm">Preview</Button>
            <ArtboardToolbar
              onToggleAddArtboard={() => {
                setShowAddArtboard(!showAddArtboard);
                // Close other panels if needed
                if (!showAddArtboard) {
                  setShowInspector(false);
                  setSelectedArtboardId(null);
                }
              }}
            />
            <Button
              size="sm"
              className="bg-black text-white hover:bg-black/90"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Infinite Canvas Viewport */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden"
          onMouseDown={handleMouseDown}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        >
          {/* Empty State */}
          {artboards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 bg-background/50 backdrop-blur-sm">
                  <Plus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    No artboards yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Click "Add Artboard" to create a new canvas with a specific format
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Infinite Canvas - Scaled & Panned */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Grid Background Pattern */}
            <div
              className="absolute opacity-[0.015] pointer-events-none"
              style={{
                left: -10000,
                top: -10000,
                width: 20000,
                height: 20000,
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Artboards */}
            {/* Artboards - sorted by stack order (bottom to top) */}
            {artboardStackOrder
              .map(id => artboards.find(a => a.id === id))
              .filter((artboard): artboard is ArtboardSchema => artboard !== undefined)
              .map((artboard, index) => (
                <ArtboardContainer
                  key={artboard.id}
                  artboard={artboard}
                  isSelected={selectedArtboardId === artboard.id}
                  canvasScale={scale}
                  canvasPan={pan}
                  zIndex={index} // Stack position determines z-index
                  onUpdate={handleUpdateArtboard}
                  onDelete={handleDeleteArtboard}
                  onSelect={() => {
                    setSelectedArtboardId(artboard.id);
                    bringArtboardToFront(artboard.id);
                  }}
                  onSelectComponent={handleSelectComponent}
                  selectedComponentId={
                    selectedComponent?.artboardId === artboard.id
                      ? selectedComponent.component.instanceId
                      : undefined
                  }
                />
              ))}
          </div>
        </div>
      </div>

      {/* Component Inspector Panel */}
      {showInspector && selectedComponent && (
        <ComponentInspector
          component={selectedComponent.component}
          onConfigChange={handleComponentConfigChange}
          onClose={handleCloseInspector}
        />
      )}

      {/* Artboard Inspector Panel */}
      {selectedArtboard && (
        <ArtboardInspector
          artboard={selectedArtboard}
          onUpdate={(updates) => {
            if (!selectedArtboardId) return;
            handleUpdateArtboard(selectedArtboardId, updates);
          }}
          onClose={() => setSelectedArtboardId(null)}
        />
      )}

      {/* Add Artboard Panel */}
      {showAddArtboard && (
        <AddArtboardPanel
          onAddArtboard={(format) => {
            const newArtboard: ArtboardSchema = createArtboard({ format }, artboards);
            setArtboards((prev) => [...prev, newArtboard]);
          }}
          onClose={() => setShowAddArtboard(false)}
        />
      )}
    </div>
  );
}
