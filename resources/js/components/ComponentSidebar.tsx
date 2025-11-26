import { useState, useEffect } from 'react';
import { Search, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft, Database, Table, Webhook, Code, FileText, BarChart3, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import type { ComponentCard } from '@/types/dashboard';

const ICON_MAP = {
  Database,
  Table,
  Webhook,
  Code,
  FileText,
  BarChart3,
};

export default function ComponentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['stores-utility']);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const filteredComponents = AVAILABLE_COMPONENTS.filter(component =>
    component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    component.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedComponents = filteredComponents.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<string, ComponentCard[]>);

  if (isCollapsed) {
    return (
      <div className="flex h-screen w-12 flex-col border-r bg-background">
        <div className="flex h-14 items-center justify-center border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-80 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">dataviser://</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search data components"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto">
        {/* Functions Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('functions')}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            {expandedSections.includes('functions') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            FUNCTIONS
          </button>
        </div>

        {/* Stores & Utility Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('stores-utility')}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            {expandedSections.includes('stores-utility') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            STORES & UTILITY
          </button>

          {expandedSections.includes('stores-utility') && groupedComponents['stores-utility'] && (
            <div className="space-y-2 p-4">
              {groupedComponents['stores-utility'].map((component) => {
                const IconComponent = ICON_MAP[component.icon as keyof typeof ICON_MAP];
                return (
                  <Card
                    key={component.id}
                    className="group cursor-grab p-3 transition-colors hover:bg-accent active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('application/json', JSON.stringify(component));
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-sm">{component.name}</h3>
                          <Star
                            className={`h-4 w-4 shrink-0 ${
                              component.isFavorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {component.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Marketplace Section */}
        <div className="border-b">
          <button
            onClick={() => toggleSection('marketplace')}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            {expandedSections.includes('marketplace') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            MARKETPLACE
          </button>
        </div>

        {/* Node Files Section */}
        <div>
          <button
            onClick={() => toggleSection('node-files')}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            {expandedSections.includes('node-files') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            NODE FILES
          </button>
        </div>
      </div>
    </div>
  );
}
