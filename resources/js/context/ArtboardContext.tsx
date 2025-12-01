import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ArtboardSchema } from '@/types/artboard';

interface ArtboardContextValue {
  artboards: ArtboardSchema[];
  setArtboards: React.Dispatch<React.SetStateAction<ArtboardSchema[]>>;
  selectedArtboardId: string | null;
  setSelectedArtboardId: React.Dispatch<React.SetStateAction<string | null>>;
  artboardStackOrder: string[];
  bringArtboardToFront: (artboardId: string) => void;
  moveArtboardLayer: (artboardId: string, direction: 'up' | 'down') => void;
}

const ArtboardContext = createContext<ArtboardContextValue | undefined>(undefined);

const loadArtboards = (): ArtboardSchema[] => {
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

export function ArtboardProvider({ children }: { children: React.ReactNode }) {
  const [artboards, setArtboards] = useState<ArtboardSchema[]>(() => loadArtboards());
  const [selectedArtboardId, setSelectedArtboardId] = useState<string | null>(null);
  const [artboardStackOrder, setArtboardStackOrder] = useState<string[]>([]);

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
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem('artboards', JSON.stringify(artboards));
    } catch (error) {
      console.error('Failed to save artboards:', error);
    }
  }, [artboards]);

  const bringArtboardToFront = useCallback((artboardId: string) => {
    setArtboardStackOrder((prev) => {
      if (!prev.includes(artboardId)) {
        return [...prev, artboardId];
      }
      const filtered = prev.filter((id) => id !== artboardId);
      return [...filtered, artboardId];
    });
  }, []);

  const moveArtboardLayer = useCallback((artboardId: string, direction: 'up' | 'down') => {
    setArtboardStackOrder((prev) => {
      const index = prev.indexOf(artboardId);
      if (index === -1) {
        return prev;
      }

      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(newIndex, 0, removed);
      return next;
    });
  }, []);

  const value = useMemo<ArtboardContextValue>(() => ({
    artboards,
    setArtboards,
    selectedArtboardId,
    setSelectedArtboardId,
    artboardStackOrder,
    bringArtboardToFront,
    moveArtboardLayer,
  }), [artboards, selectedArtboardId, artboardStackOrder, bringArtboardToFront, moveArtboardLayer]);

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
