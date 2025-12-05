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
        const subs = groupedComponents[currentLevel.category] || {};
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
            if (last.view === next.view && (last.view === 'root' || last.category === next.category)) return prev;
            return [...prev, next];
        });
    };

    return (
        <>
            <div className="border-b p-4 shrink-0 bg-card/95">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="border-b bg-card/95 px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
                {isSearching ? (
                    <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold">Search results</span>
                        <span className="text-xs text-muted-foreground">{filteredComponents.length}</span>
                    </div>
                ) : (
                    <div className="flex w-full items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setNavStack((p) => p.slice(0, -1))} disabled={!canGoBack} className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-1 items-center gap-1 overflow-hidden text-xs font-medium">
                            {breadcrumbs.map((crumb, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    {crumb.isCurrent ? (
                                        <span className="truncate text-sm text-foreground">{crumb.label}</span>
                                    ) : (
                                        <button type="button" onClick={() => setNavStack((p) => p.slice(0, i + 1))} className="truncate text-sm text-muted-foreground hover:text-foreground">
                                            {crumb.label}
                                        </button>
                                    )}
                                    {i < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{currentCount}</span>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1">
                {isSearching ? (
                    <div className="space-y-3 px-4 py-5">
                        {filteredComponents.length === 0 && <p className="text-xs text-muted-foreground">No components match your search.</p>}
                        {filteredComponents.map((c) => <DraggableComponentCard key={c.id} component={c} />)}
                    </div>
                ) : (
                    <div className="min-h-full overflow-hidden">
                        <div className="flex min-h-full transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${(navStack.length - 1) * 100}%)` }}>
                            {navStack.map((level, idx) => (
                                <div key={`${level.view}-${idx}`} className="min-w-full shrink-0 px-4 py-5">
                                    {level.view === 'root' && (
                                        <div className="space-y-3">
                                            <p className="text-xs uppercase text-muted-foreground">Browse categories</p>
                                            <div className="space-y-2">
                                                {Object.entries(groupedComponents).map(([cat, subs]) => {
                                                    const cfg = CATEGORY_CONFIG[cat] || { label: cat.toUpperCase(), icon: 'Layers' };
                                                    const Icon = ICON_MAP[cfg.icon];
                                                    const total = Object.values(subs).reduce((a, c) => a + c.length, 0);
                                                    return (
                                                        <button key={cat} onClick={() => pushLevel({ view: 'category', category: cat })} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted/60">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 text-muted-foreground">{Icon && <Icon className="h-4 w-4" />}</div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{cfg.label}</p>
                                                                <p className="text-xs text-muted-foreground">{total} components</p>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {level.view === 'category' && (
                                        <div className="space-y-4">
                                            <p className="text-xs uppercase text-muted-foreground">Components</p>
                                            <div className="space-y-3">
                                                {Object.entries(groupedComponents[level.category] || {}).map(([sub, comps], si) => {
                                                    const subCfg = SUBCATEGORY_CONFIG[sub] || { label: sub, icon: 'Layers' };
                                                    return (
                                                        <div key={sub} className={`space-y-2 ${si === 0 ? '' : 'border-t border-border/60 pt-3'}`}>
                                                            <div className="flex items-center justify-between px-1">
                                                                <p className="text-sm font-semibold text-foreground">{subCfg.label}</p>
                                                                <span className="text-xs text-muted-foreground">{comps.length}</span>
                                                            </div>
                                                            <div className="space-y-1">{comps.map((c) => <DraggableComponentCard key={c.id} component={c} />)}</div>
                                                        </div>
                                                    );
                                                })}
                                                {Object.keys(groupedComponents[level.category] || {}).length === 0 && (
                                                    <p className="text-xs text-muted-foreground">No components available in this category.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </>
    );
}
