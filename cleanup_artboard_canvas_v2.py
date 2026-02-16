import re

file_path = 'resources/js/components/artboard/ArtboardCanvas.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Remove ALL occurrences of handleWidgetDragEnd function block
# We search for the function definition start and its end.
# Since I inserted duplicates, they look similar.
# Let's remove any block that starts with `  // Custom drag-out-of-bounds handler`
# and ends with `  }, [artboards, pan, scale, transferWidget, archiveWidget]);`

# Use regex with DOTALL to match across lines
func_pattern = r'\s*// Custom drag-out-of-bounds handler\s+const handleWidgetDragEnd = useCallback\(\(widgetId: string, sourceArtboardId: string, event: Event\) => \{.*?\}, \[artboards, pan, scale, transferWidget, archiveWidget\]\);\s*'
content = re.sub(func_pattern, '\n', content, flags=re.DOTALL)

# 2. Remove ALL occurrences of onWidgetDragEnd prop
prop_pattern = r'\s*onWidgetDragEnd=\{\(widgetId, event\) => handleWidgetDragEnd\(widgetId, artboard\.id, event\)\}'
content = re.sub(prop_pattern, '', content)

# 3. Insert single copy of function
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

# 4. Insert single copy of prop
loc = content.find('selectedComponentId={')
if loc != -1:
    brace_count = 0
    i = loc
    found_end = False
    while i < len(content):
        if content[i] == '{': brace_count += 1
        if content[i] == '}': brace_count -= 1
        if brace_count == 0 and content[i] == '}':
             found_end = True
             end_idx = i + 1
             break
        i += 1

    if found_end:
        # Check if prop is already there (we removed it)
        content = content[:end_idx] + '\n                  onWidgetDragEnd={(widgetId, event) => handleWidgetDragEnd(widgetId, artboard.id, event)}' + content[end_idx:]

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully cleaned and modified ArtboardCanvas.tsx v2")
