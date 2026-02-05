/// <reference types="vite/client" />
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Map route names to page files when they don't follow the `{Name}Page` convention.
// This fixes the home route `Inertia::render('welcome')` → modules/Core/pages/Welcome.tsx.
const pageAliases: Record<string, string> = {
    welcome: './modules/Core/pages/Welcome.tsx',
};

const pages = import.meta.glob('./modules/**/pages/*.{ts,tsx}');

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => {
        const target = pageAliases[name] ?? `./modules/${name}/pages/${name}Page.tsx`;
        return resolvePageComponent(target, pages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
