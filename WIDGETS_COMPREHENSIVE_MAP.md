# Comprehensive Widgets & Inspector Schema Map

**Last Updated**: 2026-02-05  
**Purpose**: Complete mapping of widget components, schemas, inspector rendering, and inconsistencies.

---

##  Widget Inventory

| Widget Type | Component File | Schema Variable | Instance Count | Data Support | Rendering |
|-------------|---|---|---|---|---|
| `chart-line` | ChartComponent.tsx | LINE_CHART_SCHEMA | Multiple instances | Google Sheets, Static | Recharts Line |
| `chart-bar` | ChartComponent.tsx | BAR_CHART_SCHEMA | Multiple instances | Google Sheets, Static | Recharts BarChart |
| `chart-combo` | ChartComponent.tsx | COMBO_CHART_SCHEMA | Multiple instances | Google Sheets, Static | Recharts ComposedChart |
| `chart-doughnut` | ChartComponent.tsx | DOUGHNUT_CHART_SCHEMA | Multiple instances | Google Sheets, Static | Recharts PieChart |
| `chart-gauge` | GaugeChartComponent.tsx | GAUGE_SCHEMA | Single per artboard | Google Sheets, Static | Recharts RadialBarChart |
| `chart-legend` | ChartLegendComponent.tsx | CHART_LEGEND_SCHEMA | Multiple instances | Linked chart or Google Sheets | Custom flex legend |
| `text` | TextComponent.tsx | TEXT_SCHEMA | Multiple instances | Static, Optional data binding | Tailwind + CSS |
| `heading` | TextComponent.tsx | TEXT_SCHEMA (alias) | Multiple instances | Static (deprecated alias) | Tailwind + CSS |
| `kpi` | KpiComponent.tsx | KPI_SCHEMA | Multiple instances | Google Sheets, Static | Formatted value + trend |
| `image` | ImageComponent.tsx | IMAGE_SCHEMA | Multiple instances | Static URL | HTML img tag |
| `table` | TableComponent.tsx | TABLE_SCHEMA | Multiple instances | Google Sheets, Static | Custom table renderer |

---

##  Widget Details & Schema Breakdown

### 1. LINE CHART (`chart-line`)

**Files**: [ChartComponent.tsx](resources/js/modules/Widgets/components/ChartComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L160-L274)

**Component Props**:
```typescript
interface ChartComponentProps {
  config: ChartConfig;  // Union of LineChartConfig & other chart types
  isSelected?: boolean;
}
```

