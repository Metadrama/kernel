import { describe, expect, it } from 'vitest';

import { COMPONENT_CATALOG, getRenderableComponentEntries, validateComponentCatalog } from '@/constants/component-catalog';
import { COMPONENT_REGISTRY, isComponentRegistered } from '@/components/widget-components';
import { getConfigSchema } from '@/types/config-schemas';

function hasPositiveSize(value: { width: number; height: number }): boolean {
  return value.width > 0 && value.height > 0;
}

describe('component catalog contract', () => {
  it('has a valid catalog shape', () => {
    const result = validateComponentCatalog();

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('ensures each entry has valid size constraints', () => {
    for (const entry of COMPONENT_CATALOG) {
      expect(hasPositiveSize(entry.defaultSize)).toBe(true);
      expect(hasPositiveSize(entry.minSize)).toBe(true);

      if (entry.maxSize) {
        expect(entry.maxSize.width).toBeGreaterThanOrEqual(entry.minSize.width);
        expect(entry.maxSize.height).toBeGreaterThanOrEqual(entry.minSize.height);
      }

      expect(entry.defaultSize.width).toBeGreaterThanOrEqual(entry.minSize.width);
      expect(entry.defaultSize.height).toBeGreaterThanOrEqual(entry.minSize.height);
    }
  });

  it('registers every renderable catalog component', () => {
    const renderable = getRenderableComponentEntries();

    for (const entry of renderable) {
      expect(isComponentRegistered(entry.id)).toBe(true);
      expect(COMPONENT_REGISTRY[entry.id]).toBeTypeOf('function');
    }
  });

  it('resolves schemas for configurable components', () => {
    for (const entry of COMPONENT_CATALOG) {
      if (!entry.supportsConfiguration) {
        continue;
      }

      const schema = getConfigSchema(entry.id);
      expect(schema).toBeDefined();
      expect(schema?.componentType).toBe(entry.configSchemaType || entry.id);
    }
  });
});
