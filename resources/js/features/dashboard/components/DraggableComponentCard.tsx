/**
 * DraggableComponentCard - Draggable component card for sidebar
 */

import { useState } from 'react';
import { useDragDrop } from '@/core/context/DragDropContext';
import type { ComponentCard } from '@/features/dashboard/types/dashboard';
import { BarChart3, Code, Database, FileText, FlaskConical, Layers, LayoutTemplate, Table, Type, Webhook, TrendingUp, BarChart2, PieChart, Gauge, Hash, Image, List } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Database,
    Table,
    Webhook,
    Code,
    FileText,
    BarChart3,
    BarChart2,
    PieChart,
    Gauge,
    Hash,
    Image,
    List,
    Layers,
    LayoutTemplate,
    FlaskConical,
    Type,
    TrendingUp,
};

interface DraggableComponentCardProps {
    component: ComponentCard;
}

export default function DraggableComponentCard({ component }: DraggableComponentCardProps) {
    const IconComponent = ICON_MAP[component.icon];
    const { beginDrag, endDrag } = useDragDrop();
    const [isDragging, setIsDragging] = useState(false);

    return (
        <button
            className={`
                group flex w-full flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left 
                transition-all duration-150 ease-out
                hover:bg-accent hover:text-accent-foreground
                active:scale-[0.98]
                ${isDragging ? 'opacity-50 scale-[0.98] shadow-lg' : ''}
            `}
            draggable
            onDragStart={(e) => {
                setIsDragging(true);
                // Track payload in-memory for reliable drag-over previews/snapping.
                beginDrag(component);

                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/json', JSON.stringify(component));
                
                // Micro-interaction: visual feedback on drag start
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.98)';
                target.style.opacity = '0.5';
            }}
            onDragEnd={(e) => {
                setIsDragging(false);
                endDrag();
                
                // Micro-interaction: restore visual state
                const target = e.currentTarget as HTMLElement;
                target.style.transform = '';
                target.style.opacity = '1';
            }}
        >
            <div className="flex w-full items-center gap-2">
                <div className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-md 
                    bg-muted/60 text-muted-foreground
                    transition-all duration-150 ease-out
                    group-hover:bg-primary/10 group-hover:text-primary
                    ${isDragging ? 'bg-primary/20 text-primary scale-105' : ''}
                `}>
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{component.name}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{component.description}</p>
                </div>
            </div>
        </button>
    );
}


