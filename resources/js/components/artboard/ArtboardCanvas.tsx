import { useCallback, useRef, useState, useEffect } from 'react';
import { useArtboardContext } from '@/context/ArtboardContext';
import { useCanvasZoom, useCanvasPan } from '@/hooks';
import ArtboardContainer from './ArtboardContainer';
import { Plus, Minus, Move, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetComponent } from '@/types/dashboard';

export default function ArtboardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);

  const {
    artboards,
    updateArtboard,
    deleteArtboard,
    selectedArtboardId,
    setSelectedArtboardId,
    canvasScale,
    setCanvasScale,
    bringArtboardToFront,
  } = useArtboardContext();

  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | undefined>(undefined);

  // Zoom hook
  const { zoomIn, zoomOut, resetZoom } = useCanvasZoom({
    scale: canvasScale,
    setScale: setCanvasScale,
    minScale: 0.25,
    maxScale: 3,
    containerRef,
  });

  // Pan hook
  const { panPosition, handleMouseDown: handlePanStart, isPanning: isPanActive } = useCanvasPan({
    containerRef,
    contentRef,
    initialPosition: { x: 0, y: 0 },
    scale: canvasScale,
    enabled: isPanning, // Only pan when spacebar held or pan tool active
  });

  // Keyboard shortcuts for canvas navigation
  useKeyboardShortcuts({
    onCopy: () => {}, // Handled by components
    onPaste: () => {}, // Handled by components
    onDelete: () => {}, // Handled by components
  });

  // Global spacebar for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT') {
        setIsPanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleSelectComponent = useCallback((artboardId: string, widgetId: string, component: WidgetComponent) => {
    setSelectedArtboardId(artboardId);
    setSelectedWidgetId(widgetId);
    setSelectedComponentId(component.instanceId);
  }, [setSelectedArtboardId]);

  const handleDeselectComponent = useCallback(() => {
    setSelectedComponentId(undefined);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === contentRef.current) {
        setSelectedArtboardId(null);
        setSelectedWidgetId(null);
        setSelectedComponentId(undefined);
    }
  };

  return (
    <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden bg-muted/20 ${isPanning || isPanActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={isPanning ? handlePanStart : undefined}
        onClick={handleCanvasClick}
        onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) zoomIn();
                else zoomOut();
            }
        }}
    >
      {/* Infinite Canvas Content Area */}
      <div
        ref={contentRef}
        className="absolute origin-top-left w-full h-full will-change-transform"
        style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${canvasScale})`,
        }}
      >
        {/* Render Artboards */}
        {artboards.map((artboard) => (
            <ArtboardContainer
                key={artboard.id}
                artboard={artboard}
                isSelected={selectedArtboardId === artboard.id}
                onUpdate={updateArtboard}
                onDelete={deleteArtboard}
                onSelectComponent={handleSelectComponent}
                selectedWidgetId={selectedWidgetId}
                selectedComponentId={selectedComponentId}
                onDeselectComponent={handleDeselectComponent}
                setSelectedWidgetId={setSelectedWidgetId}
            />
        ))}
      </div>

      {/* Floating Toolbar (Zoom/Pan) */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 p-2 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsPanning(!isPanning)} className={isPanning ? 'bg-muted' : ''}>
            <Move className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={zoomOut}>
            <Minus className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium w-12 text-center select-none">
            {Math.round(canvasScale * 100)}%
        </span>
        <Button variant="ghost" size="icon" onClick={zoomIn}>
            <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={resetZoom} title="Reset Zoom">
            <Layout className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
