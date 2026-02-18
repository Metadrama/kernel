# Kernel - Dynamic Dashboard Builder

A **modern dashboard builder** that separates layout from content, allowing users to create customizable data visualizations with drag-and-drop functionality. Built with Laravel, Inertia.js, and React.

> ⚠️ **Work In Progress (WIP)**: This project is under active development. Core features are functional but the application is not yet production-ready. See [Project Status](#project-status) for details.

## 🎯 Overview

Kernel is a dynamic dashboard builder that provides a sandbox environment for creating data-driven dashboards. Instead of hard-coded layouts, users define grid structures first (containers/artboards) and then inject specific functionality (widgets with charts, text, etc.) into those containers.

Think of it less like a static webpage and more like a **trading terminal** or an **operating system desktop** that lives in the browser.

### Key Concepts

- **Artboards**: Fixed-dimension containers representing specific output formats (A4 print, 16:9 presentation slides, mobile screens, etc.)
- **Widgets**: Draggable, resizable containers that hold components
- **Components**: The actual content (charts, headings, etc.) that render inside widgets
- **Schema-Driven**: Dashboard layouts are stored as JSON, making them lightweight and easy to backup/duplicate

## ✨ Features

### Current Features
- 📐 **Multi-Format Artboards**: Create dashboards for print (A4, A3, A2), presentations (16:9, 4:3), web, display/TV (FHD, 4K), and mobile formats
- 🎨 **Infinite Canvas**: Custom high-performance layout engine with smart snapping and alignment guides
- 📊 **Chart Components**: Line, Bar, and Doughnut charts using Chart.js with multiple color palettes
- 📝 **Text Components**: Editable headings for dashboard titles and labels
- 📋 **Google Sheets Integration**: Connect charts to live Google Sheets data sources
- 🗂️ **Layer Management**: Organize and reorder artboards with a dedicated layers panel
- 💾 **Auto-Save**: Dashboard layouts persist to session storage and localStorage

### Planned Features
- User authentication and multi-user support
- Dashboard sharing and collaboration
- Export to PDF/PNG
- More widget component types
- Database persistence for dashboards
- Custom component creation

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Laravel 12 | Database, authentication, business logic, JSON schema storage |
| **Bridge** | Inertia.js | SPA-like experience without separate REST API |
| **Frontend** | React 19 | UI rendering and interactivity |
| **UI Components** | Radix UI + Tailwind CSS 4 | Polished, accessible component library |
| **Layout Engine** | Custom (React) | Infinite canvas, alignment guides, collision handling |
| **Charts** | Chart.js + react-chartjs-2 | Data visualization |
| **Build Tool** | Vite 7 | Fast development and production builds |
| **Type Safety** | TypeScript | Static typing for React components |

## 🏗️ Architecture
53: 
54: ### Frontend State Management
55: 
56: The application uses a split-context architecture to optimize performance and prevent unnecessary re-renders.
57: 
58: ```mermaid
59: graph TD
60:     subgraph "Context Layer"
61:         State[State Context<br/>(Heavy Data)]
62:         Select[Selection Context<br/>(UI State)]
63:         Action[Action Context<br/>(Stable Dispatch)]
64:     end
65: 
66:     subgraph "UI Components"
67:         Sidebar[Component Sidebar]
68:         Inspector[Inspector Panel]
69:     end
70: 
71:     subgraph "Canvas Layer"
72:         Canvas[Infinite Canvas]
73:         Widgets[Widgets<br/>(Charts, KPIs)]
74:     end
75: 
76:     State -->|Updates| Canvas
77:     State -->|Updates| Widgets
78:     
79:     Select -->|Updates| Sidebar
80:     Select -->|Updates| Inspector
81:     
82:     Action -.->|Events| Sidebar
83:     Action -.->|Events| Inspector
84:     Action -.->|Events| Canvas
85: ```
86: 
87: ### Performance Features
88: - **Split Contexts**: Heavy data state is isolated from high-frequency selection state.
89: - **Lazy Loading**: Major route components (`ArtboardCanvas`, `Sidebar`) are code-split and lazy loaded.
90: - **Conditional Hydration**: Mobile and Desktop views are conditionally hydrated to minimize TBT (Total Blocking Time).
91: 
92: ## 📁 Project Structure

```
kernel/
├── app/
│   ├── Http/Controllers/     # Laravel controllers
│   │   ├── DashboardController.php
│   │   └── GoogleSheetsController.php
│   └── Services/
│       └── GoogleSheetsService.php
├── resources/js/
│   ├── components/
│   │   ├── artboard/         # Artboard canvas and containers
│   │   ├── sidebar/          # Component browser and layers panel
│   │   ├── widget/           # Widget shell and toolbar
│   │   ├── widget-components/# Chart, Heading, etc.
│   │   └── ui/               # Shadcn/Radix UI components
│   ├── constants/
│   │   ├── artboard-presets.ts  # Format dimensions (A4, 16:9, etc.)
│   │   └── components.ts        # Available component registry
│   ├── context/
│   │   └── ArtboardContext.tsx  # Global artboard state
│   ├── types/                # TypeScript type definitions
│   └── pages/
│       ├── Dashboard.tsx     # Main dashboard builder
│       └── Welcome.tsx       # Landing page
├── routes/
│   ├── web.php               # Web routes
│   └── api.php               # API routes (Google Sheets)
└── storage/
    └── app/                  # Google service account credentials
```

## 🚀 Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Metadrama/kernel.git
   cd kernel
   ```

2. **Install dependencies**
   ```bash
   composer install
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Set up database**
   ```bash
   touch database/database.sqlite
   php artisan migrate
   ```

5. **Build assets**
   ```bash
   npm run build
   ```

6. **Start the development server**
   ```bash
   composer dev
   ```
   
   Or run services individually:
   ```bash
   php artisan serve     # Backend server
   npm run dev           # Vite dev server
   ```

7. Visit `http://localhost:8000` in your browser

### Google Sheets Integration (Optional)

To connect charts to Google Sheets data:

1. Create a Google Cloud project and enable the Sheets API
2. Create a service account and download the JSON credentials
3. Save the credentials as `storage/app/google-service-account.json`
4. Share your Google Sheets with the service account email

## 📖 Usage

### Creating a Dashboard

1. **Add an Artboard**: Click the "+" button on the canvas to create a new artboard. Choose a format preset (A4, 16:9 slide, etc.)

2. **Add Widgets**: From the sidebar, drag components (charts, headings) onto the artboard. Widgets will snap to the grid.

3. **Configure Components**: Click on a widget to access configuration options like chart type, colors, and data source.

4. **Arrange Layout**: Drag widgets to reposition, or drag edges to resize. The grid system ensures clean alignment.

5. **Manage Layers**: Switch to the "Layers" tab in the sidebar to reorder artboards or toggle visibility.

## 📊 Project Status

This project is in **active development** (Work In Progress). Here's the current state:

| Feature | Status |
|---------|--------|
| Artboard system | ✅ Complete |
| Widget drag & drop | ✅ Complete |
| Chart components | ✅ Complete |
| Google Sheets integration | ✅ Complete |
| Layer management | ✅ Complete |
| User authentication | 🚧 Not started |
| Database persistence | 🚧 Partial (session only) |
| Export functionality | 🚧 Not started |
| Multi-user collaboration | 🚧 Not started |

### Known Limitations

- Dashboard layouts are stored in session/localStorage only (no permanent database storage yet)
- No user authentication - all visitors share the same session
- Limited to predefined component types
- No mobile-optimized editing experience

## 🧪 Development

### Running Tests
```bash
composer test
# or
php artisan test
```

### Linting & Formatting
```bash
npm run lint          # ESLint
npm run format        # Prettier
npm run format:check  # Check formatting
npm run types         # TypeScript check
php vendor/bin/pint   # PHP code style
```

### Building for Production
```bash
npm run build
# For SSR:
npm run build:ssr
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com/) - The PHP framework
- [Inertia.js](https://inertiajs.com/) - The modern monolith
- [Chart.js](https://www.chartjs.org/) - Charting library
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
