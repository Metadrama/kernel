/**
 * useWidgetTransfer - Coordinate widget state during cross-grid transfers
 * 
 * Handles widget movement between:
 * - Artboard A → Artboard B (transfer)
 * - Artboard → Canvas (archive)
 * - Canvas → Artboard (unarchive)
 */

import { useCallback } from 'react';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema } from '@/types/dashboard';

export interface UseWidgetTransferOptions {
    artboards: ArtboardSchema[];
    setArtboards: React.Dispatch<React.SetStateAction<ArtboardSchema[]>>;
    archivedWidgets: WidgetSchema[];
    setArchivedWidgets: React.Dispatch<React.SetStateAction<WidgetSchema[]>>;
}

export interface UseWidgetTransferReturn {
    /** Move widget from artboard to canvas (archive) */
    archiveWidget: (widgetId: string, sourceArtboardId: string, canvasPosition: { x: number; y: number }) => void;
    /** Move widget from canvas back to artboard (unarchive) */
    unarchiveWidget: (widgetId: string, targetArtboardId: string, gridPosition: { x: number; y: number }) => void;
    /** Move widget between artboards */
    transferWidget: (widgetId: string, sourceArtboardId: string, targetArtboardId: string, gridPosition: { x: number; y: number }) => void;
    /** Find which artboard contains a widget */
    findWidgetArtboard: (widgetId: string) => ArtboardSchema | undefined;
    /** Check if a widget is archived */
    isWidgetArchived: (widgetId: string) => boolean;
}

export function useWidgetTransfer({
    artboards,
    setArtboards,
    archivedWidgets,
    setArchivedWidgets,
}: UseWidgetTransferOptions): UseWidgetTransferReturn {

    // Find which artboard contains a widget
    const findWidgetArtboard = useCallback((widgetId: string): ArtboardSchema | undefined => {
        return artboards.find(a => a.widgets.some(w => w.id === widgetId));
    }, [artboards]);

    // Check if widget is in archived state
    const isWidgetArchived = useCallback((widgetId: string): boolean => {
        return archivedWidgets.some(w => w.id === widgetId);
    }, [archivedWidgets]);

    // Move widget from artboard to canvas (archive)
    const archiveWidget = useCallback((
        widgetId: string,
        sourceArtboardId: string,
        canvasPosition: { x: number; y: number }
    ) => {
        // Find widget in source artboard
        const sourceArtboard = artboards.find(a => a.id === sourceArtboardId);
        const widget = sourceArtboard?.widgets.find(w => w.id === widgetId);

        if (!widget) {
            console.warn('[WidgetTransfer] Widget not found in source artboard:', widgetId);
            return;
        }

        // Remove from artboard
        setArtboards(prev => prev.map(a =>
            a.id === sourceArtboardId
                ? { ...a, widgets: a.widgets.filter(w => w.id !== widgetId), updatedAt: new Date().toISOString() }
                : a
        ));

        // Add to archived with canvas position
        const archivedWidget: WidgetSchema = {
            ...widget,
            canvasX: canvasPosition.x,
            canvasY: canvasPosition.y,
            sourceArtboardId,
        };

        setArchivedWidgets(prev => [...prev, archivedWidget]);

        console.debug('[WidgetTransfer] Archived widget:', widgetId, 'from artboard:', sourceArtboardId);
    }, [artboards, setArtboards, setArchivedWidgets]);

    // Move widget from canvas back to artboard (unarchive)
    const unarchiveWidget = useCallback((
        widgetId: string,
        targetArtboardId: string,
        gridPosition: { x: number; y: number }
    ) => {
        const widget = archivedWidgets.find(w => w.id === widgetId);

        if (!widget) {
            console.warn('[WidgetTransfer] Widget not found in archived:', widgetId);
            return;
        }

        // Remove from archived
        setArchivedWidgets(prev => prev.filter(w => w.id !== widgetId));

        // Add to artboard with new grid position
        const restoredWidget: WidgetSchema = {
            ...widget,
            x: gridPosition.x,
            y: gridPosition.y,
            // Clear canvas-specific fields
            canvasX: undefined,
            canvasY: undefined,
            sourceArtboardId: undefined,
        };

        setArtboards(prev => prev.map(a =>
            a.id === targetArtboardId
                ? { ...a, widgets: [...a.widgets, restoredWidget], updatedAt: new Date().toISOString() }
                : a
        ));

        console.debug('[WidgetTransfer] Unarchived widget:', widgetId, 'to artboard:', targetArtboardId);
    }, [archivedWidgets, setArchivedWidgets, setArtboards]);

    // Move widget between artboards
    const transferWidget = useCallback((
        widgetId: string,
        sourceArtboardId: string,
        targetArtboardId: string,
        gridPosition: { x: number; y: number }
    ) => {
        if (sourceArtboardId === targetArtboardId) {
            console.debug('[WidgetTransfer] Source and target are same, skipping transfer');
            return;
        }

        // Find the widget
        const sourceArtboard = artboards.find(a => a.id === sourceArtboardId);
        const widget = sourceArtboard?.widgets.find(w => w.id === widgetId);

        if (!widget) {
            console.warn('[WidgetTransfer] Widget not found for transfer:', widgetId);
            return;
        }

        // Perform atomic update
        setArtboards(prev => prev.map(a => {
            if (a.id === sourceArtboardId) {
                // Remove from source
                return {
                    ...a,
                    widgets: a.widgets.filter(w => w.id !== widgetId),
                    updatedAt: new Date().toISOString(),
                };
            }
            if (a.id === targetArtboardId) {
                // Add to target with new position
                return {
                    ...a,
                    widgets: [...a.widgets, { ...widget, x: gridPosition.x, y: gridPosition.y }],
                    updatedAt: new Date().toISOString(),
                };
            }
            return a;
        }));

        console.debug('[WidgetTransfer] Transferred widget:', widgetId, 'from:', sourceArtboardId, 'to:', targetArtboardId);
    }, [artboards, setArtboards]);

    return {
        archiveWidget,
        unarchiveWidget,
        transferWidget,
        findWidgetArtboard,
        isWidgetArchived,
    };
}
