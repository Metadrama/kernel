# Widget-Level Adaptivity Explained

## Definition

**Widget-level adaptivity** means that widgets (cards) automatically adjust their **size, position, and behavior** based on the **artboard they're placed on**, rather than using fixed, absolute values.

Think of it like responsive web design, but for dashboard widgets across different artboard formats.

---

## The Concept: Grid-Level vs Widget-Level

### Grid-Level Adaptivity ✅ (We Have This)
The **container** adapts to artboard size:

```
Small Artboard (A4):        Large Artboard (4K):
1024px wide                 3840px wide
↓                          ↓
124 columns                 478 columns
68 rows                     268 rows
```

The grid system calculates different column/row counts for different artboards.

### Widget-Level Adaptivity ❌ (We Need This)
Individual **widgets** adapt to the artboard they're on:

```
Same Widget on Different Artboards:

Small Artboard:            Large Artboard:
┌─────────┐               ┌────────────────┐
│ Widget  │               │    Widget      │
│ 30 cols │  Adaptive →   │    50 cols     │
│ 20 rows │               │    30 rows     │
└─────────┘               └────────────────┘
```

The widget itself resizes proportionally to fit the artboard better.

---

## Current Behavior (Not Adaptive)

### Example: Duplicating a Card

**On Slide (1024×768px):**
```typescript
Original: { x: 10, y: 10, w: 30, h: 20 }
Duplicate: { x: 12, y: 12, w: 30, h: 20 }  // ❌ Same size
```

**On 4K Display (3840×2160px):**
```typescript
Original: { x: 10, y: 10, w: 30, h: 20 }
Duplicate: { x: 12, y: 12, w: 30, h: 20 }  // ❌ Still same size!
```

**Problem**: 30 columns on a Slide artboard (~24% width) vs 30 columns on 4K (~6% width)
- Same numbers, completely different visual sizes
- Widget looks tiny on 4K artboard

---

## What Widget-Level Adaptivity Should Do

### 1. Proportional Sizing

Instead of copying absolute grid units, calculate proportional dimensions:

```typescript
// ❌ Current (Non-Adaptive)
const newWidget = {
  w: originalWidget.w,  // 30 units everywhere
  h: originalWidget.h,  // 20 units everywhere
};

// ✅ Adaptive
const newWidget = {
  // If original was 25% of artboard width, new one should be too
  w: Math.floor(artboard.columns * 0.25),
  h: Math.floor(artboard.rows * 0.15),
};
```

**Result**: Widget maintains same visual proportion across artboards

### 2. Proportional Offsets

Offset should scale with artboard size:

```typescript
// ❌ Current (Non-Adaptive)
const offset = 2;  // Always 2 grid units

// ✅ Adaptive
const offset = Math.max(2, Math.floor(artboard.columns * 0.02));
// Small artboard: 2 units
// Large artboard: 9 units (proportional)
```

**Result**: Duplicate appears at similar relative distance on any artboard

### 3. Fill/Fit Options

Widgets should have modes for different artboard contexts:

```typescript
interface DuplicateOptions {
  fillMode?: 'fit' | 'fill' | 'preserve';
}

// 'fit': Size to ~80% of artboard (with margins)
// 'fill': Size to 100% of artboard (full coverage)  
// 'preserve': Keep original size (current behavior)
```

**Result**: User can choose how widget adapts to artboard

---

## Real-World Example

Imagine you have:
- **Artboard A**: Slide format (1024×768px) → 124 columns
- **Artboard B**: 4K Display (3840×2160px) → 478 columns

### Current Behavior (Non-Adaptive)

**Create widget on Artboard A:**
```typescript
widget = { x: 0, y: 0, w: 30, h: 20 }
// Visually: 24% of artboard width
```

**Copy widget to Artboard B:**
```typescript
pastedWidget = { x: 0, y: 0, w: 30, h: 20 }
// Visually: 6% of artboard width ❌ Looks tiny!
```

### With Widget-Level Adaptivity

**Create widget on Artboard A:**
```typescript
widget = { x: 0, y: 0, w: 30, h: 20 }
// Visually: 24% of artboard width
// Store: relativeWidth = 0.24
```

**Paste widget to Artboard B (Adaptive):**
```typescript
// Calculate based on proportion
const adaptiveW = Math.floor(478 * 0.24);  // 115 units
const adaptiveH = Math.floor(268 * 0.15);  // 40 units

pastedWidget = { x: 0, y: 0, w: 115, h: 40 }
// Visually: Still ~24% of artboard width ✅ Looks right!
```

---

## Component-Level Example

Even more granular - components WITHIN widgets should adapt:

### Current (Fixed Positioning)
```typescript
// Component on Slide artboard
component = {
  x: 10,     // 10px from left
  y: 10,     // 10px from top
  width: 200,  // 200px wide
  height: 150  // 150px tall
}

// Same component on 4K artboard
// Still 10px, 200px - looks tiny! ❌
```

### With Adaptivity (Proportional)
```typescript
// Component calculates based on widget size
const widgetWidth = widget.w * CELL_SIZE;

component = {
  x: widgetWidth * 0.05,      // 5% from left
  y: widgetWidth * 0.05,      // 5% from top  
  width: widgetWidth * 0.80,  // 80% of widget width
  height: widgetWidth * 0.60  // 60% of widget width
}

// Scales with widget size ✅
```

---

## Benefits of Widget-Level Adaptivity

### 1. **Visual Consistency**
- Widget looks proportionally similar across artboard sizes
- 25% width stays 25% width, not absolute 30 units

### 2. **Better UX**
- "Fill artboard" makes widget cover entire space
- "Duplicate" creates visually similar copy, not tiny copy

### 3. **Cross-Format Workflow**
- Copy widget from Slide to 4K and it looks good
- Move widget between artboards seamlessly

### 4. **Smart Defaults**
- New widgets on small artboard: reasonable size
- New widgets on huge artboard: still reasonable size

---

## Implementation Hierarchy

### Level 1: Grid Adaptivity ✅ DONE
```
Artboard → Grid Configuration
(Different formats get different column/row counts)
```

### Level 2: Widget Adaptivity ❌ NEEDED
```
Artboard → Widget Size/Position
(Widgets scale to artboard proportions)
```

### Level 3: Component Adaptivity ⚠️ PARTIAL
```
Widget → Component Size/Position
(Components scale within widget bounds)
```

---

## Summary

**Widget-level adaptivity** means:

| Aspect | Non-Adaptive (Current) | Adaptive (Needed) |
|--------|----------------------|-------------------|
| **Size** | Fixed grid units (30×20) | Proportional (25% × 15%) |
| **Position** | Fixed offset (+2, +2) | Proportional (+2%, +2%) |
| **Fill** | Not possible | "Fill artboard" option |
| **Cross-artboard** | Looks wrong on different sizes | Looks good everywhere |

**The Goal**: Widgets should "feel" the same size regardless of which artboard format they're on, just like how responsive websites adapt to different screen sizes while maintaining visual hierarchy.
