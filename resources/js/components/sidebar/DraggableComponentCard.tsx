/**
 * DraggableComponentCard - Draggable component card for sidebar
 */

import { Star, Database, Table, Webhook, Code, FileText, BarChart3, Layers, LayoutTemplate, FlaskConical, Type } from 'lucide-react';
import type { ComponentCard } from '@/types/dashboard';
import { cn } from '@/lib/utils';

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
            className={cn(
                "group flex w-full flex-col items-start gap-2 rounded-lg p-2 text-left transition-all duration-200",
                "hover:bg-accent/50 hover:shadow-sm border border-transparent hover:border-border/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
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
            <div className="flex w-full items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground ring-1 ring-inset ring-border/20 group-hover:bg-background group-hover:text-primary transition-colors">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">{component.name}</span>
                        {component.isFavorite && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight mt-0.5 opacity-80 group-hover:opacity-100">{component.description}</p>
                </div>
            </div>
        </button>
    );
}
