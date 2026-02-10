import type { Artboard } from '@/modules/Artboard/types/artboard';
import type { DataSource } from '@/modules/DataLayer/types/component-config';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zArtboard, zPersistedPayloadV1 } from '@/modules/Artboard/types/artboard-schemas';

const ENABLE_LOCALSTORAGE_FALLBACK = false;
const ENABLE_LOCALSTORAGE_PERSIST = false;

function withArtboardDefaults(a: Artboard): Artboard {
    return {
        ...a,
        clipContent: typeof a.clipContent === 'boolean' ? a.clipContent : true,
    };
}

function withArtboardsDefaults(artboards: Artboard[]): Artboard[] {
    return artboards.map(withArtboardDefaults);
}

interface ArtboardContextValue {
    artboards: Artboard[];
    setArtboards: React.Dispatch<React.SetStateAction<Artboard[]>>;
    selectedArtboardId: string | null;
    setSelectedArtboardId: React.Dispatch<React.SetStateAction<string | null>>;
    artboardStackOrder: string[];
    bringArtboardToFront: (artboardId: string) => void;
    moveArtboardLayer: (artboardId: string, direction: 'up' | 'down') => void;
    duplicateArtboard: (artboardId: string, count: number) => void;
    dataSourceConfig: DataSource | null;
    setDataSourceConfig: React.Dispatch<React.SetStateAction<DataSource | null>>;
    autosaveEnabled: boolean;
    setAutosaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    // Component selection
    selectedComponentId: string | null;
    setSelectedComponentId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ArtboardContext = createContext<ArtboardContextValue | undefined>(undefined);

interface InitialData {
    dashboardId?: string;
    dashboardName?: string;
    artboards?: Artboard[];
    dataSourceConfig?: DataSource | null;
}

interface ArtboardProviderProps {
    children: React.ReactNode;
    initialData?: InitialData;
}

const STORAGE_KEY = 'artboards';
const STORAGE_VERSION = 1;
const AUTOSAVE_STORAGE_PREFIX = 'autosave-enabled:';

type PersistedArtboardsPayloadV1 = {
    version: 1;
    artboards: Artboard[];
};

const loadArtboards = (initialData?: InitialData): Artboard[] => {
    // Prefer server data if provided
    if (initialData?.artboards && initialData.artboards.length > 0) {
        return withArtboardsDefaults(initialData.artboards);
    }

    // Fallback to localStorage (DISABLED)
    // We do not want workspaces to "share" stale local state across different workspace IDs.
    // The server-provided `initialData` should be the source of truth for workspace content.
    if (!ENABLE_LOCALSTORAGE_FALLBACK || typeof window === 'undefined') {
        return [];
    }

    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];

        const parsed: unknown = JSON.parse(saved);

        // Backward-compatible: old format was just Artboard[]
        if (Array.isArray(parsed)) {
            const result = z.array(zArtboard).safeParse(parsed);
            if (result.success) return withArtboardsDefaults(result.data);
            console.warn('Invalid persisted artboards (legacy array format). Resetting to empty.', result.error);
            return [];
        }

        // New versioned format
        const payloadResult = zPersistedPayloadV1.safeParse(parsed);
        if (payloadResult.success) {
            return withArtboardsDefaults(payloadResult.data.artboards);
        }

        console.warn('Invalid persisted artboards (versioned format). Resetting to empty.', payloadResult.error);
        return [];
    } catch (error) {
        console.error('Failed to load artboards:', error);
        return [];
    }
};

export function ArtboardProvider({ children, initialData }: ArtboardProviderProps) {
    const dashboardId = initialData?.dashboardId ?? 'default';
    const [artboards, setArtboards] = useState<Artboard[]>(() => loadArtboards(initialData));
    const [selectedArtboardId, setSelectedArtboardId] = useState<string | null>(null);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [artboardStackOrder, setArtboardStackOrder] = useState<string[]>([]);
    const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem(`${AUTOSAVE_STORAGE_PREFIX}${dashboardId}`);
        if (stored === null) return true;
        return stored === 'true';
    });

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
        // Persisting to localStorage is disabled to prevent cross-workspace leakage.
        if (!ENABLE_LOCALSTORAGE_PERSIST || typeof window === 'undefined') {
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

            const newArtboards: Artboard[] = [];
            const now = new Date().toISOString();

            // Find the rightmost position to append the duplicates
            let maxX = source.position.x;
            prev.forEach((a) => {
                const right = a.position.x + a.dimensions.widthPx;
                if (right > maxX) maxX = right;
            });
            // Start duplicates after the global rightmost element with gap
            let startX = maxX + 100;

            for (let i = 0; i < count; i++) {
                // Deep clone components
                const newComponents = source.components.map((c) => ({
                    ...c,
                    instanceId: `component - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} `,
                }));

                const newArtboard: Artboard = {
                    ...source,
                    id: `artboard - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} `,
                    name: `${source.name} Copy${count > 1 ? ` ${i + 1}` : ''} `,
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

    const [dataSourceConfig, setDataSourceConfig] = useState<DataSource | null>(initialData?.dataSourceConfig || null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(`${AUTOSAVE_STORAGE_PREFIX}${dashboardId}`, String(autosaveEnabled));
    }, [autosaveEnabled, dashboardId]);

    const value = useMemo<ArtboardContextValue>(
        () => ({
            artboards,
            setArtboards,
            selectedArtboardId,
            setSelectedArtboardId,
            artboardStackOrder,
            bringArtboardToFront,
            moveArtboardLayer,
            duplicateArtboard,
            dataSourceConfig,
            setDataSourceConfig,
            autosaveEnabled,
            setAutosaveEnabled,
            selectedComponentId,
            setSelectedComponentId,
        }),
        [
            artboards,
            selectedArtboardId,
            selectedComponentId,
            artboardStackOrder,
            bringArtboardToFront,
            moveArtboardLayer,
            duplicateArtboard,
            dataSourceConfig,
            autosaveEnabled,
        ],
    );

    return <ArtboardContext.Provider value={value}>{children}</ArtboardContext.Provider>;
}

export function useArtboardContext() {
    const context = useContext(ArtboardContext);
    if (!context) {
        throw new Error('useArtboardContext must be used within an ArtboardProvider');
    }
    return context;
}

