import { useMemo } from 'react';
import type { WidgetSchema, WidgetComponent } from '@/types/dashboard';
import { getComponent, isComponentRegistered } from '@/components/widget-components';

interface MobileWidgetShellProps {
  widget: WidgetSchema;
}

function MobileComponentItem({ component }: { component: WidgetComponent }) {
  const ComponentToRender = getComponent(component.componentType);
  const isRegistered = isComponentRegistered(component.componentType);

  if (!isRegistered || !ComponentToRender) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <ComponentToRender config={component.config} />
    </div>
  );
}

export default function MobileWidgetShell({ widget }: MobileWidgetShellProps) {
  // Sort components by zIndex, though in mobile we might just want to stack them or
  // respect the same z-order if they overlap in desktop.
  // For simplicity in mobile stack, we might just render them. 
  // If a widget has multiple components, we stack them vertically for now 
  // or simple absolute positioning might break if we don't have a fixed height container.
  
  // Strategy: In mobile, complex widgets with multiple overlapping components might be tricky.
  // We will assume for now that widgets are mostly single-component or clean groups.
  // If we want to preserve relative layout WITHIN a widget, we need to keep relative positioning
  // but scale it to width.
  
  // However, simpler approach: Just stack them if they are separate.
  // Or: Render them in a relative container with a fixed aspect ratio or height based on content.
  
  // Let's try to preserve relative layout but responsive. 
  // Actually, standard responsive web dev says "stack them". 
  // But these are "canvas" components. 
  
  // Let's use a simplified approach: Render the most "important" component or just stack them.
  const components = useMemo(() => {
    return [...(widget.components || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [widget.components]);

  if (components.length === 0) return null;

  return (
    <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm mb-4 overflow-hidden">
      <div className="relative p-2 flex flex-col gap-2">
        {components.map((component) => (
           // Wrapper to ensure chart/content takes full width
          <div key={component.instanceId} className="w-full">
            <MobileComponentItem component={component} />
          </div>
        ))}
      </div>
    </div>
  );
}
