import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Page } from '@inertiajs/core';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = InertiaPageProps & {
    auth: {
        user: User;
    };
} & T;

// Export from sub-files
export * from './artboard';
export * from './dashboard';
export * from './component-config'; // Includes DataSource
