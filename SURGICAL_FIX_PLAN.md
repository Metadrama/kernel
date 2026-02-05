# Surgical Schema Fixes - Iterative Audit & Plan

**Strategy**: Multiple focused rounds. Audit deeply → Plan surgical fix → Execute → Verify → Move to next round.

**Goal**: Maximum UX impact with minimum risk.

---

## 🔬 ROUND 1: Column Picker Standardization

### Audit Finding
All 5+ chart types use DIFFERENT labels for the conceptually identical field (label column):

```
LINE:      "Label Column" → "Column for X-axis labels"
BAR:       "Category Column" → "Column for axis labels"
COMBO:     "X-Axis Column" → "Label / Date column"
DOUGHNUT:  "Category Column" → "Column for segment labels"
LEGEND:    "Label Column" → "Column for legend labels"
```

**User impact**: Confusion. Same mental concept, different UI wording per chart.

### Surgical Plan

**Option A: Normalize to one term + context descriptions**
```typescript
const LABEL_COLUMN_FIELD: ConfigFieldSchema = {
    key: 'dataSource.labelColumn',
    label: 'Label Column',
    type: 'column-picker',
    group: 'Data',
    description: '', // Chart-specific
};
```

Then customize per chart:
- LINE: `"Column for X-axis labels (dates, categories)"`
- BAR: `"Column for bar labels (categories, regions)"`  
- COMBO: `"Column for X-axis labels (dates)"`
- DOUGHNUT: `"Column for segment names"`
- LEGEND: `"Column for legend labels"`

**Option B: Use consistent abstract term + no description variance**
- ALL use: `"Label Column"` with generic description `"Column for group/category labels"`
- Users learn the term once, applies everywhere

### Decision Needed
Which approach? (A = flexible clarity, B = DRY principle)

---

## 🔬 ROUND 2: Tension Naming (tension vs lineTension)

### Audit Finding
```
LINE_CHART_SCHEMA:   key: 'tension',       label: 'Curve Smoothing'
COMBO_CHART_SCHEMA:  key: 'lineTension',   label: 'Line Curve'
```

Same field, **different keys** = breaking if user swaps templates or copies config.

### Surgical Plan

**Option A: Rename COMBO's lineTension → tension**
```typescript
// BEFORE:
{ key: 'lineTension', label: 'Line Curve', ... }

// AFTER:
{ key: 'tension', label: 'Line Curve', ... }
```

Pro: Consistent structure  
Con: Breaking change if anyone has saved config with `lineTension`

**Option B: Keep both, alias one to other in component logic**
```typescript
// Schema keeps both names
// Component reads: config.tension || config.lineTension
```

Pro: Backward compatible  
Con: Technical debt

### Decision Needed
Which approach? (A = clean but breaking, B = safe but messy)

---

## 🔬 ROUND 3: Boolean Field Descriptions (Missing Context)

### Audit Finding
These critical fields have **zero hints**:

```typescript
{ key: 'showPoints',     label: 'Show Points',     description: ??? }    // LINE
{ key: 'fill',           label: 'Fill Area',       description: ??? }    // LINE
{ key: 'stacked',        label: 'Stacked Bars',    description: ??? }    // BAR
{ key: 'horizontal',     label: 'Horizontal Bars', description: ??? }    // BAR
{ key: 'showGridLines',  label: 'X Grid Lines',    description: ??? }    // AXIS
```

User clicks icon, sees label, no idea what it does.

### Surgical Plan

**Add descriptions to all boolean/critical fields:**

```typescript
const BOOLEAN_FIELD_DESCRIPTIONS = {
    showPoints: 'Show dots at each data point on the line',
    fill: 'Fill the area under the line with color',
    stacked: 'Stack bars on top of each other instead of side-by-side',
    horizontal: 'Rotate bars 90° to display horizontally',
    showGridLines: 'Show vertical grid lines to aid reading',
    yAxisShowGridLines: 'Show horizontal grid lines to aid reading',
};
```

Then inject:
```typescript
{
    key: 'showPoints',
    label: 'Show Points',
    type: 'boolean',
    defaultValue: true,
    description: BOOLEAN_FIELD_DESCRIPTIONS.showPoints,
}
```

### Decision Needed
Use constant map or inline each? (map = DRY, inline = explicit)

---

## 🔬 ROUND 4: Type Consistency (range vs number)

