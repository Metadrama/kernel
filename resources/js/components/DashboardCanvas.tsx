import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardCanvas() {
  return (
    <div className="relative flex h-screen flex-1 flex-col overflow-auto bg-muted/30">
      {/* Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Empty State */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25">
            <Plus className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Your canvas is empty
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Drag components from the sidebar to start building your dashboard
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>

      {/* Top Bar (for future toolbar) */}
      <div className="absolute top-0 left-0 right-0 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Untitled Dashboard</h1>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Last saved: Never</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Preview
          </Button>
          <Button size="sm">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
