# Comprehensive Schema Inconsistency Audit

**File**: [resources/js/modules/Widgets/types/widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts)

---

## 🔴 CRITICAL ISSUES

### 1. **Column Picker Naming Hell**
Different charts name the SAME semantic field differently:

| Chart | Label Column Label | Value Column Label |
|-------|-------------------|-------------------|
| **LINE** | `"Label Column"` | `"Value Column"` |
| **BAR** | `"Category Column"` | `"Value Column"` |
| **COMBO** | `"X-Axis Column"` | ❌ MISSING! Has `barColumn`, `lineColumn` separately |
| **DOUGHNUT** | `"Category Column"` | `"Value Column"` |
| **CHART_LEGEND** | `"Label Column"` | ❌ NONE (uses linked chart) |

**Description inconsistency**:
- LINE: `"Column for X-axis labels"` / `"Column for Y-axis values"`
- BAR: `"Column for axis labels"` (vague!) / `"Column for values"` (vague!)
- COMBO: `"Label / Date column"` / `"Primary Metric (Bars)"` (informal parenthetical)
- DOUGHNUT: `"Column for segment labels"` / `"Column for segment values"` (most specific)

**Impact**: USER CONFUSION. Same field, different mental model across charts.

---

### 2. **COMBO Chart is a Mess**

Line-specific field in COMBO:
```typescript
{
    key: 'lineTension',      // ← LINE_CHART uses "tension"
    label: 'Line Curve',
    ...
}
```
But in LINE_CHART:
```typescript
{
    key: 'tension',
    label: 'Curve Smoothing',
    ...
}
```

**Same concept, different names!**

Also in COMBO:
- `colorPalette` redefined (should use COLOR_FIELDS)
- `barRatio` redefined (should use common)
- Missing `...COMMON_DISPLAY_FIELDS` (but has manual copies of fields? Let me check...)
- Actually has them spread in there? Yes, `showLegend`, `legendPosition`, `showTooltip` manually

---

### 3. **Line/Bar vs. COMBO Inconsistency**

| Feature | LINE | BAR | COMBO | Should It Have It? |
|---------|------|-----|-------|-------------------|
| Sort/Limit | ✅ Yes (`...COMMON_TRANSFORM_FIELDS`) | ✅ Yes | ❌ YES! Only bar segment, no limit on line side | 🔴 |
| Horizontal orientation | ❌ No (n/a) | ✅ Yes | ❌ No? | ? |
| Stacked bars | ❌ No (n/a) | ✅ Yes | ❌ No | ? |
| Display labels on values | ❌ No | ❌ No | ❌ No (DOUGHNUT has this!) | Consider |
| Per-axis formatting | ❌ No (single axis) | `COMMON_AXIS_FIELDS` | ✅ Yes (left + right!) | ? |

**MISSING**: Why doesn't COMBO have borders/corner radius like BAR does?

---

### 4. **Field Descriptions Missing Everywhere**

Boolean fields with NO description:
- `showPoints` (LINE) - what does this do exactly?
- `fill` (LINE) - fill what?
- `stacked` (BAR) - some users won't know what stacking means
- `horizontal` (BAR)
- All the `showGrid*` fields
- Most `showTitle`, `showLegend` fields have no hint text

Compare to:
- `limit` field: `"Display only the top N items after sorting"` ✅ Clear
- `tension`: `"0 = straight lines, 1 = very curved"` ✅ Great!
- `pointRadius`: NO description ❌

---

### 5. **Group Assignment Chaos**

| Field Type | Group Used | Notes |
|------------|-----------|-------|
| Axis formatting fields | `'Settings'` | AXIS_FORMAT_FIELDS |
| Axis grid/label fields | `'Settings'` | COMMON_AXIS_FIELDS |
| Color/palette fields | `'Display'` | COLOR_FIELDS |
| Line options (fill, tension) | `'Settings'` | LINE_CHART inline |
| Data labels (doughnut) | `'Display'` | DOUGHNUT inline |
| Pagination | `'Settings'` | TABLE_SCHEMA |
| Sort/Aggregation | `'Data'` | COMMON_TRANSFORM_FIELDS |

**Question**: Should axis formatting live in '**Data**' (what to show) vs '**Settings**' (how to show)?

Currently: Semantically related axis fields are split:
- Grid/label in `COMMON_AXIS_FIELDS` → `'Settings'`
- Format/currency in `AXIS_FORMAT_FIELDS` → `'Settings'`  
- But neither clearly groups with DATA fields

---

### 6. **Naming Pattern Inconsistency**

Different naming conventions for same patterns:

