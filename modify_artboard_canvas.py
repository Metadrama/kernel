import re

file_path = 'resources/js/components/artboard/ArtboardCanvas.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add import
if 'calculateEffectiveGridConfig' not in content:
    content = content.replace(
        "import { createArtboard } from '@/lib/artboard-utils';",
        "import { createArtboard, calculateEffectiveGridConfig } from '@/lib/artboard-utils';"
    )

# 2. Add handleWidgetDragEnd function
marker = 'setArchivedWidgets,'
insertion_point = content.find(marker)
if insertion_point != -1:
    end_of_hook = content.find('});', insertion_point)
    if end_of_hook != -1:
        insert_pos = end_of_hook + 3

        new_function = """

  // Custom drag-out-of-bounds handler
  const handleWidgetDragEnd = useCallback((widgetId: string, sourceArtboardId: string, event: Event) => {
    // We only care if it's a mouse/pointer event with coordinates
    // GridStack events might wrap the native event or be the native event
    const e = event as MouseEvent;
    if (typeof e.clientX !== 'number') return;

    // 1. Convert screen coordinates to canvas coordinates
    if (!canvasRef.current) return;

    const containerRect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - containerRect.left - pan.x) / scale;
    const canvasY = (e.clientY - containerRect.top - pan.y) / scale;

    // 2. Find target artboard
    let targetArtboard: ArtboardSchema | undefined;

    // Iterate artboards to find one under cursor
    // We iterate in reverse stack order (topmost first) effectively by checking list
    // Ideally we should respect z-index if they overlap.
    for (const artboard of artboards) {
      if (!artboard.visible) continue;

      const { x, y } = artboard.position;
      const { widthPx, heightPx } = artboard.dimensions;

      if (
        canvasX >= x &&
        canvasX <= x + widthPx &&
        canvasY >= y &&
        canvasY <= y + heightPx
      ) {
        targetArtboard = artboard;
        // If we found one, and we assume no overlap or don't care about z-order for now
        // (usually artboards don't overlap in this app's logic)
        break;
      }
    }

    // 3. Handle Transfer or Archive
    if (targetArtboard) {
      if (targetArtboard.id !== sourceArtboardId) {
        // Calculate grid position in target
        const padding = targetArtboard.gridPadding ?? 16;
        const localX = canvasX - targetArtboard.position.x - padding;
        const localY = canvasY - targetArtboard.position.y - padding;

        // Convert to grid units
        const gridConfig = calculateEffectiveGridConfig(targetArtboard.dimensions, padding);
        const colWidth = gridConfig.effectiveWidth / gridConfig.columns;

        let gridX = Math.round(localX / colWidth);
        let gridY = Math.round(localY / gridConfig.cellHeight);

        // Clamp to bounds
        gridX = Math.max(0, Math.min(gridX, gridConfig.columns - 1));
        gridY = Math.max(0, gridY);

        transferWidget(widgetId, sourceArtboardId, targetArtboard.id, { x: gridX, y: gridY });
      }
    } else {
      // Dropped on canvas -> Archive
      archiveWidget(widgetId, sourceArtboardId, { x: canvasX, y: canvasY });
    }
  }, [artboards, pan, scale, transferWidget, archiveWidget]);
"""
        content = content[:insert_pos] + new_function + content[insert_pos:]

# 3. Pass prop to ArtboardContainer
# Find where ArtboardContainer is rendered and add prop
# We look for  and the closing
# We iterate to find the right spot.

# Simplified: Find "selectedComponentId={" and replace the block to include the new prop.
# We need to match the indentation and structure.
search_str = """                  selectedComponentId={
                    selectedComponent?.artboardId === artboard.id
                      ? selectedComponent.component.instanceId
                      : undefined
                  }
                />"""

replace_str = """                  selectedComponentId={
                    selectedComponent?.artboardId === artboard.id
                      ? selectedComponent.component.instanceId
                      : undefined
                  }
                  onWidgetDragEnd={(widgetId, event) => handleWidgetDragEnd(widgetId, artboard.id, event)}
                />"""

if search_str in content:
    content = content.replace(search_str, replace_str)
else:
    # Fallback if exact whitespace match fails
    # Try regex or looser search
    pattern = r'(selectedComponentId=\{[^}]+\}\s*[^>]*)(/>)'
    # This is hard to do safely with simple replace if formatting differs
    # Let's try to find the location by unique string
    loc = content.find('selectedComponentId={')
    if loc != -1:
        # Find />
        end_tag = content.find('/>', loc)
        if end_tag != -1:
             # Check if we are inside ArtboardContainer
             # Look backwards for <ArtboardContainer
             tag_start = content.rfind('<ArtboardContainer', 0, loc)
             if tag_start != -1:
                 # Insert before />
                 content = content[:end_tag] + '  onWidgetDragEnd={(widgetId, event) => handleWidgetDragEnd(widgetId, artboard.id, event)}\n                ' + content[end_tag:]

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully modified ArtboardCanvas.tsx")
