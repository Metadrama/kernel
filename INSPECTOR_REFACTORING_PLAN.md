# Inspector Architecture Refactoring - Mitigation Plan

**Status**: Proposed  
**Date**: 2026-02-05  
**Priority**: High (Critical Structure Flaw)

---

## 🔴 Current Architecture Problem

The inspector is fragmented across **5+ files** with unclear responsibilities:

### Current Flow (Chaotic)
```
ComponentInspector.tsx (main orchestrator)
├── Special-cased: Fill handling (FillSection.tsx)
├── Special-cased: Text/Heading detection
├── Special-cased: linkedChartId dynamic options
├── Maps field.type === 'data-source' → DataSourceField.tsx
├── Maps field.type === 'column-picker' → skipped with comment
├── ConfigField.tsx (generic dispatcher)
│   ├── Maps field.type === 'typography' → TypographyFields.tsx
│   ├── Maps field.type === 'color-fill' → ColorInput (inline)
│   ├── Maps field.type === 'table-columns' → TableColumnsField.tsx
│   └── Maps others → Input/Select/Slider (inline)
├── DataSourceField.tsx
│   └── Calls DataSourceConfig (imported but NOT called from main!)
└── TypographyFields.tsx
└── FillSection.tsx
```

### Problems
1. **Scattered Logic**: Field type handling is split between ComponentInspector → ConfigField → specialized files
2. **Hard-coded Conditionals**: `if (groupId === 'Fill' && isTextComponent)` breaks if rules change
3. **Orphaned Renderers**: DataSourceConfig is imported in DataSourceField but never wired to main flow
4. **No Clear Contracts**: Unclear what each file's responsibility is
5. **Testing Nightmare**: Can't test field rendering in isolation; must test full component flow
6. **Maintenance Risk**: Adding new field types requires changes in multiple places

---

## ✅ Proposed Solution: Centralized Field Renderer

**Core Principle**: One file handles all field type dispatch. Specialized renderers are "dumb" UI components.

### New Architecture (Clean)
```
FieldRenderer.tsx (NEW - single source of truth)
├── Maps all field.type → handler
├── Knows about all field types
├── Orchestrates complex fields (data-source, typography, etc.)
├── Returns JSX
└── Location: resources/js/modules/DataLayer/components/FieldRenderer.tsx

ComponentInspector.tsx (simplified)
├── Groups fields by section
├── Renders accordion structure
├── Delegatesall field rendering to FieldRenderer
└── NO special-casing, NO field.type conditionals

Specialized Renderers (dumb UI only)
├── TypographyFields.tsx - renders typography UI (no logic change needed)
├── FillSection.tsx - renders fill UI (no logic change needed)
├── TableColumnsField.tsx - renders table columns UI (no logic change needed)
├── DataSourceConfig.tsx - renders datasource UI (already exists, will be used)
└── ConfigField sub-renderers (text, number, select, color, etc.)
```

---

## 📋 Implementation Steps

### Step 1: Create FieldRenderer.tsx (Centralized Dispatcher)

```typescript
// FILE: resources/js/modules/DataLayer/components/FieldRenderer.tsx

interface FieldRendererProps {
  field: ConfigFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  config: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
  globalDataSource: DataSource | null;
  disabled?: boolean;
}

export function FieldRenderer(props: FieldRendererProps) {
  const { field, value, onChange, config, onConfigChange, globalDataSource, disabled } = props;

  // CENTRALIZED MAPPING - ALL field types render here
  switch (field.type) {
    case 'text':
      return <TextFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'number':
      return <NumberFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'boolean':
      return <BooleanFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'select':
      return <SelectFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'color':
      return <ColorFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'range':
      return <RangeFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'data-source':
      return <DataSourceFieldRenderer
        field={field}
        localConfig={(config.dataSource as DataSource) || {}}
        onChange={(updates) => onChange({ ...config.dataSource, ...updates })}
        globalDataSource={globalDataSource}
        disabled={disabled}
      />;
    case 'typography':
      return <TypographyFieldRenderer config={config} onChange={onConfigChange} disabled={disabled} />;
    case 'color-fill':
      return <ColorFillFieldRenderer config={config} onChange={onConfigChange} disabled={disabled} />;
    case 'table-columns':
      return <TableColumnsFieldRenderer columns={Array.isArray(value) ? value : []} onChange={onChange} />;
    case 'column-picker':
      // Handle column picker UI
      return <ColumnPickerFieldRenderer field={field} value={value} onChange={onChange} />;
    default:
      return <UnsupportedFieldRenderer field={field} />;
  }
}
```

