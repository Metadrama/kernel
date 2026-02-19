import { useMemo } from 'react';
import { useArtboardContext } from '@/context/ArtboardContext';
import { ChartComponentProps } from './ChartComponent';

export default function ChartLegendComponent({ config }: { config?: any }) {
    // This is a placeholder or work-in-progress component based on the error.
    // Assuming standard legend rendering logic or simply null for now to fix build if unused.
    // If used, we should implement proper data fetching similar to ChartComponent.

    // For now, let's render a simple placeholder to satisfy the build if imported.
    return (
        <div className="h-full w-full p-4 flex items-center justify-center bg-muted/10">
            <span className="text-xs text-muted-foreground">Legend</span>
        </div>
    );
}
