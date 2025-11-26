// Widget Component Registry
// Maps component IDs to their React component implementations

import { lazy, Suspense } from 'react';

// Lazy load components for better performance
const ChartComponent = lazy(() => import('./ChartComponent'));
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
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<{config?: Record<string, unknown>}>> = {
  'chart': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent 
        chartType={(config?.chartType as 'line' | 'bar' | 'doughnut') || 'line'}
        title={config?.title as string}
      />
    </Suspense>
  ),
  'chart-line': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent chartType="line" title={config?.title as string || 'Revenue Trend'} />
    </Suspense>
  ),
  'chart-bar': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent chartType="bar" title={config?.title as string || 'Weekly Activity'} />
    </Suspense>
  ),
  'chart-doughnut': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <ChartComponent chartType="doughnut" title={config?.title as string || 'Device Distribution'} />
    </Suspense>
  ),
  'heading': ({ config }) => (
    <Suspense fallback={<ComponentLoader />}>
      <HeadingComponent 
        text={config?.text as string || 'Heading'}
        level={(config?.level as 1 | 2 | 3 | 4) || 2}
        align={(config?.align as 'left' | 'center' | 'right') || 'left'}
      />
    </Suspense>
  ),
};

// Check if a component type is registered
export function isComponentRegistered(componentType: string): boolean {
  return componentType in COMPONENT_REGISTRY;
}

// Get a component by type
export function getComponent(componentType: string): React.ComponentType<{config?: Record<string, unknown>}> | null {
  return COMPONENT_REGISTRY[componentType] || null;
}
