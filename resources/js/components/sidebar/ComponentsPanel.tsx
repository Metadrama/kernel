/**
 * ComponentsPanel - Component browser with navigation
 */

import { useState, useMemo } from 'react';
import { Search, ChevronRight, ArrowLeft, Database, Table, Webhook, Code, FileText, BarChart3, Layers, LayoutTemplate, FlaskConical, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import DraggableComponentCard from './DraggableComponentCard';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Database, Table, Webhook, Code, FileText, BarChart3, Layers, LayoutTemplate, FlaskConical, Type,
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
    'test-components': { label: 'TEST COMPONENTS', icon: 'FlaskConical' },
};

const SUBCATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
    'chart': { label: 'Chart', icon: 'BarChart3' },
    'text': { label: 'Text', icon: 'Type' },
    'layout': { label: 'Layout', icon: 'LayoutTemplate' },
};

type NavLevel = { view: 'root' } | { view: 'category'; category: string };

export default function ComponentsPanel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [navStack, setNavStack] = useState<NavLevel[]>([{ view: 'root' }]);

    const currentLevel = navStack[navStack.length - 1];
    const canGoBack = navStack.length > 1;
    const isSearching = searchQuery.trim().length > 0;

    const filteredComponents = useMemo(
        () => AVAILABLE_COMPONENTS.filter(
            (item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [searchQuery]
    );

    const groupedComponents = useMemo(() => {
        const groups: Record<string, Record<string, typeof AVAILABLE_COMPONENTS>> = {};
        for (const component of AVAILABLE_COMPONENTS) {
            const category = component.category;
            const subcategory = component.subcategory || 'other';
            if (!groups[category]) groups[category] = {};
            if (!groups[category][subcategory]) groups[category][subcategory] = [];
            groups[category][subcategory].push(component);
        }
        return groups;
    }, []);

    const currentCount = useMemo(() => {
        if (currentLevel.view === 'root') return AVAILABLE_COMPONENTS.length;
        // Explicitly cast or rely on flow analysis
        const category = (currentLevel as { category: string }).category;
        const subs = groupedComponents[category] || {};
        return Object.values(subs).reduce((acc, c) => acc + c.length, 0);
    }, [currentLevel, groupedComponents]);

    const getCategoryLabel = (cat: string) => CATEGORY_CONFIG[cat]?.label || cat.toUpperCase();

    const breadcrumbs = useMemo(() => navStack.map((level, i) => ({
        label: level.view === 'root' ? 'Components' : getCategoryLabel(level.category),
        index: i,
        isCurrent: i === navStack.length - 1,
    })), [navStack]);

    const pushLevel = (next: NavLevel) => {
        setNavStack((prev) => {
            const last = prev[prev.length - 1];
            // Check for equality carefully to avoid TS errors or infinite loops if object ref changes
            if (last.view === next.view) {
                if (last.view === 'root') return prev;
                if (last.view === 'category' && next.view === 'category' && last.category === next.category) return prev;
            }
            return [...prev, next];
        });
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="border-b p-3 shrink-0 bg-card/50 backdrop-blur-sm z-10">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                        type="text"
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            <div className="border-b bg-muted/20 px-3 py-2 flex items-center gap-2 text-sm font-medium h-9 shrink-0">
                {isSearching ? (
                    <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Search results</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{filteredComponents.length}</span>
                    </div>
                ) : (
                    <div className="flex w-full items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setNavStack((p) => p.slice(0, -1))}
                            disabled={!canGoBack}
                            className="h-6 w-6 -ml-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex flex-1 items-center gap-1 overflow-hidden">
                            {breadcrumbs.map((crumb, i) => (
                                <div key={i} className="flex items-center gap-1 text-xs">
                                    {crumb.isCurrent ? (
                                        <span className="truncate font-semibold text-foreground">{crumb.label}</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setNavStack((p) => p.slice(0, i + 1))}
                                            className="truncate text-muted-foreground hover:text-foreground hover:underline transition-all"
                                        >
                                            {crumb.label}
                                        </button>
                                    )}
                                    {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1">
                {isSearching ? (
                    <div className="space-y-3 p-3">
                        {filteredComponents.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No components match your search.</p>}
                        {filteredComponents.map((c) => <DraggableComponentCard key={c.id} component={c} />)}
                    </div>
                ) : (
                    <div className="min-h-full overflow-hidden relative">
                        <div
                            className="flex min-h-full transition-transform duration-300 ease-[cubic-bezier(0.2,0.0,0.2,1)]"
                            style={{ transform: `translateX(-${(navStack.length - 1) * 100}%)` }}
                        >
                            {navStack.map((level, idx) => (
                                <div key={`${level.view}-${idx}`} className="min-w-full shrink-0 p-3">
                                    {level.view === 'root' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
                                            </div>
                                            <div className="space-y-1">
                                                {Object.entries(groupedComponents).map(([cat, subs]) => {
                                                    const cfg = CATEGORY_CONFIG[cat] || { label: cat.toUpperCase(), icon: 'Layers' };
                                                    const Icon = ICON_MAP[cfg.icon];
                                                    const total = Object.values(subs).reduce((a, c) => a + c.length, 0);
                                                    return (
                                                        <button
                                                            key={cat}
                                                            onClick={() => pushLevel({ view: 'category', category: cat })}
                                                            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-muted/60 active:bg-muted"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background border border-border/40 text-muted-foreground shadow-sm group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                                                {Icon && <Icon className="h-4 w-4" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cfg.label}</p>
                                                                <p className="text-[10px] text-muted-foreground">{total} components</p>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {level.view === 'category' && (
                                        <div className="space-y-5">
                                            {Object.entries(groupedComponents[level.category] || {}).map(([sub, comps], si) => {
                                                const subCfg = SUBCATEGORY_CONFIG[sub] || { label: sub, icon: 'Layers' };
                                                return (
                                                    <div key={sub} className="space-y-2">
                                                        <div className="flex items-center justify-between px-1 sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                                                            <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">{subCfg.label}</p>
                                                            <span className="text-[10px] bg-muted px-1.5 rounded text-muted-foreground">{comps.length}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {comps.map((c) => <DraggableComponentCard key={c.id} component={c} />)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {Object.keys(groupedComponents[level.category] || {}).length === 0 && (
                                                <div className="text-center py-8">
                                                    <p className="text-xs text-muted-foreground">No components available in this category.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
