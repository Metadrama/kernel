# Artboard-GridStack Space Mapping Strategy

## Problem Analysis

### Current Issue
Cards overflow slightly outside artboard bounds because:
1. Artboard dimensions: 1024×768px (example)
2. GridStack container has `p-4` padding (16px * 2 = 32px on each axis)
3. **Actual grid space: 992×736px** (1024-32 × 768-32)
4. But GridStack calculates columns based on full 1024px, not the 992px available

### The Mismatch
```
Artboard Dimensions (outer):     1024 ×  768 px
Grid Container Padding:           -32 ×  -32 px
------------------------
Actual GridStack Space:            992 ×  736 px
```

But `calculateArtboardGridConfig` uses:
```typescript
columns = Math.floor(widthPx / CELL_SIZE)  // Uses 1024, not 992!
maxRows = Math.ceil(heightPx / CELL_SIZE)  // Uses 768, not 736!
```

## Solution Strategy

### 1. Define Container Constants
```typescript
const ARTBOARD_PADDING = 16; // Tailwind p-4 = 16px
const PADDING_TOTAL = ARTBOARD_PADDING * 2; // Both sides
```

### 2. Calculate Effective Grid Space
```typescript
const effectiveWidth = artboard.dimensions.widthPx - PADDING_TOTAL;
const effectiveHeight = artboard.dimensions.heightPx - PADDING_TOTAL;
```

### 3. Update Grid Configuration
```typescript
const gridConfig = calculateArtboardGridConfig({
  ...artboard.dimensions,
  widthPx: effectiveWidth,
  heightPx: effectiveHeight
});

const maxRows = Math.ceil(effectiveHeight / gridConfig.cellHeight);
```

### 4. Ensure Consistency Across Codebase
- Update `calculateArtboardGridConfig` calls everywhere
- Or better: create `calculateEffectiveGridConfig` helper

## Implementation Plan

1. **Add constants** to artboard-utils.ts
2. **Create helper** `calculateEffectiveGridConfig(artboard, padding)`
3. **Update ArtboardContainer** to use effective dimensions
4. **Update useWidgetOperations** to use effective dimensions for bounds checking
5. **Verify** GridStack maxRow matches actual visible space

## Files to Update
- `lib/artboard-utils.ts` - Add helper
- `components/artboard/ArtboardContainer.tsx` - Use effective dimensions
- `hooks/useWidgetOperations.ts` - Use effective dimensions for duplicate/paste bounds
