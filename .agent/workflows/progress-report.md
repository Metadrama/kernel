---
description: Generate a comprehensive codebase progress report with interactive diagrams
---

# Progress Report Workflow

Generate an interactive HTML progress report with circle packing diagrams for the Kernel codebase.

## Steps

1. **Analyze Codebase Structure**
   - List all directories under `resources/js/`
   - Count files and lines in each module (components, hooks, lib, types, pages)
   - Identify core/critical files (>200 lines or central to architecture)

2. **Gather Statistics**
   - Total TypeScript/TSX files
   - Total lines of code
   - Number of React components
   - Number of custom hooks
   - Recent work from conversation history (if available)

3. **Generate HTML Report**
   - Use the template at `.agent/templates/progress-report-template.html`
   - Include these sections:
     - Stats cards (files, LOC, components, hooks)
     - Technology stack badges
     - Circle packing diagram (Mermaid) showing module hierarchy
     - Architecture flow diagram (Mermaid)
     - Core modules table with line counts
     - Recent sprints/work table

4. **Save and Open Report**
   - Save to artifacts directory as `codebase_report.html`
   - Open in default browser using: `Start-Process "<path-to-file>"`

## Diagram Guidelines

### Circle Packing Structure
```
ROOT (kernel)
├── FRONTEND (resources/js)
│   ├── COMPONENTS (with subgroups for artboard, ui, config-panel, sidebar, widget)
│   ├── HOOKS
│   ├── LIB
│   ├── TYPES
│   └── PAGES
└── BACKEND (app)
    ├── Http
    ├── Models
    └── Services
```

### Highlighting Critical Files
- Mark files with ⭐ if they have >300 lines or are central to the system
- Use pink/red fill (#e94560) for critical components
- Use blue fill (#4d96ff) for hooks
- Use orange fill (#ff922b) for libraries

### Interactive Features Required
- Mouse wheel zoom on diagrams
- Click and drag to pan
- Zoom buttons (+, -, reset)
- Zoom level percentage display

## Output Location
The report should be saved to the conversation's artifact directory and opened in the browser.
