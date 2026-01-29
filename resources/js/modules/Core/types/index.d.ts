export interface Auth {
    user: User;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Re-export artboard types for convenience
export type {
    Artboard,
    ArtboardFormat,
    ArtboardDimensions,
    ArtboardPreset,
    ArtboardCategory,
    CanvasPosition,
    CreateArtboardOptions,
    UpdateArtboardOptions,
} from '@/modules/Artboard/types/artboard';