**Schema Fields** (from LINE_CHART_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | Custom field (DataSourceField.tsx renders) |
| `dataSource.labelColumn` | column-picker | undefined | Data | **SKIPPED in inspector** (not rendered) |
| `dataSource.valueColumn` | column-picker | undefined | Data | **SKIPPED in inspector** (not rendered) |
| `title` | text | undefined | Display | Chart title text |
| `showTitle` | boolean | false | Display | Show/hide title |
| `showLegend` | boolean | false | Display | Show/hide legend |
| `legendPosition` | select | 'bottom' | Display | Options: top, bottom, left, right |
| `showTooltip` | boolean | true | Display | Show/hide tooltips on hover |
| `tension` | range | 0.4 | Settings | Curve smoothing (0-1) |
| `lineWidth` | range | 3 | Settings | Line thickness (1-10) |
| `fill` | boolean | true | Settings | Fill area under line |
| `showPoints` | boolean | true | Settings | Show data point circles |
| `pointRadius` | range | 4 | Settings | Point size (0-10), conditional on showPoints |
| `colorPalette` | select | 'vibrant' | Display | Options: vibrant, pastel, cool, warm |
| `colors.primary` | color | '#3b82f6' | Display | Override primary line color |
| `colors.backgroundColor` | color | 'transparent' | Display | Background color |
| `xAxis.showGridLines` | boolean | false | Settings | X-axis grid visibility |
| `yAxis.showGridLines` | boolean | true | Settings | Y-axis grid visibility |
| `xAxis.label` | text | undefined | Settings | X-axis label text |
| `yAxis.label` | text | undefined | Settings | Y-axis label text |
| `yAxis.formatType` | select | 'number' | Settings | Options: number, currency, percent |
| `yAxis.currencyCode` | select | 'MYR' | Settings | Conditional on formatType='currency' |
| `aggregation` | select | 'sum' | Data | Options: sum, count, average, min, max, none |

**Rendering Issues**:
- ✅ Data source field renders correctly via DataSourceField
- ⚠️ Column-picker fields are intentionally skipped (designed as "no-op" in inspector)
- ✅ Conditional fields use `showWhen` logic (e.g., pointRadius only shows if showPoints=true)

**Component Behavior** (ChartComponent.tsx):
- Merges global + local data source (global provides connection, local provides mapping)
- Uses `useGoogleSheetsData` hook to fetch data from Google Sheets API
- Falls back to MOCK_CHART_DATA if dataSource.type === 'static'
- Renders via Recharts LineChart component with configured tension, lineWidth, fill, etc.

**Inconsistencies Detected**:
- None major; schema < → > component props alignment is good

---

### 2. BAR CHART (`chart-bar`)

**Files**: [ChartComponent.tsx](resources/js/modules/Widgets/components/ChartComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L276-L385)

**Schema Fields** (from BAR_CHART_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | Custom field |
| `dataSource.labelColumn` | column-picker | undefined | Data | **SKIPPED** |
| `dataSource.valueColumn` | column-picker | undefined | Data | **SKIPPED** |
| `title`, `showTitle`, `showLegend`, `legendPosition`, `showTooltip` | various | (see above) | Display | Same as line chart |
| `horizontal` | boolean | false | Settings | Bar orientation |
| `stacked` | boolean | false | Settings | Stack bars on top of each other |
| `borderRadius` | range | 4 | Settings | Corner radius (0-20) |
| `barRatio` | range | 0.6 | Settings | Width ratio (0.1-1) |
| `colorPalette`, `colors.*` | select, color | (see above) | Display | Same as line |
| `xAxis.*`, `yAxis.*` | various | (see above) | Settings | Same axis config |
| `aggregation` | select | 'sum' | Data | Sum/count/average/min/max/none |
| `sortBy` | select | 'none' | Data | Options: none, label, value |
| `sortOrder` | select | 'desc' | Data | asc/desc (conditional on sortBy != 'none') |
| `limit` | number | undefined | Data | Show top N items |

**Rendering**:
- ✅ All fields render in ComponentInspector
- ✅ Conditional visibility works (sortOrder only shows if sortBy != 'none')

**Inconsistencies**:
- None detected

---

### 3. COMBO CHART (`chart-combo`)

**Files**: [ChartComponent.tsx](resources/js/modules/Widgets/components/ChartComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L387-L480)

**Schema Fields** (from COMBO_CHART_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | Custom field |
| `dataSource.labelColumn` | column-picker | undefined | Data | **SKIPPED** |
| `barColumn` | column-picker | undefined | Data | **SKIPPED** |
| `lineColumn` | column-picker | undefined | Data | **SKIPPED** |
| `title`, `showTitle`, `showLegend`, etc. | various | (see above) | Display | |
| `barRatio` | range | 0.6 | Settings | |
| `lineTension` | range | 0.4 | Settings | |
| `showPoints` | boolean | true | Settings | |
| `colorPalette` | select | 'vibrant' | Display | |
| `barColor` | color | undefined | Display | Override (optional) |
| `lineColor` | color | undefined | Display | Override (optional) |
| `aggregation` | select | 'sum' | Data | |
| `sortBy`, `sortOrder`, `limit` | various | (see bar chart) | Data | |
| `leftAxis.*` | various | (see above) | Settings | X and left Y axis |
| `rightAxis.showGridLines` | boolean | false | Settings | Right Y axis grid |
| `rightAxis.label` | text | undefined | Settings | Right Y axis label |
| `rightAxis.formatType` | select | 'number' | Settings | Right axis number format |

**Inconsistencies**:
- Dual-axis (left/right Y) config is more complex than line/bar; documentation on which series uses which axis would help

---

### 4. DOUGHNUT CHART (`chart-doughnut`)

**Files**: [ChartComponent.tsx](resources/js/modules/Widgets/components/ChartComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L482-L591)

**Schema Fields** (from DOUGHNUT_CHART_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | |
| `dataSource.labelColumn`, `dataSource.valueColumn` | column-picker | undefined | Data | **SKIPPED** |
| `title`, `showTitle`, `showLegend`, `legendPosition`, `showTooltip` | various | (see above) | Display | |
| `colorPalette`, `colors.backgroundColor` | select, color | 'vibrant', 'transparent' | Display | |
| `aggregation` | select | 'sum' | Data | |
| `sortBy` | select | 'value' | Data | ⚠️ Default differs from bar (which is 'none') |
| `sortOrder` | select | 'desc' | Data | |
| `limit` | number | 5 | Data | Top N segments |
| `showOther` | boolean | true | Data | Combine remaining into "Other" segment |
| `showDataLabels` | boolean | false | Display | Show numeric labels on segments |
| `dataLabelPosition` | select | 'outside' | Display | inside/outside (conditional on showDataLabels) |
| `dataLabelType` | select | 'value' | Display | value/percent/label/all (conditional) |
| `innerRadius` | number | 0.6 | Settings | 0-0.95, controls doughnut hole size |
| `padAngle` | number | 0.7 | Settings | Padding between segments |
| `cornerRadius` | number | 3 | Settings | Segment corner radius |

**Inconsistencies**:
- ⚠️ **Default sortBy='value'** (vs 'none' for bar). This affects initial render!
- ⚠️ **Default limit=5** (vs no limit for bar). This may surprise users.
- ✅ dataLabelPosition/dataLabelType are properly conditional

---

### 5. GAUGE CHART (`chart-gauge`)

**Files**: [GaugeChartComponent.tsx](resources/js/modules/Widgets/components/GaugeChartComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L593-L620)

**Schema Fields** (from GAUGE_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | |
| `valueField` | column-picker | undefined | Data | **SKIPPED** |
| `min` | number | 0 | Data | Gauge minimum value |
| `max` | number | 100 | Data | Gauge maximum value |
| `title` | text | 'Gauge' | Display | |
| `colorPalette`, `colors.*` | select, color | 'vibrant' | Display | |

**Component Behavior**:
- Renders using Recharts RadialBarChart
- Aggregates data using 'sum' (hardcoded, not configurable)
- Uses colors.primary as track color

**Inconsistencies**:
- ⚠️ **Aggregation is hardcoded to 'sum'** in component, but schema doesn't expose it as a field
  - User cannot change aggregation behavior
  - This might be intentional (simple gauge), but should be documented

---

### 6. CHART LEGEND (`chart-legend`)

**Files**: [ChartLegendComponent.tsx](resources/js/modules/Widgets/components/ChartLegendComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L622-L651)

**Schema Fields** (from CHART_LEGEND_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `linkedChartId` | select | undefined | Data | Select chart to link to |
| `dataSource` | data-source | `{ type: 'static' }` | Data | Fallback if no linked chart |
| `dataSource.labelColumn` | column-picker | undefined | Data | **SKIPPED** |
| `title` | text | undefined | Display | Legend title |
| `colorPalette`, `colors.*` | select, color | 'vibrant' | Display | |

**Component Behavior**:
- `linkedChartId` options are **dynamically populated** in ComponentInspector.tsx
- If linked, uses that chart's config for data/colors
- Renders as flex-wrapped legend items with color swatches

**Inconsistencies**:
- ✅ Works well; dynamically finding charts in inspector is smart

---

### 7. TEXT (`text`) & HEADING (`heading`)

**Files**: [TextComponent.tsx](resources/js/modules/Widgets/components/TextComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L653-L672)

**Schema Fields** (from TEXT_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `text` | text | 'Text' | Display | The actual text content |
| `_typography` | **typography** | — | Typography | **Composite field, renders TypographyFields.tsx** |
| `color` | **color-fill** | — | Fill | **Composite field, renders with opacity** |

**TypographyFields** (special composite):
- Renders: FontPicker, FontWeight dropdown, LineHeight/LetterSpacing selects, Alignment toggles (H+V), Style toggles (B/I)
- **NOT individual schema fields** — it's one "super-field"
- Per-component handling in ConfigField.tsx

**Style Toggle Logic** (from TypographyFields.tsx):
- Bold is a visual toggle but maps to `fontWeight` (bold/semibold/extrabold)
- Italic maps to `fontStyle`
- Deselecting bold resets to 'normal' weight
- ⚠️ **This is a UI convenience that might cause unexpected value changes**

**Inspector Rendering**:
- Special case in ComponentInspector.tsx: `field.type === 'typography'` calls TypographyFields directly
- Fill group also special-cased: uses FillSection instead of generic ConfigField

**Actual Component Config Props** (from TextComponent.tsx):
```typescript
interface TextComponentConfig {
  text?: string;
  fontFamily?: FontFamily;
  fontSize?: FontSize;
  fontSizePx?: number;  // Override preset
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textDecoration?: TextDecoration;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  color?: string;
  lineHeight?: LineHeight;
  letterSpacing?: LetterSpacing;
  textTransform?: TextTransform;
  opacity?: number;
}
```

**Inconsistencies**:
- ⚠️ **Schema has `_typography` (composite) but component expects individual fields** (fontFamily, fontSize, etc.)
  - Inspector needs to map composite fields to individual config keys
  - This works because TypographyFields calls `onChange('fontFamily', v)`, etc., not the composite key
- ⚠️ **FontSize vs FontSizePx**: Schema has both presets (xs/sm/base) and custom px
  - Component uses `fontSizePx` to override preset
  - Dialog needs logic to detect custom vs preset
- ⚠️ **TextDecoration not in TypographyFields UI** (missing underline/strikethrough toggle)
  - Schema supports it, but inspector doesn't expose it
- ⚠️ **TextTransform not in TypographyFields UI** (missing uppercase/lowercase)
  - Schema supports it, but inspector doesn't expose it

---

### 8. KPI METRIC (`kpi`)

**Files**: [KpiComponent.tsx](resources/js/modules/Widgets/components/KpiComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L674-L738)

**Schema Fields** (from KPI_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | |
| `valueField` | column-picker | undefined | Data | **SKIPPED** |
| `title` | text | 'Metric' | Display | Metric name |
| `aggregation` | select | 'sum' | Data | sum/count/average/min/max |
| `formatType` | select | 'number' | Display | number/currency/percent |
| `currencyCode` | select | 'MYR' | Display | Conditional on formatType='currency' |
| `trendValue` | number | 0 | Display | Manual trend override |
| `trendType` | select | 'neutral' | Display | up/down/neutral |
| `colorPalette` | select | 'vibrant' | Display | |
| (colors.primary, etc.) | color | (from palette) | Display | |

**Component Behavior** (KpiComponent.tsx):
- Fetches data via `useGoogleSheetsData` hook
- Aggregates to a single value
- Shows trend icon (up/down/neutral) based on `trendType`
- Formats number based on `formatType` + `currencyCode`
- **Does NOT compute trend from data** — uses manual `trendValue`/`trendType`

**Inconsistencies**:
- ⚠️ **Schema has unused fields**: `showTrend`, `trendField`, `trendPeriod` in component-config.ts but NOT in KPI_SCHEMA
  - These look like planned features (computed trends) that aren't implemented
  - Schema suggests auto-trend but component only supports manual
- ⚠️ **Missing `prefix` and `suffix`**: component-config.ts defines them, but schema doesn't include them
  - Schema should expose these to allow "$" or "%" formatting

---

### 9. IMAGE (`image`)

**Files**: [ImageComponent.tsx](resources/js/modules/Widgets/components/ImageComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L740-L769)

**Schema Fields** (from IMAGE_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `src` | text | undefined | Display | Image URL |
| `alt` | text | undefined | Display | Alternative text |
| `objectFit` | select | 'contain' | Settings | contain/cover/fill/none |
| `borderRadius` | number | 0 | Settings | Integer (not range) |
| `opacity` | range | 100 | Settings | 0-100 |

**Component Behavior**:
- Shows ImageOff icon if no src
- Shows error state if image fails to load
- Applies objectFit + borderRadius + opacity directly to img element

**Inconsistencies**:
- ✅ Clean, no major issues

---

### 10. TABLE (`table`)

**Files**: [TableComponent.tsx](resources/js/modules/Widgets/components/TableComponent.tsx), [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts#L771-L784)

**Schema Fields** (from TABLE_SCHEMA):

| Field Key | Type | Default | Group | Notes |
|-----------|------|---------|-------|-------|
| `dataSource` | data-source | `{ type: 'static' }` | Data | |
| `columns` | multi-select | [] | Data | ⚠️ **Type mismatch: multi-select but config expects TableColumnConfig[]** |
| (showTitle, showHeader, showPagination, etc.) | boolean | — | Display | Options exist but **NOT in schema** |

**Component Behavior** (TableComponent.tsx):
- Config type is `TableConfig` which has:
  ```typescript
  interface TableConfig {
    dataSource: DataSource;
    columns: TableColumnConfig[];  // NOT a simple multi-select
    title?: string;
    showTitle?: boolean;
    showHeader?: boolean;
    striped?: boolean;
    bordered?: boolean;
    compact?: boolean;
    pageSize?: number;
    showPagination?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
  }
  ```
- But schema only defines `columns` as `multi-select`

**Inconsistencies**:
- 🔴 **MAJOR: Schema is incomplete**
  - Missing all display options (showTitle, showHeader, striped, bordered, etc.)
  - `columns` field type is wrong (`multi-select` vs complex TableColumnConfig)
  - Component supports much more than schema exposes
- 🔴 **Column Configuration Not Editable**
  - User cannot define columns from inspector
  - Defaults to auto-detected columns from data
  - Schema should expose per-column config (field, header, format, width, etc.)

---

## 🎯 Inspector Rendering Flow

### How Fields Appear in Inspector

**File**: [ComponentInspector.tsx](resources/js/modules/DataLayer/components/ComponentInspector.tsx)

**Process**:
1. Get schema via `getConfigSchema(componentType)` from [config-schemas.ts](resources/js/modules/DataLayer/types/config-schemas.ts)
2. Group fields by `field.group` (Data, Display, Typography, Fill, Settings)
3. Filter visible fields via `isFieldVisible()` logic:
   - Check `field.hidden`
   - Check `field.appliesTo` (component type constraint)
   - Check `showWhen` condition
4. Render each group as an Accordion section
5. For each field, call `ConfigField` component

**Special Cases**:

| Condition | Handler | File |
|-----------|---------|------|
| `field.type === 'data-source'` | DataSourceField | DataSourceField.tsx |
| `field.type === 'column-picker'` | Skip (return null) | ComponentInspector.tsx L272 |
| `field.type === 'typography'` | TypographyFields | TypographyFields.tsx |
| `field.type === 'color-fill'` | ColorInput | COnfigField.tsx |
| `groupId === 'Fill' && isTextComponent` | FillSection | FillSection.tsx |
| `linkedChartId` field | Dynamically populate options | ComponentInspector.tsx L264-277 |

### Field Type → UI Component Mapping

**File**: [ConfigField.tsx](resources/js/modules/DataLayer/components/ConfigField.tsx)

| Field Type | UI Component | Notes |
|-----------|---|---|
| `text` | Input[type=text] | |
| `number` | Input[type=number] | min/max/step respected |
| `boolean` | Switch (inline) | |
| `select` | SelectDropdown | Options from field.options |
| `range` | Slider + value display | min/max/step respected |
| `color` | Color picker + hex input | |
| `data-source` | DataSourceField | Custom component |
| `column-picker` | (skipped) | Not rendered |
| `typography` | TypographyFields | Composite field |
| `font-picker` | FontPicker | (not yet in ConfigField, only in TypographyFields) |
| `alignment-icons` | ToggleGroup | (in TypographyFields) |
| `style-toggles` | ToggleButtonGroup | B/I toggles (in TypographyFields) |
| `color-fill` | ColorInput | Color + opacity slider |
| `multi-select` | (not implemented) | Placeholder in schema |

---

## 🚨 Inconsistencies & Red Flags Summary

### 🔴 Critical Issues

1. **TABLE schema incomplete** (widget-schemas.ts)
   - Missing most display options
   - Column configuration not exposed to inspector
   - `columns` field type wrong (multi-select vs TableColumnConfig[])

2. **TEXT component schema has composite fields**
   - `_typography` and `color` are not real config keys
   - Inspector special-cases these, but confusing for future maintainers
   - Should either flatten to individual fields or document composite pattern

3. **KPI schema missing fields**:
   - `prefix`, `suffix` not in schema (but in component-config.ts)
   - `showTrend`, `trendField`, `trendPeriod` in component-config but not used in component

4. **GAUGE hardcodes aggregation**
   - Aggregation is 'sum' in component (line 94 of GaugeChartComponent.tsx)
   - No schema field to override
   - Should expose aggregation as optional field

### ⚠️ Moderate Issues

5. **DOUGHNUT has surprising defaults**
   - `sortBy: 'value'` (vs 'none' for bar) — affects initial render without user action
   - `limit: 5` — data is truncated by default, not obvious to users

6. **TEXT missing UI for some options**
   - `textDecoration` (underline/strikethrough) not in TypographyFields
   - `textTransform` (uppercase/lowercase) not in TypographyFields
   - Schema supports these, inspector doesn't expose them

7. **TEXT Bold toggle complexity**
   - Bold is a visual toggle that maps to fontWeight (bold/semibold/extrabold)
   - Deselecting bold resets to 'normal' — but what if user had 'semibold'?
   - Loss of state / unexpected behavior

8. **Column-picker fields exist but are skipped**
   - All chart schemas have `dataSource.labelColumn`, `dataSource.valueColumn`
   - These are "column mapping" UI that gets skipped in inspector
   - Should either render these fields or remove them from schema

9. **DataSourceField shows inheritance message**
   - Good UX, but the message says "Inheriting from Workspace Settings"
   - Should clarify: "Inheriting from Global Data Source" (more accurate)

### ✅ Good Patterns

- ✅ Conditional visibility (`showWhen`) works well across most schemas
- ✅ Special field types (data-source, typography) are well-handled in inspector
- ✅ Dynamic options (linkedChartId) are populated at render time
- ✅ Group organization (Data, Display, Settings) is sensible
- ✅ Data merging (global + local data source) is clever and useful

---

## 📝 Recommended Actions

### Priority 1: Fix Critical Schema Issues

- [ ] **TABLE_SCHEMA**: Add all missing display options + column configuration
  - Add `showTitle`, `showHeader`, `striped`, `bordered`, `compact`, `pageSize`, `showPagination`, `sortable`, `filterable`, `searchable`
  - Change `columns` field type or add a custom `column-config` renderer
  
- [ ] **KPI_SCHEMA**: Add missing fields from component-config.ts
  - Add `prefix`, `suffix`
  - Either implement trend computation or remove `showTrend`, `trendField`, `trendPeriod` from component-config.ts

- [ ] **GAUGE_SCHEMA**: Expose aggregation
  - Add `aggregation` field (select: sum/count/average/min/max)

### Priority 2: Improve Text Component

- [ ] **TEXT_SCHEMA**: Add missing fields to TypographyFields
  - Add visual toggle for `textDecoration` (underline/strikethrough)
  - Add select for `textTransform` (uppercase/lowercase/capitalize)
  
- [ ] **TEXT Bold logic**: Fix state loss
  - Consider storing both `isBold` (toggle state) and `fontWeight` (actual value)
  - Or make bold toggle sticky (e.g., semibold → bold, then bold again → semibold)

- [ ] **TEXT schema fields**: Clarify composite pattern
  - Document why `_typography` and `color` are special
  - Or rename them to start with `__` to indicate internal/composite

### Priority 3: Documentation

- [ ] Add JSDoc comments to each schema explaining expected component behavior
- [ ] Document the "column-picker is skipped" decision (intentional or legacy?)
- [ ] Document data source merging strategy in ChartComponent/KpiComponent/etc.
- [ ] Add examples showing expected defaults for each widget type

### Priority 4: Refactoring (Future)

- [ ] Consider extracting composite field handlers into schema-aware registry
  - Instead of special-casing in ConfigField.tsx, make it data-driven
  
- [ ] Consider auto-generating UI for TableColumnConfig instead of current approach
  - Custom renderer: `type: 'table-columns'`

---

## 📚 File Cross-Reference

### Schema Definitions
- [widget-schemas.ts](resources/js/modules/Widgets/types/widget-schemas.ts) — All widget schemas (LINE_CHART, TEXT, KPI, TABLE, IMAGE, GAUGE, CHART_LEGEND)
- [component-config.ts](resources/js/modules/DataLayer/types/component-config.ts) — Type definitions for all config types

### Inspector & Rendering
- [ComponentInspector.tsx](resources/js/modules/DataLayer/components/ComponentInspector.tsx) — Main inspector panel, special field cases
- [ConfigField.tsx](resources/js/modules/DataLayer/components/ConfigField.tsx) — Field-type → UI component mapping
- [TypographyFields.tsx](resources/js/modules/DataLayer/components/TypographyFields.tsx) — Text component typography panel
- [DataSourceField.tsx](resources/js/modules/DataLayer/components/DataSourceField.tsx) — Data source selector
- [config-schemas.ts](resources/js/modules/DataLayer/types/config-schemas.ts) — Schema registry + groups

### Components
- [ChartComponent.tsx](resources/js/modules/Widgets/components/ChartComponent.tsx) — Line, bar, combo, doughnut charts
- [TextComponent.tsx](resources/js/modules/Widgets/components/TextComponent.tsx) — Text/heading widget
- [KpiComponent.tsx](resources/js/modules/Widgets/components/KpiComponent.tsx) — KPI metric widget
- [TableComponent.tsx](resources/js/modules/Widgets/components/TableComponent.tsx) — Table widget
- [ImageComponent.tsx](resources/js/modules/Widgets/components/ImageComponent.tsx) — Image widget
- [GaugeChartComponent.tsx](resources/js/modules/Widgets/components/GaugeChartComponent.tsx) — Gauge chart widget
- [ChartLegendComponent.tsx](resources/js/modules/Widgets/components/ChartLegendComponent.tsx) — Legend widget

---

## 🎯 Key Takeaways

1. **Most widgets are well-structured**, with schemas matching component props
2. **TABLE is the most incomplete** — schema needs major expansion
3. **TEXT uses a composite field pattern** that works but should be documented
4. **Column-picker fields are intentionally skipped** — clarify intent (legacy? planned?)
5. **Some field options in component-config.ts aren't in schemas** (KPI trend computation, TEXT decorations)
6. **Default values sometimes surprise** (doughnut sortBy='value', limit=5)
7. **Inspector special-cases are well-implemented** but could be more data-driven
