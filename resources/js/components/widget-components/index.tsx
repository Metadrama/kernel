// Widget Component Registry
// Maps component IDs to their React component implementations

import { lazy, Suspense } from 'react';

// Lazy load components for better performance
const ChartComponent = lazy(() => import('./ChartComponent'));
const ChartLegendComponent = lazy(() => import('./ChartLegendComponent'));
const HeadingComponent = lazy(() => import('./HeadingComponent'));

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

// Component registry - maps component type IDs to renderers
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<{ config?: Record<string, unknown> }>> = {
  'chart': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: (config?.chartType as any) || 'line' } as any} />
    </Suspense>
  ),
  'chart-line': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'line' } as any} />
    </Suspense>
  ),
  'chart-bar': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'bar' } as any} />
    </Suspense>
  ),
  'chart-doughnut': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'doughnut' } as any} />
    </Suspense>
  ),
  'chart-combo': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent config={{ ...config, chartType: 'combo' } as any} />
    </Suspense>
  ),
  'heading': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <HeadingComponent config={config} />
    </Suspense>
  ),
  'chart-legend': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartLegendComponent config={config} />
    </Suspense>
  ),
};

// Check if a component type is registered
export function isComponentRegistered(componentType: string): boolean {
  return componentType in COMPONENT_REGISTRY;
}

// Get a component by type
export function getComponent(componentType: string): React.ComponentType<{ config?: Record<string, unknown> }> | null {
  return COMPONENT_REGISTRY[componentType] || null;
}
