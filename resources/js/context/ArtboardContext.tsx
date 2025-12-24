import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type { ArtboardSchema } from '@/types/artboard';

interface ArtboardContextValue {
  artboards: ArtboardSchema[];
  setArtboards: React.Dispatch<React.SetStateAction<ArtboardSchema[]>>;
  selectedArtboardId: string | null;
  setSelectedArtboardId: React.Dispatch<React.SetStateAction<string | null>>;
  artboardStackOrder: string[];
  bringArtboardToFront: (artboardId: string) => void;
  moveArtboardLayer: (artboardId: string, direction: 'up' | 'down') => void;
  duplicateArtboard: (artboardId: string, count: number) => void;
}

const ArtboardContext = createContext<ArtboardContextValue | undefined>(undefined);

interface InitialData {
  dashboardId?: string;
  dashboardName?: string;
  artboards?: ArtboardSchema[];
}

interface ArtboardProviderProps {
  children: React.ReactNode;
  initialData?: InitialData;
}

const STORAGE_KEY = 'artboards';
const STORAGE_VERSION = 1;

type PersistedArtboardsPayloadV1 = {
  version: 1;
  artboards: ArtboardSchema[];
};

const ARTBOARD_FORMATS = [
  'a4-portrait',
  'a4-landscape',
  'a3-portrait',
  'a3-landscape',
  'a2-portrait',
  'a2-landscape',
  'slide-16-9',
  'slide-4-3',
  'web-1440',
  'web-responsive',
  'display-fhd',
  'display-4k',
  'mobile-portrait',
  'mobile-landscape',
  'custom',
] as const;

const zComponentPosition = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    zIndex: z.number(),
    rotation: z.number().optional(),
  })
  .passthrough();

const zArtboardComponent = z
  .object({
    instanceId: z.string(),
    componentType: z.string(),
    position: zComponentPosition,
    config: z.record(z.string(), z.unknown()),
    locked: z.boolean().optional(),
  })
  .passthrough();

const zArtboardDimensions = z
  .object({
    widthMm: z.number().optional(),
    heightMm: z.number().optional(),
    widthPx: z.number(),
    heightPx: z.number(),
    aspectRatio: z.number(),
    dpi: z.number(),
    label: z.string(),
  })
  .passthrough();

const zCanvasPosition = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .passthrough();

const zArtboardSchema: z.ZodType<ArtboardSchema> = z
  .object({
    id: z.string(),
    name: z.string(),
    format: z.enum(ARTBOARD_FORMATS),
    dimensions: zArtboardDimensions,
    position: zCanvasPosition,
    zoom: z.number(),
    backgroundColor: z.string(),
    backgroundImage: z.string().optional(),
    components: z.array(zArtboardComponent),
    locked: z.boolean(),
    visible: z.boolean(),
    showGrid: z.boolean(),
    showRulers: z.boolean(),
    gridPadding: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

const zPersistedPayloadV1 = z.object({
  version: z.literal(1),
  artboards: z.array(zArtboardSchema),
});

const loadArtboards = (initialData?: InitialData): ArtboardSchema[] => {
  // Prefer server data if provided
  if (initialData?.artboards && initialData.artboards.length > 0) {
    return initialData.artboards;
  }

  // Fallback to localStorage
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    // Backward-compatible: old format was just ArtboardSchema[]
    if (Array.isArray(parsed)) {
      const result = z.array(zArtboardSchema).safeParse(parsed);
      if (result.success) return result.data;
      console.warn('Invalid persisted artboards (legacy array format). Resetting to empty.', result.error);
      return [];
    }

    // New versioned format
    const payloadResult = zPersistedPayloadV1.safeParse(parsed);
    if (payloadResult.success) {
      return payloadResult.data.artboards;
    }

    console.warn('Invalid persisted artboards (versioned format). Resetting to empty.', payloadResult.error);
    return [];
  } catch (error) {
    console.error('Failed to load artboards:', error);
    return [];
  }
};

export function ArtboardProvider({ children, initialData }: ArtboardProviderProps) {
  const [artboards, setArtboards] = useState<ArtboardSchema[]>(() => loadArtboards(initialData));
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

    const timeoutId = window.setTimeout(() => {
      try {
        const payload: PersistedArtboardsPayloadV1 = {
          version: STORAGE_VERSION,
          artboards,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.error('Failed to save artboards:', error);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
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

  // Deep duplicate artboard with new IDs
  const duplicateArtboard = useCallback((artboardId: string, count: number) => {
    setArtboards((prev) => {
      const source = prev.find((a) => a.id === artboardId);
      if (!source) return prev;

      const newArtboards: ArtboardSchema[] = [];
      const now = new Date().toISOString();

      // Find the rightmost position to append the duplicates
      let maxX = source.position.x;
      prev.forEach(a => {
        const right = a.position.x + a.dimensions.widthPx;
        if (right > maxX) maxX = right;
      });
      // Start duplicates after the global rightmost element with gap
      let startX = maxX + 100;

      for (let i = 0; i < count; i++) {
        // Deep clone components
        const newComponents = source.components.map((c) => ({
          ...c,
          instanceId: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        const newArtboard: ArtboardSchema = {
          ...source,
          id: `artboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${source.name} Copy${count > 1 ? ` ${i + 1}` : ''}`,
          position: {
            x: startX,
            y: source.position.y,
          },
          components: newComponents,
          createdAt: now,
          updatedAt: now,
          // Reset interaction states
          locked: false,
        };

        newArtboards.push(newArtboard);
        startX += newArtboard.dimensions.widthPx + 100; // Increment for next copy
      }

      return [...prev, ...newArtboards];
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
    duplicateArtboard,
  }), [artboards, selectedArtboardId, artboardStackOrder, bringArtboardToFront, moveArtboardLayer, duplicateArtboard]);

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
