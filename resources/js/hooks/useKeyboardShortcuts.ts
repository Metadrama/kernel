/**
 * useKeyboardShortcuts - Global keyboard shortcuts for z-order and other controls
 * 
 * Z-Order shortcuts:
 * - Ctrl+] : Bring Forward
 * - Ctrl+[ : Send Backward
 * - Ctrl+Shift+] : Bring to Front
 * - Ctrl+Shift+[ : Send to Back
 * 
 * Delete:
 * - Delete/Backspace : Remove selected item
 */

import { useEffect, useCallback } from 'react';

export type ZOrderOperation = 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward';

export interface UseKeyboardShortcutsOptions {
    /** Whether shortcuts are enabled (typically when an item is selected) */
    enabled?: boolean;
    /** Callback for z-order changes */
    onZOrderChange?: (operation: ZOrderOperation) => void;
    /** Callback for delete key */
    onDelete?: () => void;
}

export function useKeyboardShortcuts({
    enabled = true,
    onZOrderChange,
    onDelete,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Don't capture shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Z-order shortcuts with Ctrl key
        if (e.ctrlKey || e.metaKey) {
            // Ctrl+] or Ctrl+Shift+]
            if (e.key === ']') {
                e.preventDefault();
                if (e.shiftKey) {
                    onZOrderChange?.('bringToFront');
                } else {
                    onZOrderChange?.('bringForward');
                }
                return;
            }

            // Ctrl+[ or Ctrl+Shift+[
            if (e.key === '[') {
                e.preventDefault();
                if (e.shiftKey) {
                    onZOrderChange?.('sendToBack');
                } else {
                    onZOrderChange?.('sendBackward');
                }
                return;
            }
        }

        // Delete key
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Only on Backspace when not in an input
            if (e.key === 'Backspace' && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return;
            }
            e.preventDefault();
            onDelete?.();
        }
    }, [enabled, onZOrderChange, onDelete]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
