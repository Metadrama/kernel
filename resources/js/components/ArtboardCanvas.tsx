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
const PAN_LIMIT = 8000;
const EDGE_ACTIVATION_EPSILON = 0.5;
const MIN_SCROLLBAR_FILL = 22;
const MAX_SCROLLBAR_FILL = 85;
const KEY_PAN_STEP = 60;
const SCROLL_MERGE_WINDOW_MS = 150;
const SCROLL_MAX_DELTA = 320;
const SCROLL_BASE_UNIT = 120; // typical wheel delta per "notch"
const MIN_SCROLL_STEP = 2;
const MICRO_SCROLL_EXPONENT = 0.85;
const FAST_SCROLL_THRESHOLD = 80;
const FAST_SCROLL_MULTIPLIER = 6;

const clampScale = (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
const clampPanValue = (value: number) => Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, value));
const clampPan = (pan: CanvasPosition) => ({
  x: clampPanValue(pan.x),
  y: clampPanValue(pan.y),
});

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

  const artboardBounds = useMemo(() => {
    if (artboards.length === 0) return null;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    artboards.forEach((artboard) => {
      if (!artboard.visible) return;
      const { position, dimensions } = artboard;
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + dimensions.widthPx);
      maxY = Math.max(maxY, position.y + dimensions.heightPx);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  }, [artboards]);

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

  useEffect(() => {
    const handleArrowScroll = (e: KeyboardEvent) => {
      if (selectedComponent) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrowKeys.includes(e.key)) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          target.isContentEditable ||
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        ) {
          return;
        }
      }

      e.preventDefault();
      const step = e.shiftKey ? KEY_PAN_STEP * 2 : KEY_PAN_STEP;
      let deltaX = 0;
      let deltaY = 0;

      switch (e.key) {
        case 'ArrowUp':
          deltaY = -step;
          break;
        case 'ArrowDown':
          deltaY = step;
          break;
        case 'ArrowLeft':
          deltaX = -step;
          break;
        case 'ArrowRight':
          deltaX = step;
          break;
      }

      setPan((prev) =>
        clampPan({
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        })
      );
    };

    window.addEventListener('keydown', handleArrowScroll);
    return () => window.removeEventListener('keydown', handleArrowScroll);
  }, [selectedComponent]);

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
      setPan(clampPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
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

  const velocityRef = useRef({
    horizontal: { delta: 0, timestamp: 0 },
    vertical: { delta: 0, timestamp: 0 },
  });

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const handleWheelPan = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const axis: 'horizontal' | 'vertical' = e.shiftKey ? 'horizontal' : 'vertical';

      const primaryShiftDelta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const rawDelta = axis === 'horizontal'
        ? primaryShiftDelta || e.deltaX || e.deltaY
        : e.deltaY;

      if (!rawDelta) {
        return;
      }

      const now = performance.now();
      const record = velocityRef.current[axis];
      const elapsed = now - record.timestamp;
      const sameDirection = rawDelta * record.delta >= 0 && elapsed < SCROLL_MERGE_WINDOW_MS;
      const blendedDelta = sameDirection
        ? rawDelta + record.delta * 0.5
        : rawDelta;

      const magnitude = Math.min(SCROLL_MAX_DELTA, Math.abs(blendedDelta));
      const normalized = Math.max(0.01, magnitude / SCROLL_BASE_UNIT);
      const microStep = Math.max(
        MIN_SCROLL_STEP,
        MIN_SCROLL_STEP * Math.pow(normalized, MICRO_SCROLL_EXPONENT)
      );
      const fastComponent = magnitude > FAST_SCROLL_THRESHOLD
        ? Math.pow((magnitude - FAST_SCROLL_THRESHOLD) / FAST_SCROLL_THRESHOLD, 1.15) * FAST_SCROLL_MULTIPLIER
        : 0;
      const finalDelta = Math.sign(blendedDelta || 1) * (microStep + fastComponent);

      velocityRef.current[axis] = { delta: blendedDelta, timestamp: now };

      setPan((prev) =>
        clampPan({
          x: axis === 'horizontal' ? prev.x - finalDelta : prev.x,
          y: axis === 'vertical' ? prev.y - finalDelta : prev.y,
        })
      );
    };

    element.addEventListener('wheel', handleWheelPan, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheelPan);
    };
  }, []);

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

  const {
    showHorizontalScrollbar,
    showVerticalScrollbar,
    horizontalFillWidth,
    horizontalMarginLeft,
    verticalFillHeight,
    verticalMarginTop,
  } = useMemo(() => {
    if (!artboardBounds || viewportSize.width === 0 || viewportSize.height === 0) {
      return {
        showHorizontalScrollbar: false,
        showVerticalScrollbar: false,
        horizontalFillWidth: MIN_SCROLLBAR_FILL,
        horizontalMarginLeft: 0,
        verticalFillHeight: MIN_SCROLLBAR_FILL,
        verticalMarginTop: 0,
      };
    }

    const leftEdge = pan.x + artboardBounds.minX * scale;
    const rightEdge = pan.x + artboardBounds.maxX * scale;
    const topEdge = pan.y + artboardBounds.minY * scale;
    const bottomEdge = pan.y + artboardBounds.maxY * scale;

    const touchesLeft = leftEdge <= EDGE_ACTIVATION_EPSILON;
    const touchesRight = rightEdge >= viewportSize.width - EDGE_ACTIVATION_EPSILON;
    const touchesTop = topEdge <= EDGE_ACTIVATION_EPSILON;
    const touchesBottom = bottomEdge >= viewportSize.height - EDGE_ACTIVATION_EPSILON;

    const contentWidth = Math.max(1, (artboardBounds.maxX - artboardBounds.minX) * scale);
    const contentHeight = Math.max(1, (artboardBounds.maxY - artboardBounds.minY) * scale);
    const visibleHorizontalFraction = Math.min(1, viewportSize.width / contentWidth);
    const visibleVerticalFraction = Math.min(1, viewportSize.height / contentHeight);

    const horizontalFillWidth = Math.max(
      MIN_SCROLLBAR_FILL,
      Math.min(MAX_SCROLLBAR_FILL, visibleHorizontalFraction * 100)
    );
    const verticalFillHeight = Math.max(
      MIN_SCROLLBAR_FILL,
      Math.min(MAX_SCROLLBAR_FILL, visibleVerticalFraction * 100)
    );

    const leftOverflow = Math.max(0, -leftEdge);
    const rightOverflow = Math.max(0, rightEdge - viewportSize.width);
    const horizontalScrollableSpan = leftOverflow + rightOverflow;
    const horizontalTrackSpace = Math.max(0, 100 - horizontalFillWidth);
    const horizontalProgress = horizontalScrollableSpan > 0
      ? leftOverflow / horizontalScrollableSpan
      : touchesLeft
        ? 0
        : touchesRight
          ? 1
          : 0.5;
    const horizontalMarginLeft = horizontalTrackSpace * horizontalProgress;

    const topOverflow = Math.max(0, -topEdge);
    const bottomOverflow = Math.max(0, bottomEdge - viewportSize.height);
    const verticalScrollableSpan = topOverflow + bottomOverflow;
    const verticalTrackSpace = Math.max(0, 100 - verticalFillHeight);
    const verticalProgress = verticalScrollableSpan > 0
      ? topOverflow / verticalScrollableSpan
      : touchesTop
        ? 0
        : touchesBottom
          ? 1
          : 0.5;
    const verticalMarginTop = verticalTrackSpace * verticalProgress;

    return {
      showHorizontalScrollbar: touchesLeft || touchesRight,
      showVerticalScrollbar: touchesTop || touchesBottom,
      horizontalFillWidth,
      horizontalMarginLeft,
      verticalFillHeight,
      verticalMarginTop,
    };
  }, [artboardBounds, viewportSize.width, viewportSize.height, pan.x, pan.y, scale]);

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

          {/* Scrollbar Indicators */}
          {showHorizontalScrollbar && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 flex w-72 -translate-x-1/2 rounded-full border border-border/60 bg-background/90 shadow-inner">
              <div
                className="h-2 rounded-full bg-primary/70 transition-all"
                style={{
                  width: `${horizontalFillWidth}%`,
                  marginLeft: `${horizontalMarginLeft}%`,
                }}
              />
            </div>
          )}
          {showVerticalScrollbar && (
            <div className="pointer-events-none absolute right-6 top-1/2 z-30 flex h-72 -translate-y-1/2 flex-col rounded-full border border-border/60 bg-background/90 shadow-inner">
              <div
                className="w-2 rounded-full bg-primary/70 transition-all"
                style={{
                  height: `${verticalFillHeight}%`,
                  marginTop: `${verticalMarginTop}%`,
                }}
              />
            </div>
          )}
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
