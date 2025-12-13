import { useMemo } from 'react';
import { useArtboardContext } from '@/context/ArtboardContext';
import MobileWidgetShell from './MobileWidgetShell';

export default function MobileDashboardView() {
    const {
        artboards,
        selectedArtboardId,
    } = useArtboardContext();

    // Pick active artboard or first one
    const activeArtboard = useMemo(() => {
        if (selectedArtboardId) {
            return artboards.find(a => a.id === selectedArtboardId) || artboards[0];
        }
        return artboards[0];
    }, [artboards, selectedArtboardId]);

    // Sort widgets for reading flow (Top -> Bottom, Left -> Right)
    const sortedWidgets = useMemo(() => {
        if (!activeArtboard) return [];

        return [...activeArtboard.widgets].sort((a, b) => {
            // Threshold for "same row" to avoid jumping
            const yDiff = a.y - b.y;
            if (Math.abs(yDiff) > 5) { // 5 grid units tolerance
                return yDiff;
            }
            return a.x - b.x;
        });
    }, [activeArtboard]);

    if (!activeArtboard) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <p className="text-muted-foreground">No artboard found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 pb-20 overflow-y-auto">
            {/* Mobile Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight text-primary">
                    {activeArtboard.name}
                </h1>
                {/* We can add a simple artboard switcher here later if needed */}
            </div>

            {/* Widget Stack */}
            <div className="flex flex-col gap-4">
                {sortedWidgets.map(widget => (
                    <MobileWidgetShell key={widget.id} widget={widget} />
                ))}
            </div>

            {/* Simplified Footer / Indicator */}
            <div className="mt-8 text-center text-xs text-muted-foreground">
                Mobile Reader Mode
            </div>
        </div>
    );
}
