/**
 * DraggableComponentCard - Draggable component card for sidebar
 */

import { Star, Database, Table, Webhook, Code, FileText, BarChart3, Layers, LayoutTemplate, FlaskConical, Type } from 'lucide-react';
import type { ComponentCard } from '@/types/dashboard';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Database, Table, Webhook, Code, FileText, BarChart3, Layers, LayoutTemplate, FlaskConical, Type,
};

interface DraggableComponentCardProps {
    component: ComponentCard;
}

export default function DraggableComponentCard({ component }: DraggableComponentCardProps) {
    const IconComponent = ICON_MAP[component.icon];

    return (
        <button
            className="group flex w-full flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/json', JSON.stringify(component));
                (e.currentTarget as HTMLElement).style.opacity = '0.5';
            }}
            onDragEnd={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
        >
            <div className="flex w-full items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{component.name}</span>
                        <Star
                            className={`h-4 w-4 shrink-0 ${component.isFavorite
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                                }`}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{component.description}</p>
                </div>
            </div>
        </button>
    );
}
