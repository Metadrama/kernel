import { useMemo } from 'react';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import { DirectComponent } from '@/modules/Artboard/components/DirectComponent';

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

    // Sort components for reading flow (Top -> Bottom, Left -> Right)
    const sortedComponents = useMemo(() => {
        if (!activeArtboard) return [];

        return [...activeArtboard.components].sort((a, b) => {
            // Threshold for "same row" to avoid jumping
            const yDiff = a.position.y - b.position.y;
            if (Math.abs(yDiff) > 20) { // 20px tolerance
                return yDiff;
            }
            return a.position.x - b.position.x;
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
            </div>

            {/* Component Stack */}
            <div className="flex flex-col gap-4">
                {sortedComponents.map(component => (
                    <div key={component.instanceId} className="w-full">
                        <DirectComponent
                            component={component}
                            isSelected={false}
                            scale={1}
                            scaleWithZoom={true}
                            onSelect={() => { }}
                            onPositionChange={() => { }}
                            onConfigChange={() => { }}
                            onDelete={() => { }}
                            onZOrderChange={() => { }}
                        />
                    </div>
                ))}
            </div>

            {/* Simplified Footer / Indicator */}
            <div className="mt-8 text-center text-xs text-muted-foreground">
                Mobile Reader Mode
            </div>
        </div>
    );
}


