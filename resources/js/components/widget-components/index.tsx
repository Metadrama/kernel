// Widget Component Registry
// Maps component IDs to their React component implementations

import { lazy, Suspense } from 'react';
import { getRenderableComponentEntries } from '@/constants/component-catalog';

// Lazy load components for better performance
const ChartComponent = lazy(() => import('./ChartComponent'));
const ChartLegendComponent = lazy(() => import('./ChartLegendComponent'));
const HeadingComponent = lazy(() => import('./HeadingComponent'));
const KpiComponent = lazy(() => import('./KpiComponent'));

// Loading placeholder
function ComponentLoader() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="h-2 w-16 rounded bg-muted" />
      </div>
    </div>
  );
}

export interface WidgetRendererProps {
  config?: Record<string, unknown>;
  canvasScale?: number;
}

const RENDERER_MAP: Record<string, React.ComponentType<WidgetRendererProps>> = {
  chart: ({ config, canvasScale }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent
        config={{ ...config, chartType: (config?.chartType as 'line' | 'bar' | 'doughnut') || 'line' }}
        canvasScale={canvasScale}
      />
    </Suspense>
  ),
  'chart-line': ({ config, canvasScale }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'line' }} canvasScale={canvasScale} />
    </Suspense>
  ),
  'chart-bar': ({ config, canvasScale }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'bar' }} canvasScale={canvasScale} />
    </Suspense>
  ),
  'chart-doughnut': ({ config, canvasScale }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'doughnut' }} canvasScale={canvasScale} />
    </Suspense>
  ),
  heading: ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <HeadingComponent config={config} />
    </Suspense>
  ),
  'chart-legend': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartLegendComponent config={config} />
    </Suspense>
  ),
  kpi: ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <KpiComponent config={config} />
    </Suspense>
  ),
};

// Component registry - maps catalog component IDs to renderers.
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<WidgetRendererProps>> =
  getRenderableComponentEntries().reduce((registry, component) => {
    if (!component.rendererType) {
      return registry;
    }

    const renderer = RENDERER_MAP[component.rendererType];
    if (renderer) {
      registry[component.id] = renderer;
    }

    return registry;
  }, {} as Record<string, React.ComponentType<WidgetRendererProps>>);

// Legacy alias for historical dashboards.
COMPONENT_REGISTRY.chart = RENDERER_MAP.chart;

// Check if a component type is registered
export function isComponentRegistered(componentType: string): boolean {
  return componentType in COMPONENT_REGISTRY;
}

// Get a component by type
export function getComponent(componentType: string): React.ComponentType<WidgetRendererProps> | null {
  return COMPONENT_REGISTRY[componentType] || null;
}