### Step 2: Refactor ComponentInspector.tsx

**Remove**:
- All `field.type === 'data-source'` conditionals
- All `field.type === 'column-picker'` skip logic
- All special-case `if (isTextComponent && groupId === 'Fill')` blocks
- All inline field rendering

**Keep**:
- Accordion grouping logic
- Position/title sections
- Single call to FieldRenderer

```typescript
// BEFORE (lines 200+):
if (field.type === 'data-source') {
  return <DataSourceField ... />
}
if (field.type === 'column-picker') {
  return null;  // Skip
}
return <ConfigField ... />

// AFTER:
return <FieldRenderer
  field={field}
  value={getNestedValue(config, field.key)}
  onChange={(value) => handleFieldChange(field.key, value)}
  config={config}
  onConfigChange={handleFieldChange}
  globalDataSource={dataSourceConfig}
/>
```

### Step 3: Move Sub-renderers into FieldRenderer or FieldRenderer.tsx file

**Option A** (Recommended): Keep specialized renderers in separate files, import into FieldRenderer
```
FieldRenderer delegates to:
  ├── TypographyFields.tsx (no changes)
  ├── FillSection.tsx (no changes)
  ├── TableColumnsField.tsx (no changes)
  ├── DataSourceField.tsx (no changes or minimal)
  └── textFieldRenderer, numberFieldRenderer... (inline in FieldRenderer or in new BasicFieldRenderers.tsx)
```

**Option B**: All renderers in one massive file (not recommended, hard to maintain)

---

## 🔄 Migration Path

### Phase 1: Create FieldRenderer.tsx (Non-breaking)
- Add new file with all field type mappings
- Import existing specialized renderers
- Initially return `null` for unknown types, log warning
- **No changes to ComponentInspector yet**

### Phase 2: Refactor ComponentInspector
- Replace all inline field type conditionals with FieldRenderer call
- Remove FillSection special case
- Remove DataSourceField special case
- Run tests, verify all widgets work

### Phase 3: Clean up ConfigField.tsx
- Remove now-redundant switch statements
- ConfigField can now be deleted or reduced to simple wrapper

### Phase 4: Document Field Types
- Add JSDoc to FieldRenderer listing all supported field.type values
- Update WIDGETS_COMPREHENSIVE_MAP.md with rendering architecture

---

## 📊 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Files handling field dispatch** | 3-5 (scattered) | 1 (FieldRenderer.tsx) |
| **Adding new field type** | 2-3 files (scattered changes) | 1 file (FieldRenderer.tsx) |
| **Testing field renderers** | Must mock entire inspector | Can unit test FieldRenderer directly |
| **Field type documentation** | Spread across 5 files | Centralized in FieldRenderer.tsx |
| **Label changes** | Find-and-replace across 3+ files | Edit schema + renderer, done |
| **Hard-coded conditionals** | 4+ (e.g., `isTextComponent`) | 0 (all in field.type switch) |
| **Understanding code flow** | Multiple jumps between files | Linear: schema → FieldRenderer → UI |

---

## 🚀 Timeline

- **Phase 1**: 1-2 hours (create FieldRenderer.tsx, wire existing renderers)
- **Phase 2**: 1 hour (refactor ComponentInspector)
- **Phase 3**: 30 minutes (clean up ConfigField)
- **Phase 4**: 30 minutes (documentation)

**Total**: ~3-4 hours for structural fix

---

## 📝 Labels & Configuration (Your Question)

Once refactored, changing **"Source Type" → "Dataset type"**:

**Before**:
1. Edit widget-schemas.ts (label in DATA_SOURCE_FIELD definition)
2. Edit DataSourceField.tsx (Label component rendering "Source Type")
3. Test, hoping no other files reference it

**After**:
1. Edit widget-schemas.ts (update label in DATA_SOURCE_FIELD)
2. Done. FieldRenderer.tsx automatically uses the schema label.

---

## 🎯 Next Steps

1. **Approve architecture** - Confirm you want centralized FieldRenderer approach
2. **Create FieldRenderer.tsx** - Implement the dispatcher
3. **Refactor ComponentInspector** - Remove conditionals
4. **Test + cleanup** - Validate all widgets work, delete redundant code

Ready to proceed?
