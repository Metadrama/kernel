/**
 * ArtboardToolbar - Controls for adding/managing artboards
 */
import { useState } from 'react';
import { Plus, LayoutGrid, Monitor, Tv, Smartphone, FileText, Presentation } from 'lucide-react';
import { Button } from '@/modules/DesignSystem/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/modules/DesignSystem/ui/dropdown-menu';
import type { ArtboardPreset, ArtboardFormat } from '@/modules/Artboard/types/artboard';
import { ARTBOARD_PRESETS, ARTBOARD_CATEGORIES } from '@/modules/DesignSystem/constants/artboard-presets';

interface ArtboardToolbarProps {
  onAddArtboard: (format: ArtboardFormat) => void;
}

export default function ArtboardToolbar({ onToggleAddArtboard }: { onToggleAddArtboard: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onToggleAddArtboard}>
      <Plus className="mr-2 h-4 w-4" />
      Add Artboard
    </Button>
  );
}