### Audit Finding
Radius/padding fields use **inconsistent types** for similar concepts:

```
BAR:       borderRadius        → type: 'range'   (0-20)
IMAGE:     borderRadius        → type: 'number'  (0-100)
DOUGHNUT:  cornerRadius        → type: 'number'  (0-45)
DOUGHNUT:  innerRadius         → ALSO 'number'   (0-0.95)
DOUGHNUT:  padAngle            → type: 'number'  (0-45)
```

**Why inconsistent?**
- `range` = slider (better UX for bounded values)
- `number` = text input (better for unbounded)

All radius fields are **bounded**, so all should use `range`.

### Surgical Plan

**Phase 1: Audit existing implementations**
Which fields are actually used in COMPONENTS?
- Do components render `borderRadius` values? Where?
- What do they expect: 0-20? 0-100? 0-1?

**Phase 2: Standardize types**
```typescript
// Pattern 1: Space-based radius (pixels)
{
    key: 'borderRadius',
    label: 'Corner Radius',
    type: 'range',
    defaultValue: 4,
    min: 0, max: 20, step: 1,
    group: 'Settings',
}

// Pattern 2: Ratio-based radius (0-1)
{
    key: 'innerRadius',
    label: 'Inner Radius',
    type: 'range',
    defaultValue: 0.6,
    min: 0, max: 0.95, step: 0.05,
    group: 'Settings',
}
```

### Decision Needed
What are the actual rendering expectations? Need to check component implementations.

---

## 📊 ROUND 1-4 Impact Assessment

| Round | Affected Fields | User Pain | Effort | Breaking? |
|-------|-----------------|-----------|--------|-----------|
| **1** | 5 column pickers | High (confusion) | 20 min | No |
| **2** | tension field | Medium (edge cases) | 15 min | Maybe |
| **3** | 15+ booleans | Medium (UX confusion) | 20 min | No |
| **4** | 4-5 radius fields | Low (works anyway) | 30 min | Depends |

**Recommended execution order:**
1. **Round 1** (Column pickers) - FIRST, high impact, safe
2. **Round 3** (Descriptions) - SECOND, quick win, safe
3. **Round 2** (Tension naming) - THIRD, needs decision
4. **Round 4** (Type consistency) - LAST, needs component audit first

---

## 🎯 ROUND 1 DETAILED PLAN: Column Picker Standardization

### Step 1: Extract base field definition
```typescript
// Reusable template
const createLabelColumnField = (description: string): ConfigFieldSchema => ({
    key: 'dataSource.labelColumn',
    label: 'Label Column',
    type: 'column-picker',
    group: 'Data',
    description,
    showWhen: { field: 'dataSource.type', operator: 'not-equals', value: 'static' },
});

// Usage:
export const LINE_CHART_SCHEMA = {
    fields: [
        DATA_SOURCE_FIELD,
        createLabelColumnField('Column for X-axis labels (dates, ordered values, etc.)'),
        ...
    ]
};
```

### Step 2: Apply to all 5 chart types
- LINE
- BAR
- COMBO
- DOUGHNUT
- CHART_LEGEND

### Step 3: Verify nothing breaks
- `npm run types`
- Build
- Test inspector UI

### Step 4: Document pattern
- Comment in code explaining pattern
- Note in SCHEMA_AUDIT.md as "ROUND 1 COMPLETE"

---

## ✅ SUCCESS CRITERIA (Each Round)

After each round executes:
1. ✅ `npm run types` passes
2. ✅ `npm run build` succeeds
3. ✅ No broken imports
4. ✅ Schema changes only (no component logic changes)
5. ✅ Inspector UI still renders (manual visual check recommended)

---

## 📝 NEXT: Request Approval

Before proceeding, user should confirm:

- **Round 1 approach**: Option A (flexible descriptions) or Option B (DRY)?
- **Round 2 approach**: Option A (breaking rename) or Option B (aliasing)?
- **Round 3 approach**: Constant map or inline descriptions?
- **Round 4 **: Should we audit components first?

**OR**: Just say "go with sensible defaults" and I'll pick the best option.

---

## Timeline Estimate

- **Round 1**: 20 min (implement + test)
- **Round 3**: 20 min (implement + test)
- **Round 2**: 15 min (implement + test)
- **Round 4**: 30 min (audit components + implement + test)

**Total**: ~85 min for all surgical fixes, with verification between rounds.
