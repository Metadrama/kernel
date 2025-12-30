/**
 * ComponentsPanel - Simplified components list
 *
 * Goals:
 * - Clean, single-list layout (no category navigation)
 * - Styling consistent with the inspector panels (simple header + search + list)
 * - Works well even when only a single "real" component exists
 */

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import DraggableComponentCard from './DraggableComponentCard';

export default function ComponentsPanel() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredComponents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return AVAILABLE_COMPONENTS;
        return AVAILABLE_COMPONENTS.filter((item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }, [searchQuery]);

    return (
        <>
            {/* Search */}
            <div className="shrink-0 border-b bg-card/95 p-4">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {filteredComponents.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground">No components match your search.</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredComponents.map((component) => (
                                <DraggableComponentCard key={component.id} component={component} />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </>
    );
}