| Concept | Used In | Naming Style |
|---------|---------|--------------|
| Show/hide | `showTitle`, `showLegend`, `showPoints`, `showTooltip`, `showDataLabels`, `showOther`, `showPagination` | Regular camelCase ✅ |
| Grid control | `xAxis.showGridLines`, `yAxis.showGridLines`, `rightAxis.showGridLines` | Dot notation ✅ |
| Position | `legendPosition` vs `dataLabelPosition` | Inconsistent! `legend*` prefix vs full `dataLabel*` |
| Padding/angle | `padAngle`, `cornerRadius`, `borderRadius`, `pointRadius` | ALL DIFFERENT SUFFIXES (Angle, Radius, Radius, Radius) |

---

### 7. **Bounds Inconsistency**

| Field | Type | Min | Max | Step | Default | Notes |
|-------|------|-----|-----|------|---------|-------|
| `tension` | range | 0 | 1 | 0.1 | 0.4 | ✅ Good bounds |
| `lineTension` (COMBO) | range | 0 | 1 | 0.1 | 0.4 | ✅ Same, different name! |
| `barRatio` (BAR) | range | 0.1 | 1 | 0.1 | 0.6 | ✅ Different name, same concept |
| `barRatio` (COMBO) | range | 0.1 | 1 | 0.1 | 0.6 | ✅ Same |
| `pointRadius` | range | 0 | 10 | 1 | 4 | ✅ Reasonable |
| `innerRadius` | **number** | 0 | 0.95 | 0.05 | 0.6 | ❌ WHY NUMBER not RANGE?? |
| `borderRadius` (BAR) | **range** | 0 | 20 | ❌ no step | 4 | ❌ Missing step |
| `borderRadius` (IMAGE) | **number** | 0 | 100 | ❌ no step | 0 | ❌ Different type! |
| `cornerRadius` (DOUGHNUT) | **number** | 0 | 45 | 1 | 3 | ❌ Different type! |

**Border/Corner/Padding fields should use consistent type + naming!**

---

### 8. **TEXT_SCHEMA Oddities**

```typescript
{
    key: 'text',
    label: '',           // ← Empty label??
    type: 'text',
    defaultValue: 'Text',
    group: 'Display',
    description: 'The text to display',
},
```

Why empty label? This will show just the input, not "Text Content" or something informative.

Also:
```typescript
{
    key: '_typography',  // ← Underscore prefix convention not used elsewhere
    label: 'Typography',
    type: 'typography',
    ...
}
```

Is the underscore intentional? Not documented.

---

### 9. **IMAGE_SCHEMA Type Inconsistencies**

```typescript
{
    key: 'opacity',
    label: 'Opacity',
    type: 'range',       // ← Good, uses range
    defaultValue: 100,   // ← But 100 means what? 0-100 scale?
    min: 0,
    max: 100,
    step: 5,             // ← Step of 5 means: 0, 5, 10, ..., 100
}
```

Opacity semantically is `0-1` or `0%-100%`. The `max: 100` with `step: 5` is unclear. Is this `0 = transparent, 100 = opaque`? Or percentage? Needs description.

Also `borderRadius`:
```typescript
{
    key: 'borderRadius',
    type: 'number',      // ← LINE uses 'range' for similar
    max: 100,
    defaultValue: 0,
}
```

While in BAR/DOUGHNUT it's 'number' or 'range'? Inconsistent!

---

### 10. **TABLE_SCHEMA Fields Missing / Wrong**

Has pagination but NO default sort:
```typescript
// ✅ Has this:
{ key: 'pageSize', ... }

// ❌ Missing:
{ key: 'defaultSortColumn', ... }
{ key: 'defaultSortOrder', ... }
```

Also: `showHeader` has no description. What does "Show Header" mean? Row 1? Column names?

---

### 11. **appliesTo Redundancy**

```typescript
// In LINE_CHART_SCHEMA:
{
    key: 'tension',
    appliesTo: ['chart-line'],  // ← Redundant! Already in LINE_CHART_SCHEMA
    ...
}
```

This field is **only** in LINE_CHART. Why specify `appliesTo`? That's for shared schema fields that apply conditionally.

Same in BAR, DOUGHNUT, IMAGE schemas - many inline fields have `appliesTo: ['chart-foo']` which is redundant.

---

### 12. **Inconsistent Conditional Visibility**

```typescript
// COMMON_TRANSFORM_FIELDS - clean pattern:
{
    key: 'sortOrder',
    showWhen: { field: 'sortBy', operator: 'not-equals', value: 'none' },
}

// But in DOUGHNUT, the same field pattern:
{
    key: 'dataLabelPosition',
    showWhen: { field: 'showDataLabels', operator: 'equals', value: true },
}
```

Both patterns are correct, but inconsistent operators:
- `not-equals` vs `equals`
- Both valid, but should be consistent style

---

