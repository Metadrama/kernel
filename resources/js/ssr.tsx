/// <reference types="vite/client" />
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => title ? `${title} - ${appName}` : appName,
        resolve: (name) => resolvePageComponent(`./modules/${name}/pages/${name}Page.tsx`, import.meta.glob('./modules/**/pages/*.tsx')),
        setup: ({ App, props }) => <App {...props} />,
    }),
);
