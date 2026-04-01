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
 *
 * Clipboard:
 * - Ctrl+C : Copy
 * - Ctrl+V : Paste
 * - Ctrl+D : Duplicate
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
    /** Callback for copy */
    onCopy?: () => void;
    /** Callback for paste */
    onPaste?: () => void;
    /** Callback for duplicate */
    onDuplicate?: () => void;
}

export function useKeyboardShortcuts({
    enabled = true,
    onZOrderChange,
    onDelete,
    onCopy,
    onPaste,
    onDuplicate,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Don't capture shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Shortcuts with Ctrl/Meta key
        if (e.ctrlKey || e.metaKey) {
            // Z-Order
            if (e.key === ']') {
                e.preventDefault();
                if (e.shiftKey) {
                    onZOrderChange?.('bringToFront');
                } else {
                    onZOrderChange?.('bringForward');
                }
                return;
            }

            if (e.key === '[') {
                e.preventDefault();
                if (e.shiftKey) {
                    onZOrderChange?.('sendToBack');
                } else {
                    onZOrderChange?.('sendBackward');
                }
                return;
            }

            // Clipboard
            if (e.key === 'c' || e.key === 'C') {
                if (onCopy) {
                    e.preventDefault();
                    onCopy();
                }
                return;
            }

            if (e.key === 'v' || e.key === 'V') {
                if (onPaste) {
                    // Don't prevent default paste if we want system paste behavior?
                    // Usually for canvas we handle it manually.
                    onPaste();
                }
                return;
            }

            if (e.key === 'd' || e.key === 'D') {
                if (onDuplicate) {
                    e.preventDefault();
                    onDuplicate();
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
    }, [enabled, onZOrderChange, onDelete, onCopy, onPaste, onDuplicate]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
