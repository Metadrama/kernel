/**
 * selection-utils.ts - Multi-selection utilities for widgets and components
 * 
 * Provides shift-click selection, box selection, and selection state management.
 */

export interface SelectionState {
    /** Currently selected item IDs */
    selectedIds: string[];
    /** Last item that was clicked (for shift-range selection) */
    lastSelectedId: string | null;
}

export interface Rect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Initial empty selection state
 */
export const EMPTY_SELECTION: SelectionState = {
    selectedIds: [],
    lastSelectedId: null,
};

/**
 * Handle click on an item with optional shift key for multi-select
 */
export function handleItemClick(
    itemId: string,
    isShiftHeld: boolean,
    isCtrlHeld: boolean,
    currentState: SelectionState
): SelectionState {
    // Ctrl+click: toggle this item
    if (isCtrlHeld) {
        const isSelected = currentState.selectedIds.includes(itemId);
        return {
            selectedIds: isSelected
                ? currentState.selectedIds.filter(id => id !== itemId)
                : [...currentState.selectedIds, itemId],
            lastSelectedId: itemId,
        };
    }

    // Shift+click: add to selection (range selection would require ordered list)
    if (isShiftHeld) {
        const isSelected = currentState.selectedIds.includes(itemId);
        if (isSelected) {
            return currentState; // Already selected, keep as is
        }
        return {
            selectedIds: [...currentState.selectedIds, itemId],
            lastSelectedId: itemId,
        };
    }

    // Normal click: select only this item
    return {
        selectedIds: [itemId],
        lastSelectedId: itemId,
    };
}

/**
 * Clear all selection
 */
export function clearSelection(): SelectionState {
    return EMPTY_SELECTION;
}

/**
 * Check if an item is selected
 */
export function isItemSelected(itemId: string, state: SelectionState): boolean {
    return state.selectedIds.includes(itemId);
}

/**
 * Get items that fall within a selection box
 */
export function getItemsInSelectionBox(
    items: Rect[],
    selectionBox: { x: number; y: number; width: number; height: number }
): string[] {
    const boxRight = selectionBox.x + selectionBox.width;
    const boxBottom = selectionBox.y + selectionBox.height;

    // Normalize box coordinates (handle negative width/height from drag direction)
    const minX = Math.min(selectionBox.x, boxRight);
    const maxX = Math.max(selectionBox.x, boxRight);
    const minY = Math.min(selectionBox.y, boxBottom);
    const maxY = Math.max(selectionBox.y, boxBottom);

    return items
        .filter(item => {
            const itemRight = item.x + item.width;
            const itemBottom = item.y + item.height;

            // Check if item intersects with selection box
            return !(
                item.x > maxX ||
                itemRight < minX ||
                item.y > maxY ||
                itemBottom < minY
            );
        })
        .map(item => item.id);
}

/**
 * Move multiple selected items by a delta
 */
export function moveSelectedItems<T extends Rect>(
    items: T[],
    selectedIds: string[],
    deltaX: number,
    deltaY: number
): T[] {
    return items.map(item => {
        if (selectedIds.includes(item.id)) {
            return {
                ...item,
                x: item.x + deltaX,
                y: item.y + deltaY,
            };
        }
        return item;
    });
}

/**
 * Z-order operations
 */
export type ZOrderOperation = 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward';

/**
 * Calculate new z-index values after a z-order operation
 */
export function updateZOrder<T extends { id: string; zIndex?: number }>(
    items: T[],
    targetId: string,
    operation: ZOrderOperation
): T[] {
    // Sort by current zIndex
    const sorted = [...items].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const targetIndex = sorted.findIndex(item => item.id === targetId);

    if (targetIndex === -1) return items;

    const newOrder = [...sorted];
    const target = newOrder[targetIndex];

    switch (operation) {
        case 'bringToFront':
            newOrder.splice(targetIndex, 1);
            newOrder.push(target);
            break;
        case 'sendToBack':
            newOrder.splice(targetIndex, 1);
            newOrder.unshift(target);
            break;
        case 'bringForward':
            if (targetIndex < newOrder.length - 1) {
                newOrder.splice(targetIndex, 1);
                newOrder.splice(targetIndex + 1, 0, target);
            }
            break;
        case 'sendBackward':
            if (targetIndex > 0) {
                newOrder.splice(targetIndex, 1);
                newOrder.splice(targetIndex - 1, 0, target);
            }
            break;
    }

    // Assign new zIndex values
    return items.map(item => ({
        ...item,
        zIndex: newOrder.findIndex(o => o.id === item.id),
    }));
}
