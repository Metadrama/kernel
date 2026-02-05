import { Button } from '@/modules/DesignSystem/ui/button';
import { Input } from '@/modules/DesignSystem/ui/input';
import { Label } from '@/modules/DesignSystem/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/DesignSystem/ui/select';
import { Switch } from '@/modules/DesignSystem/ui/switch';
import type { TableColumnConfig } from '@/modules/DataLayer/types/component-config';
import { Plus, Trash2 } from 'lucide-react';

interface TableColumnsFieldProps {
  columns: TableColumnConfig[];
  onChange: (columns: TableColumnConfig[]) => void;
}

const FORMAT_OPTIONS = ['text', 'number', 'currency', 'date', 'percent'] as const;
const ALIGN_OPTIONS = ['left', 'center', 'right'] as const;

export function TableColumnsField({ columns, onChange }: TableColumnsFieldProps) {
  const handleAdd = () => {
    onChange([
      ...columns,
      {
        field: `column_${Date.now()}`,
        header: 'New Column',
        formatType: 'text',
        align: 'left',
      },
    ]);
  };

  const handleUpdate = (index: number, updates: Partial<TableColumnConfig>) => {
    const next = [...columns];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {columns.length === 0 && (
        <div className="text-xs text-muted-foreground">No columns configured.</div>
      )}

      <div className="space-y-2">
        {columns.map((column, index) => (
          <div key={index} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Column {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Input
                type="text"
                value={column.field}
                onChange={(e) => handleUpdate(index, { field: e.target.value })}
                placeholder="Field name (e.g., amount)"
                className="h-8 text-sm"
              />
              <Input
                type="text"
                value={column.header}
                onChange={(e) => handleUpdate(index, { header: e.target.value })}
                placeholder="Header label"
                className="h-8 text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={column.formatType || 'text'}
                  onValueChange={(value) => handleUpdate(index, { formatType: value as TableColumnConfig['formatType'] })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={column.align || 'left'}
                  onValueChange={(value) => handleUpdate(index, { align: value as TableColumnConfig['align'] })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Align" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGN_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="text"
                value={column.width ?? ''}
                onChange={(e) => handleUpdate(index, { width: e.target.value || undefined })}
                placeholder="Width (e.g., 120, 20%, auto)"
                className="h-8 text-sm"
              />

              {column.formatType === 'currency' && (
                <Input
                  type="text"
                  value={column.currencyCode ?? ''}
                  onChange={(e) => handleUpdate(index, { currencyCode: e.target.value || undefined })}
                  placeholder="Currency code (e.g., USD)"
                  className="h-8 text-sm"
                />
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs">Sortable</Label>
                <Switch
                  checked={Boolean(column.sortable)}
                  onCheckedChange={(checked) => handleUpdate(index, { sortable: checked })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full">
        <Plus className="mr-2 h-3 w-3" />
        Add Column
      </Button>
    </div>
  );
}
