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
  const panRef = useRef(pan);
  panRef.current = pan;
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
  const [horizontalScrollActive, setHorizontalScrollActive] = useState(false);
  const [verticalScrollActive, setVerticalScrollActive] = useState(false);

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
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const verticalTrackRef = useRef<HTMLDivElement>(null);
  const activeDragCleanupRef = useRef<(() => void) | null>(null);
  const dragStateRef = useRef<{
    axis: 'horizontal' | 'vertical';
    pointerId: number;
    pointerStart: number;
    progressStart: number;
    travelPx: number;
    onRelease?: () => void;
  } | null>(null);

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

  const scrollToHorizontalProgress = useCallback((progress: number, domain?: { min: number, max: number, viewSize: number }) => {
    if (!artboardBounds || viewportSize.width === 0) return;
    const safeScale = Math.max(scale, 0.0001);

    let rangeStart: number, rangeEnd: number;

    if (domain) {
      rangeStart = domain.min;
      rangeEnd = domain.max - domain.viewSize;
    } else {
      const viewWidthWorld = viewportSize.width / safeScale;
      rangeStart = Math.min(artboardBounds.minX, artboardBounds.maxX - viewWidthWorld);
      rangeEnd = Math.max(artboardBounds.minX, artboardBounds.maxX - viewWidthWorld);
    }

    if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) return;

    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const targetViewMinX = rangeStart + (rangeEnd - rangeStart) * clampedProgress;
    const targetPanX = -targetViewMinX * safeScale;

    setPan((prev) =>
      clampPan({
        x: targetPanX,
        y: prev.y,
      })
    );
  }, [artboardBounds, scale, viewportSize.width]);

  const scrollToVerticalProgress = useCallback((progress: number, domain?: { min: number, max: number, viewSize: number }) => {
    if (!artboardBounds || viewportSize.height === 0) return;
    const safeScale = Math.max(scale, 0.0001);

    let rangeStart: number, rangeEnd: number;

    if (domain) {
      rangeStart = domain.min;
      rangeEnd = domain.max - domain.viewSize;
    } else {
      const viewHeightWorld = viewportSize.height / safeScale;
      rangeStart = Math.min(artboardBounds.minY, artboardBounds.maxY - viewHeightWorld);
      rangeEnd = Math.max(artboardBounds.minY, artboardBounds.maxY - viewHeightWorld);
    }

    if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) return;

    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const targetViewMinY = rangeStart + (rangeEnd - rangeStart) * clampedProgress;
    const targetPanY = -targetViewMinY * safeScale;

    setPan((prev) =>
      clampPan({
        x: prev.x,
        y: targetPanY,
      })
    );
  }, [artboardBounds, scale, viewportSize.height]);


  const attachDragListeners = useCallback((params: {
    pointerId: number;
    axis: 'horizontal' | 'vertical';
    pointerStart: number;
    progressStart: number;
    travelPx: number;
    target: HTMLElement | null;
    domain: { min: number, max: number, viewSize: number };
    onRelease?: () => void;
  }) => {
    if (activeDragCleanupRef.current) {
      activeDragCleanupRef.current();
    }

    dragStateRef.current = {
      axis: params.axis,
      pointerId: params.pointerId,
      pointerStart: params.pointerStart,
      progressStart: params.progressStart,
      travelPx: Math.max(params.travelPx, 0.0001),
      onRelease: params.onRelease,
    };

    const dragDomain = params.domain;

    const handlePointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || event.pointerId !== state.pointerId) return;

      const pointerPos = state.axis === 'horizontal' ? event.clientX : event.clientY;
      const delta = pointerPos - state.pointerStart;
      const newStartPx = state.progressStart * state.travelPx + delta;
      const normalized = Math.min(Math.max(newStartPx / state.travelPx, 0), 1);

      if (state.axis === 'horizontal') {
        scrollToHorizontalProgress(normalized, dragDomain);
      } else {
        scrollToVerticalProgress(normalized, dragDomain);
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      params.target?.releasePointerCapture?.(params.pointerId);
      dragStateRef.current = null;
      activeDragCleanupRef.current = null;
      params.onRelease?.();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== params.pointerId) return;
      cleanup();
    };

    params.target?.setPointerCapture?.(params.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    activeDragCleanupRef.current = cleanup;
  }, [scrollToHorizontalProgress, scrollToVerticalProgress]);

  useEffect(() => {
    return () => {
      if (activeDragCleanupRef.current) {
        activeDragCleanupRef.current();
      }
    };
  }, []);

  // ============================================================================
  // Scrollbar Logic (Lock-on-Drag)
  // ============================================================================

  type ScrollDomain = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    viewWidthWorld: number;
    viewHeightWorld: number;
  };

  const [lockedHorizontalDomain, setLockedHorizontalDomain] = useState<ScrollDomain | null>(null);
  const [lockedVerticalDomain, setLockedVerticalDomain] = useState<ScrollDomain | null>(null);

  const {
    showHorizontalScrollbar,
    showVerticalScrollbar,
    horizontalFillWidth,
    horizontalMarginLeft,
    verticalFillHeight,
    verticalMarginTop,
    currentHorizontalDomain,
    currentVerticalDomain,
  } = useMemo(() => {
    if (!artboardBounds || viewportSize.width === 0 || viewportSize.height === 0) {
      return {
        showHorizontalScrollbar: false,
        showVerticalScrollbar: false,
        horizontalFillWidth: MIN_SCROLLBAR_FILL,
        horizontalMarginLeft: 0,
        verticalFillHeight: MIN_SCROLLBAR_FILL,
        verticalMarginTop: 0,
        currentHorizontalDomain: null,
        currentVerticalDomain: null,
      };
    }

    const safeScale = Math.max(scale, 0.0001);
    const viewWidthWorld = viewportSize.width / safeScale;
    const viewHeightWorld = viewportSize.height / safeScale;

    // --- Horizontal Calculation ---
    const hDomain = lockedHorizontalDomain || {
      minX: artboardBounds.minX,
      maxX: artboardBounds.maxX,
      minY: artboardBounds.minY,
      maxY: artboardBounds.maxY,
      viewWidthWorld,
      viewHeightWorld,
    };

    const viewMinX = (-pan.x) / safeScale;
    const viewMaxX = (viewportSize.width - pan.x) / safeScale;

    let universeMinX: number, universeMaxX: number;

    if (lockedHorizontalDomain) {
      universeMinX = lockedHorizontalDomain.minX;
      universeMaxX = lockedHorizontalDomain.maxX;
    } else {
      universeMinX = Math.min(artboardBounds.minX, viewMinX);
      universeMaxX = Math.max(artboardBounds.maxX, viewMaxX);
    }

    const universeWidth = Math.max(1, universeMaxX - universeMinX);
    const activeViewWidth = lockedHorizontalDomain ? hDomain.viewWidthWorld : viewWidthWorld;

    const visibleHorizontalFraction = Math.min(1, activeViewWidth / universeWidth);
    const horizontalFillWidth = Math.max(
      MIN_SCROLLBAR_FILL,
      Math.min(MAX_SCROLLBAR_FILL, visibleHorizontalFraction * 100)
    );

    const currentViewLeft = (-pan.x) / safeScale;
    const relativeLeft = currentViewLeft - universeMinX;

    const scrollableWidth = universeWidth - activeViewWidth;
    const scrollProgress = scrollableWidth > 0
      ? Math.max(0, Math.min(1, relativeLeft / scrollableWidth))
      : 0.5;

    const horizontalTrackSpace = Math.max(0, 100 - horizontalFillWidth);
    const horizontalMarginLeft = horizontalTrackSpace * scrollProgress;

    // --- Vertical Calculation ---
    const vDomain = lockedVerticalDomain || {
      minX: artboardBounds.minX,
      maxX: artboardBounds.maxX,
      minY: artboardBounds.minY,
      maxY: artboardBounds.maxY,
      viewWidthWorld,
      viewHeightWorld,
    };

    let universeMinY: number, universeMaxY: number;
    const viewMinY = (-pan.y) / safeScale;
    const viewMaxY = (viewportSize.height - pan.y) / safeScale;

    if (lockedVerticalDomain) {
      universeMinY = lockedVerticalDomain.minY;
      universeMaxY = lockedVerticalDomain.maxY;
    } else {
      universeMinY = Math.min(artboardBounds.minY, viewMinY);
      universeMaxY = Math.max(artboardBounds.maxY, viewMaxY);
    }

    const universeHeight = Math.max(1, universeMaxY - universeMinY);
    const activeViewHeight = lockedVerticalDomain ? vDomain.viewHeightWorld : viewHeightWorld;

    const visibleVerticalFraction = Math.min(1, activeViewHeight / universeHeight);
    const verticalFillHeight = Math.max(
      MIN_SCROLLBAR_FILL,
      Math.min(MAX_SCROLLBAR_FILL, visibleVerticalFraction * 100)
    );

    const currentViewTop = (-pan.y) / safeScale;
    const relativeTop = currentViewTop - universeMinY;
    const scrollableHeight = universeHeight - activeViewHeight;
    const vScrollProgress = scrollableHeight > 0
      ? Math.max(0, Math.min(1, relativeTop / scrollableHeight))
      : 0.5;

    const verticalTrackSpace = Math.max(0, 100 - verticalFillHeight);
    const verticalMarginTop = verticalTrackSpace * vScrollProgress;

    const worldEpsilon = EDGE_ACTIVATION_EPSILON / safeScale;
    const touchesLeft = Math.abs(viewMinX - artboardBounds.minX) <= worldEpsilon;
    const touchesRight = Math.abs(viewMaxX - artboardBounds.maxX) <= worldEpsilon;
    const touchesTop = Math.abs(viewMinY - artboardBounds.minY) <= worldEpsilon;
    const touchesBottom = Math.abs(viewMaxY - artboardBounds.maxY) <= worldEpsilon;

    const horizontalOverflow = (artboardBounds.maxX - artboardBounds.minX) > viewWidthWorld;
    const verticalOverflow = (artboardBounds.maxY - artboardBounds.minY) > viewHeightWorld;

    return {
      showHorizontalScrollbar: visibleHorizontalFraction < 0.999 || horizontalOverflow || touchesLeft || touchesRight || !!lockedHorizontalDomain,
      showVerticalScrollbar: visibleVerticalFraction < 0.999 || verticalOverflow || touchesTop || touchesBottom || !!lockedVerticalDomain,
      horizontalFillWidth,
      horizontalMarginLeft,
      verticalFillHeight,
      verticalMarginTop,
      currentHorizontalDomain: { min: universeMinX, max: universeMaxX, viewSize: activeViewWidth },
      currentVerticalDomain: { min: universeMinY, max: universeMaxY, viewSize: activeViewHeight },
    };
  }, [artboardBounds, viewportSize.width, viewportSize.height, pan.x, pan.y, scale, lockedHorizontalDomain, lockedVerticalDomain]);

  const measureHorizontalTrack = useCallback(() => {
    const track = horizontalTrackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return null;

    const handleWidthPx = Math.max(0, (horizontalFillWidth / 100) * rect.width);
    const travelPx = Math.max(0, rect.width - handleWidthPx);
    const handleStartPx = (horizontalMarginLeft / 100) * rect.width;

    return { track, rect, handleWidthPx, travelPx, handleStartPx };
  }, [horizontalFillWidth, horizontalMarginLeft]);

  const measureVerticalTrack = useCallback(() => {
    const track = verticalTrackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    if (rect.height === 0) return null;

    const handleHeightPx = Math.max(0, (verticalFillHeight / 100) * rect.height);
    const travelPx = Math.max(0, rect.height - handleHeightPx);
    const handleStartPx = (verticalMarginTop / 100) * rect.height;

    return { track, rect, handleHeightPx, travelPx, handleStartPx };
  }, [verticalFillHeight, verticalMarginTop]);

  const handleHorizontalHandlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    event.stopPropagation();
    const metrics = measureHorizontalTrack();
    if (!metrics || metrics.travelPx <= 0 || !currentHorizontalDomain) return;

    const lockState: ScrollDomain = {
      minX: currentHorizontalDomain.min,
      maxX: currentHorizontalDomain.max,
      minY: 0,
      maxY: 0,
      viewWidthWorld: currentHorizontalDomain.viewSize,
      viewHeightWorld: 0
    };
    setLockedHorizontalDomain(lockState);

    const progressStart = metrics.travelPx === 0 ? 0 : metrics.handleStartPx / metrics.travelPx;
    setHorizontalScrollActive(true);

    attachDragListeners({
      pointerId: event.pointerId,
      axis: 'horizontal',
      pointerStart: event.clientX,
      progressStart,
      travelPx: metrics.travelPx,
      target: metrics.track,
      domain: currentHorizontalDomain,
      onRelease: () => {
        setHorizontalScrollActive(false);
        setLockedHorizontalDomain(null);
      },
    });
  }, [attachDragListeners, measureHorizontalTrack, currentHorizontalDomain]);

  const handleVerticalHandlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    event.stopPropagation();
    const metrics = measureVerticalTrack();
    if (!metrics || metrics.travelPx <= 0 || !currentVerticalDomain) return;

    const lockState: ScrollDomain = {
      minX: 0,
      maxX: 0,
      minY: currentVerticalDomain.min,
      maxY: currentVerticalDomain.max,
      viewWidthWorld: 0,
      viewHeightWorld: currentVerticalDomain.viewSize
    };
    setLockedVerticalDomain(lockState);

    const progressStart = metrics.travelPx === 0 ? 0 : metrics.handleStartPx / metrics.travelPx;
    setVerticalScrollActive(true);

    attachDragListeners({
      pointerId: event.pointerId,
      axis: 'vertical',
      pointerStart: event.clientY,
      progressStart,
      travelPx: metrics.travelPx,
      target: metrics.track,
      domain: currentVerticalDomain,
      onRelease: () => {
        setVerticalScrollActive(false);
        setLockedVerticalDomain(null);
      },
    });
  }, [attachDragListeners, measureVerticalTrack, currentVerticalDomain]);

  const handleHorizontalTrackPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    const metrics = measureHorizontalTrack();
    if (!metrics || !currentHorizontalDomain) return;

    const lockState: ScrollDomain = {
      minX: currentHorizontalDomain.min,
      maxX: currentHorizontalDomain.max,
      minY: 0,
      maxY: 0,
      viewWidthWorld: currentHorizontalDomain.viewSize,
      viewHeightWorld: 0
    };
    setLockedHorizontalDomain(lockState);

    const pointerWithinTrack = event.clientX - metrics.rect.left;
    const centerOffset = metrics.handleWidthPx / 2;
    const desiredStartPx = Math.min(
      Math.max(pointerWithinTrack - centerOffset, 0),
      Math.max(metrics.travelPx, 0)
    );
    const travelPx = Math.max(metrics.travelPx, 0.0001);
    const newProgress = travelPx === 0 ? 0 : desiredStartPx / travelPx;

    scrollToHorizontalProgress(newProgress, currentHorizontalDomain);

    setHorizontalScrollActive(true);
    attachDragListeners({
      pointerId: event.pointerId,
      axis: 'horizontal',
      pointerStart: event.clientX,
      progressStart: newProgress,
      travelPx,
      target: metrics.track,
      domain: currentHorizontalDomain,
      onRelease: () => {
        setHorizontalScrollActive(false);
        setLockedHorizontalDomain(null);
      },
    });
  }, [attachDragListeners, measureHorizontalTrack, scrollToHorizontalProgress, currentHorizontalDomain]);

  const handleVerticalTrackPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    const metrics = measureVerticalTrack();
    if (!metrics || !currentVerticalDomain) return;

    const lockState: ScrollDomain = {
      minX: 0,
      maxX: 0,
      minY: currentVerticalDomain.min,
      maxY: currentVerticalDomain.max,
      viewWidthWorld: 0,
      viewHeightWorld: currentVerticalDomain.viewSize
    };
    setLockedVerticalDomain(lockState);

    const pointerWithinTrack = event.clientY - metrics.rect.top;
    const centerOffset = metrics.handleHeightPx / 2;
    const desiredStartPx = Math.min(
      Math.max(pointerWithinTrack - centerOffset, 0),
      Math.max(metrics.travelPx, 0)
    );
    const travelPx = Math.max(metrics.travelPx, 0.0001);
    const newProgress = travelPx === 0 ? 0 : desiredStartPx / travelPx;

    scrollToVerticalProgress(newProgress, currentVerticalDomain);

    setVerticalScrollActive(true);
    attachDragListeners({
      pointerId: event.pointerId,
      axis: 'vertical',
      pointerStart: event.clientY,
      progressStart: newProgress,
      travelPx,
      target: metrics.track,
      domain: currentVerticalDomain,
      onRelease: () => {
        setVerticalScrollActive(false);
        setLockedVerticalDomain(null);
      },
    });
  }, [attachDragListeners, measureVerticalTrack, scrollToVerticalProgress, currentVerticalDomain]);

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
                  canvasPanRef={panRef}
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
            <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-2">
              <div
                ref={horizontalTrackRef}
                className="pointer-events-auto group flex h-5 w-full items-center rounded-full border border-border/40 bg-background/95 shadow-inner"
                style={{ touchAction: 'none', cursor: 'pointer' }}
                onPointerDown={handleHorizontalTrackPointerDown}
              >
                <div
                  className="h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{
                    width: `${horizontalFillWidth}%`,
                    marginLeft: `${horizontalMarginLeft}%`,
                  }}
                  onPointerDown={handleHorizontalHandlePointerDown}
                >
                  <div className={`h-1.5 w-full rounded-full transition-all duration-150 ${horizontalScrollActive ? 'bg-primary' : 'bg-primary/70'} group-hover:bg-primary`} />
                </div>
              </div>
            </div>
          )}
          {showVerticalScrollbar && (
            <div className="absolute inset-y-0 right-0 z-30 pr-2 py-3">
              <div
                ref={verticalTrackRef}
                className="pointer-events-auto group flex h-full w-5 flex-col items-center rounded-full border border-border/40 bg-background/95 shadow-inner"
                style={{ touchAction: 'none', cursor: 'pointer' }}
                onPointerDown={handleVerticalTrackPointerDown}
              >
                <div
                  className="w-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{
                    height: `${verticalFillHeight}%`,
                    marginTop: `${verticalMarginTop}%`,
                  }}
                  onPointerDown={handleVerticalHandlePointerDown}
                >
                  <div className={`w-1.5 h-full rounded-full transition-all duration-150 ${verticalScrollActive ? 'bg-primary' : 'bg-primary/70'} group-hover:bg-primary`} />
                </div>
              </div>
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