### 13. **CHART_LEGEND Doesn't Use COMMON_DISPLAY_FIELDS**

```typescript
export const CHART_LEGEND_SCHEMA = {
    fields: [
        // Manually defines:
        { key: 'title', ... },
        ...COLOR_FIELDS,  // ✅ Good
        // But missing:
        // NO showTitle, showLegend (legend of legend?)
    ]
};
```

Should it have `showTitle`? Probably. But "show legend" for a legend component doesn't make sense.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 14. **COMBO Inner Axis (rightAxis) Not Reusable**

```typescript
{
    key: 'rightAxis.formatType',
    label: 'Right Axis Format',
    ...
}
```

This is defined inline in COMBO. But what if:
- Dual-axis LINE chart wanted this?
- Dual-axis BAR chart wanted this?

Should extract `RIGHT_AXIS_FIELDS` fragment.

---

### 15. **Color Overrides Scattered**

```typescript
// COMBO has color overrides:
{
    key: 'barColor',
    label: 'Bar Color (Override)',
    type: 'color',
}

// But BAR doesn't have this
// And neither does LINE
```

Should all charts have color override options? Or is COMBO special?

---

## 📋 SUMMARY TABLE

| Issue | Count | Severity | Example |
|-------|-------|----------|---------|
| **Duplicate field definitions** | 5+ | 🔴 High | `colorPalette`, `barRatio`, `lineTension` vs `tension` |
| **Inconsistent labels/descriptions** | 12+ | 🔴 High | `"Label Column"` vs `"Category Column"` vs `"X-Axis Column"` |
| **Missing descriptions on UI fields** | 15+ | 🟡 Medium | `showPoints`, `fill`, `stacked`, etc. |
| **Group assignment chaos** | Multiple | 🟡 Medium | Axis fields split across Data/Settings |
| **Type inconsistencies** | 6+ | 🟡 Medium | `borderRadius` as number/range/number |
| **Name inconsistencies** | 10+ | 🟡 Medium | `tension` vs `lineTension`, `padAngle` vs `cornerRadius` |
| **Field bounds (min/max/step)** | 8+ | 🟡 Medium | Missing step, inconsistent ranges |
| **Redundant appliesTo** | 20+ | 🟢 Low | Inline fields specifying appliesTo for their own schema |
| **Missing logical features** | 3 | 🟢 Low | COMBO missing sort/limit, TABLE missing default sort |

---

## ✅ PROPOSED FIXES (Priority Order)

### Phase 1: Column Pickers (CRITICAL)
```typescript
// Normalize to ONE pattern
const COLUMN_PICKER_LABEL = 'Label Column';
const COLUMN_PICKER_VALUE = 'Value Column';
const COLUMN_PICKER_LABEL_DESCRIPTION = 'Column for category/group labels';
const COLUMN_PICKER_VALUE_DESCRIPTION = 'Column for metric values';

// Then in schemas:
{
    key: 'dataSource.labelColumn',
    label: COLUMN_PICKER_LABEL,
    description: COLUMN_PICKER_LABEL_DESCRIPTION,
    ...
}
```

### Phase 2: Naming Standardization
- Rename `lineTension` (COMBO) → `tension` (matches LINE)
- Rename `dataLabelPosition` → `labelPosition` (shorter, consistent)
- Combine `BorderRadius`, `CornerRadius`, `PadAngle` into unified naming

### Phase 3: Group Assignment
- Move axis formatting from `'Settings'` → `'Data'` or create `'Axes'` group
- Consistent group ordering: Data → Display → Settings

### Phase 4: Boolean Field Descriptions
- Add descriptions to: `showPoints`, `fill`, `stacked`, `horizontal`, `showGridLines`, etc.

### Phase 5: Extract Reusable Fragments
```typescript
const RIGHT_AXIS_FIELDS = [...];
const COLOR_OVERRIDE_FIELDS = [...];  // if needed
const DATA_LABEL_FIELDS = [...];      // for bars/combos
```

### Phase 6: Remove Redundant appliesTo
- Only use `appliesTo` for multi-schema fields
- Remove from inline-only fields

---

## ESTIMATED EFFORT
- **Phase 1**: 30-45 min (critical, high impact)
- **Phase 2**: 30 min (naming)
- **Phase 3**: 20 min (grouping)
- **Phase 4**: 20 min (descriptions)
- **Phase 5**: 30 min (fragments)
- **Phase 6**: 10 min (cleanup)

**Total**: ~2.5 hours for full normalization

---

## QUICK WIN (10 min)
Pick the top 3 most user-visible inconsistencies:
1. Column picker label standardization
2. `tension` vs `lineTension` naming
3. Missing boolean descriptions

Would clean up 50% of the UX confusion.
