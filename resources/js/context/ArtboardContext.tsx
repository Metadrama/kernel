import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema } from '@/types/dashboard';

interface ArtboardContextValue {
  artboards: ArtboardSchema[];
  setArtboards: React.Dispatch<React.SetStateAction<ArtboardSchema[]>>;
  updateArtboard: (id: string, updates: Partial<ArtboardSchema>) => void;
  deleteArtboard: (id: string) => void;
  archivedWidgets: WidgetSchema[];
  setArchivedWidgets: React.Dispatch<React.SetStateAction<WidgetSchema[]>>;
  selectedArtboardId: string | null;
  setSelectedArtboardId: React.Dispatch<React.SetStateAction<string | null>>;
  artboardStackOrder: string[];
  bringArtboardToFront: (artboardId: string) => void;
  moveArtboardLayer: (artboardId: string, direction: 'up' | 'down') => void;
  duplicateArtboard: (artboardId: string, count: number) => void;
  canvasScale: number;
  setCanvasScale: React.Dispatch<React.SetStateAction<number>>;
}

const ArtboardContext = createContext<ArtboardContextValue | undefined>(undefined);

interface InitialData {
  dashboardId?: string;
  dashboardName?: string;
  artboards?: ArtboardSchema[];
  archivedWidgets?: WidgetSchema[];
}

interface ArtboardProviderProps {
  children: React.ReactNode;
  initialData?: InitialData;
}

const loadArtboards = (initialData?: InitialData): ArtboardSchema[] => {
  if (initialData?.artboards && initialData.artboards.length > 0) {
    return initialData.artboards;
  }
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const saved = window.localStorage.getItem('artboards');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load artboards:', error);
    return [];
  }
};

const loadArchivedWidgets = (initialData?: InitialData): WidgetSchema[] => {
  if (initialData?.archivedWidgets && initialData.archivedWidgets.length > 0) {
    return initialData.archivedWidgets;
  }
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const saved = window.localStorage.getItem('archivedWidgets');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load archived widgets:', error);
    return [];
  }
};

export function ArtboardProvider({ children, initialData }: ArtboardProviderProps) {
  const [artboards, setArtboards] = useState<ArtboardSchema[]>(() => loadArtboards(initialData));
  const [archivedWidgets, setArchivedWidgets] = useState<WidgetSchema[]>(() => loadArchivedWidgets(initialData));
  const [selectedArtboardId, setSelectedArtboardId] = useState<string | null>(null);
  const [artboardStackOrder, setArtboardStackOrder] = useState<string[]>([]);
  const [canvasScale, setCanvasScale] = useState(1);

  // Helper functions exposed via context
  const updateArtboard = useCallback((id: string, updates: Partial<ArtboardSchema>) => {
    setArtboards(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
  }, []);

  const deleteArtboard = useCallback((id: string) => {
    setArtboards(prev => prev.filter(a => a.id !== id));
    setArtboardStackOrder(prev => prev.filter(aid => aid !== id));
    if (selectedArtboardId === id) setSelectedArtboardId(null);
  }, [selectedArtboardId]);

  useEffect(() => {
    setArtboardStackOrder((prev) => {
      if (artboards.length === 0) {
        return [];
      }
      const currentIds = artboards.map((artboard) => artboard.id);
      const preserved = prev.filter((id) => currentIds.includes(id));
      const withNew = [...preserved];
      for (const id of currentIds) {
        if (!withNew.includes(id)) {
          withNew.push(id);
        }
      }
      return withNew;
    });
  }, [artboards]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('artboards', JSON.stringify(artboards));
    } catch (error) {
      console.error('Failed to save artboards:', error);
    }
  }, [artboards]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('archivedWidgets', JSON.stringify(archivedWidgets));
    } catch (error) {
      console.error('Failed to save archived widgets:', error);
    }
  }, [archivedWidgets]);

  const bringArtboardToFront = useCallback((artboardId: string) => {
    setArtboardStackOrder((prev) => {
      if (!prev.includes(artboardId)) return [...prev, artboardId];
      const filtered = prev.filter((id) => id !== artboardId);
      return [...filtered, artboardId];
    });
  }, []);

  const moveArtboardLayer = useCallback((artboardId: string, direction: 'up' | 'down') => {
    setArtboardStackOrder((prev) => {
      const index = prev.indexOf(artboardId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(newIndex, 0, removed);
      return next;
    });
  }, []);

  const duplicateArtboard = useCallback((artboardId: string, count: number) => {
    setArtboards((prev) => {
      const source = prev.find((a) => a.id === artboardId);
      if (!source) return prev;
      const newArtboards: ArtboardSchema[] = [];
      const now = new Date().toISOString();
      let maxX = source.position.x;
      prev.forEach(a => {
        const right = a.position.x + a.dimensions.widthPx;
        if (right > maxX) maxX = right;
      });
      let startX = maxX + 100;
      for (let i = 0; i < count; i++) {
        const newWidgets = source.widgets.map((w) => ({
          ...w,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
        const newArtboard: ArtboardSchema = {
          ...source,
          id: `artboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${source.name} Copy${count > 1 ? ` ${i + 1}` : ''}`,
          position: {
            x: startX,
            y: source.position.y,
          },
          widgets: newWidgets,
          createdAt: now,
          updatedAt: now,
          locked: false,
        };
        newArtboards.push(newArtboard);
        startX += newArtboard.dimensions.widthPx + 100;
      }
      return [...prev, ...newArtboards];
    });
  }, []);

  const value = useMemo<ArtboardContextValue>(() => ({
    artboards,
    setArtboards,
    updateArtboard,
    deleteArtboard,
    archivedWidgets,
    setArchivedWidgets,
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
    moveArtboardLayer,
    duplicateArtboard,
    canvasScale,
    setCanvasScale,
  }), [artboards, updateArtboard, deleteArtboard, archivedWidgets, selectedArtboardId, artboardStackOrder, bringArtboardToFront, moveArtboardLayer, duplicateArtboard, canvasScale]);

  return (
    <ArtboardContext.Provider value={value}>
      {children}
    </ArtboardContext.Provider>
  );
}

export function useArtboardContext() {
  const context = useContext(ArtboardContext);
  if (!context) {
    throw new Error('useArtboardContext must be used within an ArtboardProvider');
  }
  return context;
}
