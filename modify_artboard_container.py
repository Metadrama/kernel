import re

file_path = 'resources/js/components/artboard/ArtboardContainer.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add props to interface
props_pattern = r'(onHeaderAction\?: \(action: \{[^}]+\}\) => void;\n\})'
props_replacement = r'onHeaderAction?: (action: {\n    type: \'menu\' | \'addWidget\';\n    artboardId: string;\n    menuOpen?: boolean;\n    menuPosition?: { x: number; y: number };\n  }) => void;\n  onWidgetDragStart?: (widgetId: string) => void;\n  onWidgetDragEnd?: (widgetId: string, event: Event) => void;\n}'

# Use a simpler search if regex is too complex due to nested braces
if 'onHeaderAction?:' in content:
    # Find the end of interface
    idx = content.find('onHeaderAction?:')
    end_idx = content.find('}', idx)
    # Actually finding the closing brace of the interface might be tricky if nested
    # But ArtboardContainerProps end seems clear.
    # Let's verify context.
    pass

# Simplified approach: Replace specific lines.

# Add to Props
content = content.replace(
    'onWidgetRemoved?: (widgetId: string) => void;',
    'onWidgetRemoved?: (widgetId: string) => void;\n  onWidgetDragStart?: (widgetId: string) => void;\n  onWidgetDragEnd?: (widgetId: string, event: Event) => void;'
)

# Add to Destructuring
content = content.replace(
    'onWidgetRemoved,',
    'onWidgetRemoved,\n  onWidgetDragStart,\n  onWidgetDragEnd,'
)

# Modify GridStack.init and add listeners
# Search for acceptWidgets
content = content.replace(
    "acceptWidgets: '.grid-stack-item', // Accept widgets from any grid",
    "acceptWidgets: false, // Disable native cross-grid transfer to avoid React conflicts"
)

# Add listeners after gridInstanceRef.current = grid;
init_marker = 'gridInstanceRef.current = grid;'
listeners_code = """
        gridInstanceRef.current = grid;

        // Custom drag handling listeners
        grid.on('dragstart', (event: Event, el: any) => {
          const node = el.gridstackNode;
          if (node && node.id && onWidgetDragStart) {
            onWidgetDragStart(String(node.id));
          }
        });

        grid.on('dragstop', (event: Event, el: any) => {
          const node = el.gridstackNode;
          if (node && node.id && onWidgetDragEnd) {
            onWidgetDragEnd(String(node.id), event);
          }
        });
"""

content = content.replace(init_marker, listeners_code.strip())

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully modified ArtboardContainer.tsx")
