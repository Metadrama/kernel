/**
 * ArtboardCanvas - Infinite canvas container for multiple artboards
 * 
 * Replaces the single-GridStack approach with an infinite canvas where
 * artboards can be freely positioned. Each artboard contains its own
 * GridStack instance for widget management.
 */

import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from 'react';
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
const SCROLLBAR_THICKNESS = 10;
const SCROLLBAR_MARGIN = 4;
const MIN_THUMB_SIZE = 24;

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
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
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
  // Universe Calculation (The "Scrollable World")
  // ============================================================================

  const universe = useMemo(() => {
    // 1. Content Bounds
    let contentMinX = 0;
    let contentMinY = 0;
    let contentMaxX = 0;
    let contentMaxY = 0;

    if (artboards.length > 0) {
      contentMinX = Number.POSITIVE_INFINITY;
      contentMinY = Number.POSITIVE_INFINITY;
      contentMaxX = Number.NEGATIVE_INFINITY;
      contentMaxY = Number.NEGATIVE_INFINITY;

      artboards.forEach((a) => {
        if (!a.visible) return;
        contentMinX = Math.min(contentMinX, a.position.x);
        contentMinY = Math.min(contentMinY, a.position.y);
        contentMaxX = Math.max(contentMaxX, a.position.x + a.dimensions.widthPx);
        contentMaxY = Math.max(contentMaxY, a.position.y + a.dimensions.heightPx);
      });
    }

    // 2. Viewport Bounds (in World Coordinates)
    // pan.x is the offset of the world origin relative to the viewport top-left
    // So viewport top-left in world coords is: -pan.x / scale
    const viewMinX = -pan.x / scale;
    const viewMinY = -pan.y / scale;
    const viewMaxX = (viewportSize.width - pan.x) / scale;
    const viewMaxY = (viewportSize.height - pan.y) / scale;

    // 3. Union (The Universe)
    // If no artboards, universe is just the viewport (plus a bit of buffer maybe?)
    const minX = artboards.length > 0 ? Math.min(contentMinX, viewMinX) : viewMinX;
    const minY = artboards.length > 0 ? Math.min(contentMinY, viewMinY) : viewMinY;
    const maxX = artboards.length > 0 ? Math.max(contentMaxX, viewMaxX) : viewMaxX;
    const maxY = artboards.length > 0 ? Math.max(contentMaxY, viewMaxY) : viewMaxY;

    // Add a little padding to the universe so you can scroll past the edge slightly
    const PADDING = 200;

    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      maxX: maxX + PADDING,
      maxY: maxY + PADDING,
      width: (maxX - minX) + (PADDING * 2),
      height: (maxY - minY) + (PADDING * 2),
      viewMinX,
      viewMinY,
      viewWidth: viewportSize.width / scale,
      viewHeight: viewportSize.height / scale,
    };
  }, [artboards, pan, scale, viewportSize]);

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
          // Calculate the point in world space that is currently under the focus point
          const worldPoint = {
            x: (targetFocus.x - prevPan.x) / prevScale,
            y: (targetFocus.y - prevPan.y) / prevScale,
          };

          // Calculate new pan such that worldPoint remains under targetFocus
          return {
            x: targetFocus.x - worldPoint.x * nextScale,
            y: targetFocus.y - worldPoint.y * nextScale,
          };
        });

        return nextScale;
      });
    },
    []
  );

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Zoom
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
      } else {
        // Pan
        e.preventDefault();
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
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
      }
    };

    const element = canvasRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [adjustScale]);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setViewportSize({ width, height });
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // ============================================================================
  // Scrollbar Interaction
  // ============================================================================

  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState<'horizontal' | 'vertical' | null>(null);
  const dragStartRef = useRef<{
    mouseStart: number;
    panStart: number;
    universeSize: number;
    trackSize: number;
  } | null>(null);

  const handleScrollbarMouseDown = (axis: 'horizontal' | 'vertical', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingScrollbar(axis);

    const trackSize = axis === 'horizontal' ? viewportSize.width : viewportSize.height;
    const universeSize = axis === 'horizontal' ? universe.width : universe.height;

    dragStartRef.current = {
      mouseStart: axis === 'horizontal' ? e.clientX : e.clientY,
      panStart: axis === 'horizontal' ? pan.x : pan.y,
      universeSize,
      trackSize,
    };
  };

  useEffect(() => {
    if (!isDraggingScrollbar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const { mouseStart, panStart, universeSize, trackSize } = dragStartRef.current;

      const currentMouse = isDraggingScrollbar === 'horizontal' ? e.clientX : e.clientY;
      const deltaPx = currentMouse - mouseStart;

      // Convert pixel delta to world delta
      // Ratio: Universe / Track
      // But wait, the scrollbar moves *opposite* to pan.
      // If I drag scrollbar RIGHT, I want to view content to the RIGHT.
      // Viewing content to the RIGHT means pan.x becomes MORE NEGATIVE.
      // So deltaPan = -deltaPx * (Universe / Track)

      const worldDelta = deltaPx * (universeSize / trackSize);
      const newPan = panStart - (worldDelta * scale); // Scale factor needed?
      // Let's re-verify the math.
      // Scrollbar Position = (ViewMin - UniverseMin) / UniverseWidth * TrackWidth
      // We are changing Scrollbar Position by deltaPx.
      // So ChangeInViewMin = deltaPx * (UniverseWidth / TrackWidth)
      // ViewMin = -Pan / Scale
      // So ChangeIn(-Pan/Scale) = deltaPx * Ratio
      // -ChangeInPan / Scale = deltaPx * Ratio
      // ChangeInPan = -deltaPx * Ratio * Scale

      setPan((prev) => ({
        ...prev,
        [isDraggingScrollbar === 'horizontal' ? 'x' : 'y']: newPan,
      }));
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollbar, scale, universe, viewportSize]);



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

          {/* Scrollbars */}
          {/* Horizontal */}
          <div
            className="absolute bottom-0 left-0 right-0 z-50 flex items-center px-1"
            style={{ height: SCROLLBAR_THICKNESS + SCROLLBAR_MARGIN * 2 }}
          >
            <div
              className="relative h-full w-full rounded-full bg-black/5 hover:bg-black/10 transition-colors"
              style={{ height: SCROLLBAR_THICKNESS }}
            >
              <div
                className="absolute top-0 bottom-0 rounded-full bg-black/20 hover:bg-black/40 active:bg-black/60 transition-colors cursor-default"
                style={{
                  left: ((universe.viewMinX - universe.minX) / universe.width) * viewportSize.width,
                  width: Math.max(MIN_THUMB_SIZE, (universe.viewWidth / universe.width) * viewportSize.width),
                }}
                onMouseDown={(e) => handleScrollbarMouseDown('horizontal', e)}
              />
            </div>
          </div>

          {/* Vertical */}
          <div
            className="absolute top-0 bottom-0 right-0 z-50 flex flex-col justify-center py-1"
            style={{ width: SCROLLBAR_THICKNESS + SCROLLBAR_MARGIN * 2 }}
          >
            <div
              className="relative h-full w-full rounded-full bg-black/5 hover:bg-black/10 transition-colors"
              style={{ width: SCROLLBAR_THICKNESS }}
            >
              <div
                className="absolute left-0 right-0 rounded-full bg-black/20 hover:bg-black/40 active:bg-black/60 transition-colors cursor-default"
                style={{
                  top: ((universe.viewMinY - universe.minY) / universe.height) * viewportSize.height,
                  height: Math.max(MIN_THUMB_SIZE, (universe.viewHeight / universe.height) * viewportSize.height),
                }}
                onMouseDown={(e) => handleScrollbarMouseDown('vertical', e)}
              />
            </div>
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
