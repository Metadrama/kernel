/**
 * ArtboardToolbar - Controls for adding/managing artboards
 */
import { useState } from 'react';
import { Plus, LayoutGrid, Monitor, Tv, Smartphone, FileText, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ArtboardPreset, ArtboardFormat } from '@/types/artboard';
import { ARTBOARD_PRESETS, ARTBOARD_CATEGORIES } from '@/constants/artboard-presets';

interface ArtboardToolbarProps {
  onAddArtboard: (format: ArtboardFormat) => void;
}

export default function ArtboardToolbar({ onAddArtboard }: ArtboardToolbarProps) {
  const [open, setOpen] = useState(false);

  const iconForCategory: Record<string, React.ReactNode> = {
    print: <FileText className="h-3.5 w-3.5" />,
    presentation: <Presentation className="h-3.5 w-3.5" />,
    web: <Monitor className="h-3.5 w-3.5" />,
    display: <Tv className="h-3.5 w-3.5" />,
    mobile: <Smartphone className="h-3.5 w-3.5" />,
  };

  const byCategory: Record<string, ArtboardPreset[]> = ARTBOARD_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = Object.values(ARTBOARD_PRESETS).filter(p => p.category === cat.id);
    return acc;
  }, {} as Record<string, ArtboardPreset[]>);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Artboard
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Choose Format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ARTBOARD_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mb-2">
            <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              {iconForCategory[cat.id]}
              {cat.label}
            </div>
            {byCategory[cat.id].map((preset) => (
              <DropdownMenuItem
                key={preset.format}
                className="flex-col items-start gap-0"
                onClick={() => {
                  onAddArtboard(preset.format);
                  setOpen(false);
                }}
              >
                <div className="text-sm font-medium">{preset.dimensions.label}</div>
                <div className="text-xs text-muted-foreground">{preset.description || preset.format}</div>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
