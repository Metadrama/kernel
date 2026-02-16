import re

file_path = 'resources/js/components/artboard/ArtboardCanvas.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Remove duplicate imports if any
# My script checked for import presence before adding, so imports should be fine.
# But grep showed duplicates?
# "import { createArtboard, calculateEffectiveGridConfig } from '@/lib/artboard-utils';"
# "        const gridConfig = calculateEffectiveGridConfig(targetArtboard.dimensions, padding);"
# The grep output showed the line in code too. The import line appeared once in grep output (first line).
# The other lines were usage.
# So imports are fine.

# 2. Remove all handleWidgetDragEnd definitions
# The function block starts with "  // Custom drag-out-of-bounds handler"
# and ends with "  }, [artboards, pan, scale, transferWidget, archiveWidget]);"
# I can try to find this block and remove it.

# Regex for the function block
# Note: make sure to escape special chars
func_pattern = re.compile(r'\s+// Custom drag-out-of-bounds handler\s+const handleWidgetDragEnd = useCallback\(\(widgetId: string, sourceArtboardId: string, event: Event\) => \{[\s\S]*?\}, \[artboards, pan, scale, transferWidget, archiveWidget\]\);\n', re.MULTILINE)

# Remove all matches
content = func_pattern.sub('', content)

# 3. Remove all onWidgetDragEnd props
prop_pattern = re.compile(r'\s+onWidgetDragEnd=\{\(widgetId, event\) => handleWidgetDragEnd\(widgetId, artboard\.id, event\)\}', re.MULTILINE)
content = prop_pattern.sub('', content)

# Now inserting correct code (single copy)

# Insert function
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

# Insert prop
# Search for selectedComponentId={...} block
# We know the prop  is just before .
# Or search for  after .

# Let's find
loc = content.find('selectedComponentId={')
if loc != -1:
    # Find matching brace
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
        # Check if prop is already there (we removed it, so no)
        # Insert after  block
        content = content[:end_idx] + '\n                  onWidgetDragEnd={(widgetId, event) => handleWidgetDragEnd(widgetId, artboard.id, event)}' + content[end_idx:]

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully cleaned and modified ArtboardCanvas.tsx")
