# Kernel: Version 1.0 Implementation Roadmap

## 1. Executive Summary

This roadmap outlines the path to transition Kernel from a pre-mature "sandbox" state into a stable, production-ready release (Version 1.0). The audit has highlighted gaps in architectural robustness (state persistence limitations), incomplete adaptivity in the GridStack layout system, a missing View vs. Edit paradigm, and a widget ecosystem that needs expansion and reliability.

## 2. Architecture & Persistence Stabilization

**Current State**: The backend (Laravel 12) uses filesystem-based JSON storage via `DashboardService.php`. While fine for prototypes, this creates concurrency, scaling, and collaboration issues. The frontend connects directly to Google Sheets via `GoogleSheetsService` but falls back to mock data aggressively.

**Action Items**:
- [ ] **Database Migration**: Move dashboard persistence from filesystem JSON (`storage/app/dashboards/`) to a relational database (PostgreSQL/MySQL).
  - Create `dashboards`, `artboards`, and `widgets` tables to allow granular queries and updates.
- [ ] **State Management Review**: Implement an optimistic UI update pattern in the frontend (using React Context or Zustand) to mask latency when saving widget positions.
- [ ] **Robust Error Handling**: Remove arbitrary fallbacks to `MOCK_CHART_DATA` in production. Surface API errors to the UI (e.g., "Google Sheets connection failed" or "Permission Denied") inside the widget.
- [ ] **Authentication Integration**: Implement Laravel Breeze or Jetstream to support isolated user workspaces, preparing for multi-user capabilities.

## 3. UX/UI Overhaul: The Interaction Model

**Current State**: The UI lacks distinction between "building" and "consuming" the dashboard. Interaction is entirely edit-focused. Recent updates have smoothed out inspector overlaps and established a calmer aesthetic (stiff motion presets), which serves as a good foundation.

**Action Items**:
- [ ] **Edit vs. View Paradigm**:
  - Introduce a global toggle state (`isEditMode`).
  - **View Mode**: Disable GridStack drag/drop, hide the ComponentInspector and Sidebar, remove resize handles, and lock all artboards.
  - **Edit Mode**: Current experience with grids, snapping, and inspectors active.
- [ ] **GridStack Adaptivity & Smart Snapping**:
  - **Resolve TODOs**: Implement "fill artboard" modes (fit, fill-width, fill-height) for duplicating components as per the adaptivity assessment.
  - Calculate proportional offsets instead of hardcoded `+2` grid units.
  - Build a smart placement algorithm for dropping new widgets into available whitespace rather than overlapping.
  - Implement seamless cross-artboard transfers (resolving the `// TODO: Implement custom drag-out-of-bounds detection` in `ArtboardCanvas.tsx`).
- [ ] **Industrial Aesthetic Refinements**:
  - Unify the Nivo chart color palettes.
  - Implement a standardized "Widget Shell" chrome with subtle borders, hover states for the toolbar, and a unified loading skeleton (`<Loader2>`).

## 4. The Widget Library Expansion

**Current State**: Basic Chart (Line, Bar, Doughnut using Nivo), Chart Legend, and Heading components exist.

**Action Items**:
- [ ] **Data-Reactive KPI Tiles (Scorecards)**: A critical widget for dashboards showing a single aggregate number (e.g., "Total Sales"), optionally with a delta/sparkline.
- [ ] **Data Table Widget**: Implement a sortable, paginated table component that maps directly to Google Sheets columns.
- [ ] **Map Widget**: Implement a simple choropleth or pin map (e.g., using `@nivo/geo` or Leaflet) that binds to location/value pairs.
- [ ] **Dynamic Text Widget**: Extend the `HeadingComponent` to allow markdown/rich text and dynamic variable interpolation from connected data sources.
- [ ] **Unified Data Binding Interface**: Refactor `DataSourceConfig.tsx` to handle these new component types universally, mapping data columns to specific prop dimensions (X-axis, Y-axis, Geo-location, Tooltip, etc.).

## 5. Stability & Quality Assurance

**Current State**: Scattered TODOs, static mocks, and unhandled edge cases in drag/drop.

**Action Items**:
- [ ] **Patch Widget Transfer Logic**: Currently cross-artboard transfers bypass `acceptWidgets` to avoid React/GridStack conflicts. This needs robust bounds-checking to prevent dropping widgets into the void.
- [ ] **Data Debouncing**: Add debouncing to the `useGoogleSheetsData` hook to prevent rate-limiting when the user is rapidly changing configuration parameters.
- [ ] **Automated Testing**: Write Cypress or Laravel Dusk tests for the core interaction loop (drag widget -> configure data source -> save dashboard).

## 6. Delivery Phases

1. **Phase 1: Foundation (Weeks 1-2)**
   - Database persistence migration, Auth integration, and Edit vs. View mode implementation.
2. **Phase 2: Grid & Interaction Polish (Weeks 3-4)**
   - Smart GridStack placement, adaptivity fixes, and cross-artboard transfer robustness.
3. **Phase 3: Widget Ecosystem (Weeks 5-6)**
   - KPI Tiles, Data Tables, and Maps. Dynamic data binding for all new widgets.
4. **Phase 4: QA & V1.0 Release (Week 7)**
   - Error handling, test coverage, UI polish, and removal of mock fallbacks.
