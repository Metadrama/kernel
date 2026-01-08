import { 
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
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Card } from '@/shared/components/ui/card';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import type { ComponentCard } from '@/features/dashboard/types/dashboard';

const ICON_MAP = {
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
  TrendingUp,
};

interface ComponentToolboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectComponent: (component: ComponentCard) => void;
}

export default function ComponentToolbox({
  open,
  onOpenChange,
  onSelectComponent,
}: ComponentToolboxProps) {
  const handleSelect = (component: ComponentCard) => {
    onSelectComponent(component);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Component Toolbox</DialogTitle>
          <DialogDescription>
            Select a component to add to your widget
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_COMPONENTS.map((component) => {
              const IconComponent = ICON_MAP[component.icon as keyof typeof ICON_MAP];
              
              return (
                <Card
                  key={component.id}
                  className="group cursor-pointer p-4 transition-all hover:bg-accent hover:border-primary hover:shadow-md"
                  onClick={() => handleSelect(component)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      {IconComponent && (
                        <IconComponent className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1">
                        {component.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {component.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Click on any component to add it to your widget
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


