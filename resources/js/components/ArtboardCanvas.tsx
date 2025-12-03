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
import ArtboardContainer from '@/components/ArtboardContainer';
import ArtboardInspector from '@/components/ArtboardInspector';
import { ComponentInspector } from '@/components/config-panel';
import AddArtboardPanel from '@/components/AddArtboardPanel';
import FloatingToolbar, { ToolType } from '@/components/FloatingToolbar';
import type { ArtboardSchema, CanvasPosition } from '@/types/artboard';
import type { WidgetComponent } from '@/types/dashboard';
import { createArtboard } from '@/lib/artboard-utils';
import { useArtboardContext } from '@/context/ArtboardContext';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCROLLBAR_THICKNESS = 6;
const SCROLLBAR_MARGIN = 0;
const MIN_THUMB_SIZE = 24;

const clampScale = (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);


export default function ArtboardCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
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
  const [activeTool, setActiveTool] = useState<ToolType>('pointer');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
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
    // const PADDING = 200;
    const PADDING = 0;

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

        let deltaX = e.deltaX;
        let deltaY = e.deltaY;

        // Shift + Scroll = Horizontal Scroll
        if (e.shiftKey && deltaY !== 0 && deltaX === 0) {
          deltaX = deltaY;
          deltaY = 0;
        }

        // Scroll Acceleration & Normalization Logic
        const now = Date.now();
        const dt = now - lastWheelTime.current;
        lastWheelTime.current = now;

        // Detect if this is likely a mouse wheel (large fixed deltas, e.g., 100 or 125)
        // vs a trackpad (small variable deltas)
        const isMouseWheel = Math.abs(deltaX) >= 50 || Math.abs(deltaY) >= 50;

        // Base scroll speed
        // If it's a mouse wheel, we dampen the raw delta (often 100px) down to something finer (e.g., 30px)
        // If it's a trackpad, we trust the raw delta more but maybe slight dampen
        let effectiveDeltaX = deltaX;
        let effectiveDeltaY = deltaY;

        if (isMouseWheel) {
          // Normalize mouse wheel to a consistent "notch" size
          const NOTCH_SIZE = 5; // Pixel distance per notch for "fine" scrolling
          effectiveDeltaX = Math.sign(deltaX) * NOTCH_SIZE * (Math.abs(deltaX) > 0 ? 1 : 0);
          effectiveDeltaY = Math.sign(deltaY) * NOTCH_SIZE * (Math.abs(deltaY) > 0 ? 1 : 0);
        }

        let velocityFactor = 1;

        // 1. Frequency-based acceleration (for Mouse Wheels)
        if (dt < 20) {
          velocityFactor = 25; // Super fast
        } else if (dt < 40) {
          velocityFactor = 10; // Fast
        } else if (dt < 80) {
          velocityFactor = 3; // Moderate
        }

        // 2. Magnitude-based acceleration (for Trackpads)
        // Only apply if we didn't already normalize it as a mouse wheel
        if (!isMouseWheel) {
          const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          if (magnitude > 100) {
            velocityFactor = Math.max(velocityFactor, 2.5);
          } else if (magnitude > 50) {
            velocityFactor = Math.max(velocityFactor, 1.5);
          }
        }

        // Apply acceleration
        setPan((prev) => ({
          x: prev.x - effectiveDeltaX * velocityFactor,
          y: prev.y - effectiveDeltaY * velocityFactor,
        }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool Shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (e.key.toLowerCase() === 'v') {
          setActiveTool('pointer');
        } else if (e.key.toLowerCase() === 'h') {
          setActiveTool('hand');
        } else if (e.key === ' ') {
          if (!isSpacePressed) setIsSpacePressed(true);
        }
      }

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

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    const element = canvasRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [adjustScale, isSpacePressed]);

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
  // Hand Tool Interaction (Left-Click Drag)
  // ============================================================================
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only allow panning if:
    // 1. Middle mouse button (button 1) OR
    // 2. Left mouse button (button 0) AND (Hand tool active OR Spacebar pressed)
    const isMiddleClick = e.button === 1;
    const isLeftClick = e.button === 0;
    const isHandMode = activeTool === 'hand' || isSpacePressed;

    if (isMiddleClick || (isLeftClick && isHandMode)) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!lastMousePos.current) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      lastMousePos.current = { x: e.clientX, y: e.clientY };

      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      lastMousePos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

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
          className={`relative flex-1 overflow-hidden ${activeTool === 'hand' || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleCanvasMouseDown}
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

          {/* Block interactions with content in Hand Mode */}
          {(activeTool === 'hand' || isSpacePressed) && (
            <div className="absolute inset-0 z-[9999] bg-transparent cursor-grab active:cursor-grabbing" />
          )}

          {/* Scrollbars */}
          {/* Horizontal */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-50 flex items-center transition-opacity duration-150 ease-out ${(universe.width > universe.viewWidth + 1 || isDraggingScrollbar === 'horizontal')
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
              }`}
            style={{ height: SCROLLBAR_THICKNESS }}
          >
            <div
              className="relative h-full w-full bg-transparent hover:bg-black/5 transition-colors"
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
            className={`absolute top-0 bottom-0 right-0 z-50 flex flex-col justify-center transition-opacity duration-150 ease-out ${(universe.height > universe.viewHeight + 1 || isDraggingScrollbar === 'vertical')
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
              }`}
            style={{ width: SCROLLBAR_THICKNESS }}
          >
            <div
              className="relative h-full w-full bg-transparent hover:bg-black/5 transition-colors"
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
      {
        showInspector && selectedComponent && (
          <ComponentInspector
            component={selectedComponent.component}
            onConfigChange={handleComponentConfigChange}
            onClose={handleCloseInspector}
          />
        )
      }

      {/* Artboard Inspector Panel */}
      {
        selectedArtboard && (
          <ArtboardInspector
            artboard={selectedArtboard}
            onUpdate={(updates) => {
              if (!selectedArtboardId) return;
              handleUpdateArtboard(selectedArtboardId, updates);
            }}
            onClose={() => setSelectedArtboardId(null)}
          />
        )
      }

      {/* Add Artboard Panel */}
      {
        showAddArtboard && (
          <AddArtboardPanel
            onAddArtboard={(format) => {
              const newArtboard: ArtboardSchema = createArtboard({ format }, artboards);
              setArtboards((prev) => [...prev, newArtboard]);
            }}
            onClose={() => setShowAddArtboard(false)}
          />
        )
      }

      {/* Floating Toolbar */}
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
      />
    </div >
  );
}
