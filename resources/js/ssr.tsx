/// <reference types="vite/client" />
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Keep SSR resolution consistent with the client-side mapping.
const pageAliases: Record<string, string> = {
    welcome: './modules/Core/pages/Welcome.tsx',
};

const pages = import.meta.glob('./modules/**/pages/*.{ts,tsx}');

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => title ? `${title} - ${appName}` : appName,
        resolve: (name) => {
            const target = pageAliases[name] ?? `./modules/${name}/pages/${name}Page.tsx`;
            return resolvePageComponent(target, pages);
        },
        setup: ({ App, props }) => <App {...props} />,
    }),
);
