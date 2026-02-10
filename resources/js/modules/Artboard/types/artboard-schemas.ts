/**
 * Zod validation schemas for artboard data structures
 * Extracted from ArtboardContext for better separation of concerns
 */

import { z } from 'zod';

export const ARTBOARD_FORMATS = [
    'a4-portrait',
    'a4-landscape',
    'a3-portrait',
    'a3-landscape',
    'a2-portrait',
    'a2-landscape',
    'slide-16-9',
    'slide-4-3',
    'web-1440',
    'web-responsive',
    'display-fhd',
    'display-4k',
    'mobile-portrait',
    'mobile-landscape',
    'custom',
] as const;

export const zComponentPosition = z
    .object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        zIndex: z.number(),
        rotation: z.number().optional(),
    })
    .passthrough();

export const zArtboardComponent = z
    .object({
        instanceId: z.string(),
        componentType: z.string(),
        position: zComponentPosition,
        config: z.record(z.string(), z.unknown()),
        locked: z.boolean().optional(),
        hidden: z.boolean().optional(),
        flipX: z.boolean().optional(),
        flipY: z.boolean().optional(),
    })
    .passthrough();

export const zArtboardDimensions = z
    .object({
        widthMm: z.number().optional(),
        heightMm: z.number().optional(),
        widthPx: z.number(),
        heightPx: z.number(),
        aspectRatio: z.number(),
        dpi: z.number(),
        label: z.string(),
    })
    .passthrough();

export const zCanvasPosition = z
    .object({
        x: z.number(),
        y: z.number(),
    })
    .passthrough();

export const zArtboard = z
    .object({
        id: z.string(),
        name: z.string(),
        format: z.enum(ARTBOARD_FORMATS),
        dimensions: zArtboardDimensions,
        position: zCanvasPosition,
        zoom: z.number(),
        backgroundColor: z.string(),
        backgroundImage: z.string().optional(),
        components: z.array(zArtboardComponent),
        locked: z.boolean(),
        visible: z.boolean(),
        showGrid: z.boolean(),
        showRulers: z.boolean(),
        clipContent: z.boolean().optional().default(true),
        gridPadding: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .passthrough();

export const zPersistedPayloadV1 = z.object({
    version: z.literal(1),
    artboards: z.array(zArtboard),
});

export type ArtboardFormat = (typeof ARTBOARD_FORMATS)[number];
