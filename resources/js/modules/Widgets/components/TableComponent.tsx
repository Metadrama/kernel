import { MOCK_CHART_DATA, useGoogleSheetsData } from '@/modules/Widgets/hooks/useGoogleSheetsChartData';
import type { TableConfig, TableColumnConfig, GoogleSheetsDataSource } from '@/modules/DataLayer/types/component-config';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/modules/DesignSystem/lib/utils';
import { Input } from '@/modules/DesignSystem/ui/input';

// ============================================================================
// Helpers
// ============================================================================

function formatCellValue(
  value: unknown,
  column: TableColumnConfig
): string {
  if (value === null || value === undefined) return '';

  const numValue = typeof value === 'number' ? value : parseFloat(String(value));

  switch (column.formatType) {
    case 'currency':
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: column.currencyCode || 'USD',
        }).format(numValue);
      }
      return String(value);

    case 'percent':
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(numValue) + '%';
      }
      return String(value);

    case 'number':
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US').format(numValue);
      }
      return String(value);

    case 'date':
      // Try to parse as date
      const date = new Date(String(value));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US');
      }
      return String(value);

    case 'text':
    default:
      return String(value);
  }
}

// ============================================================================
// Component
// ============================================================================

interface TableComponentProps {
  config: TableConfig;
}

export default function TableComponent({ config }: TableComponentProps) {
  const safeConfig = config || { dataSource: { type: 'static' }, columns: [] };

  // Merge Global Data Source
  const { dataSourceConfig: globalDataSource } = useArtboardContext();
  const localDataSource = safeConfig.dataSource || {};

  const dataSource = useMemo(() => {
    if (!globalDataSource) return localDataSource;
    if (localDataSource.type === 'static') return globalDataSource;

    if (globalDataSource.type === 'google-sheets') {
      const globalGS = globalDataSource as GoogleSheetsDataSource;
      const localGS = localDataSource as Partial<GoogleSheetsDataSource>;

      return {
        ...globalDataSource,
        ...localDataSource,
        type: 'google-sheets' as const,
        spreadsheetId: localGS.spreadsheetId || globalGS.spreadsheetId,
        sheetName: localGS.sheetName || globalGS.sheetName,
      } as GoogleSheetsDataSource;
    }
    return localDataSource;
  }, [globalDataSource, localDataSource]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const pageSize = safeConfig.pageSize || 10;

  const {
    data: fetchedData,
    loading,
    error,
  } = useGoogleSheetsData({
    dataSource:
      dataSource.type === 'google-sheets'
        ? dataSource
        : { type: 'google-sheets', spreadsheetId: '', sheetName: '', range: '' },
    aggregation: 'none',
  });

  // Build table rows
  const { rows, columns } = useMemo(() => {
    let tableRows: Record<string, unknown>[] = [];
    let tableCols: TableColumnConfig[] = safeConfig.columns || [];

    if (dataSource.type === 'static') {
      // Mock data for static mode
      const mock = MOCK_CHART_DATA.bar;
      tableRows = mock.labels.map((label, i) => ({
        label,
        value: mock.values[i],
      }));

      if (tableCols.length === 0) {
        tableCols = [
          { field: 'label', header: 'Label', formatType: 'text' },
          { field: 'value', header: 'Value', formatType: 'number' },
        ];
      }
    } else if (fetchedData) {
      // Transform chart data format to table rows
      tableRows = fetchedData.labels.map((label, i) => ({
        label,
        value: fetchedData.values[i],
        ...(fetchedData.secondaryValues ? { secondary: fetchedData.secondaryValues[i] } : {}),
      }));

      if (tableCols.length === 0) {
        tableCols = [
          { field: 'label', header: 'Label', formatType: 'text' },
          { field: 'value', header: 'Value', formatType: 'number' },
        ];
      }
    }

    return { rows: tableRows, columns: tableCols };
  }, [dataSource.type, fetchedData, safeConfig.columns]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  if (error && dataSource.type !== 'static') {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-destructive">
        Error: {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        No data available
      </div>
    );
  }

  const processedRows = useMemo(() => {
    let nextRows = [...rows];

    if (safeConfig.searchable && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      nextRows = nextRows.filter((row) =>
        columns.some((column) =>
          String(row[column.field] ?? '')
            .toLowerCase()
            .includes(term)
        )
      );
    }

    if (safeConfig.filterable) {
      const filters = Object.entries(columnFilters).filter(([, value]) => value.trim() !== '');
      if (filters.length > 0) {
        nextRows = nextRows.filter((row) =>
          filters.every(([field, value]) =>
            String(row[field] ?? '')
              .toLowerCase()
              .includes(value.trim().toLowerCase())
          )
        );
      }
    }

    const activeSortColumn = sortField ? columns.find((col) => col.field === sortField) : undefined;
    const canSort = Boolean(activeSortColumn?.sortable ?? safeConfig.sortable);

    if (canSort && sortField) {
      const direction = sortOrder === 'asc' ? 1 : -1;
      nextRows.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const aNumber = Number(aValue);
        const bNumber = Number(bValue);

        if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber)) {
          return (aNumber - bNumber) * direction;
        }

        return String(aValue ?? '').localeCompare(String(bValue ?? '')) * direction;
      });
    }

    return nextRows;
  }, [
    rows,
    columns,
    safeConfig.searchable,
    searchTerm,
    safeConfig.filterable,
    columnFilters,
    safeConfig.sortable,
    sortField,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(processedRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = safeConfig.showPagination
    ? processedRows.slice(startIndex, startIndex + pageSize)
    : processedRows;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Title */}
      {safeConfig.showTitle && safeConfig.title && (
        <div className="px-3 py-2 text-sm font-semibold border-b">
          {safeConfig.title}
        </div>
      )}

      {/* Search */}
      {safeConfig.searchable && (
        <div className="px-3 py-2 border-b">
          <Input
            value={searchTerm}
            onChange={(event) => {
              setCurrentPage(1);
              setSearchTerm(event.target.value);
            }}
            placeholder="Search..."
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table
          className={cn(
            'w-full text-sm',
            safeConfig.bordered && 'border-collapse border border-border',
            safeConfig.compact ? 'text-xs' : ''
          )}
        >
          {/* Header */}
          {(safeConfig.showHeader ?? true) && (
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {columns.map((col, i) => {
                  const canSort = Boolean(col.sortable ?? safeConfig.sortable);

                  return (
                    <th
                      key={i}
                      className={cn(
                        'px-3 py-2 font-medium text-left text-muted-foreground',
                        safeConfig.bordered && 'border border-border',
                        safeConfig.compact && 'px-2 py-1',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        canSort && 'cursor-pointer select-none'
                      )}
                      style={{ width: col.width }}
                      onClick={() => {
                        if (!canSort) return;
                        setCurrentPage(1);
                        setSortField((prev) => {
                          if (prev === col.field) {
                            setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
                            return prev;
                          }
                          setSortOrder('asc');
                          return col.field;
                        });
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                        {canSort && sortField === col.field && (
                          <span className="text-[10px] uppercase">
                            {sortOrder}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
              {safeConfig.filterable && (
                <tr>
                  {columns.map((col, i) => (
                    <th
                      key={`filter-${i}`}
                      className={cn(
                        'px-3 py-2',
                        safeConfig.bordered && 'border border-border',
                        safeConfig.compact && 'px-2 py-1'
                      )}
                    >
                      <Input
                        value={columnFilters[col.field] ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCurrentPage(1);
                          setColumnFilters((prev) => ({ ...prev, [col.field]: value }));
                        }}
                        placeholder="Filter"
                        className="h-7 text-xs"
                      />
                    </th>
                  ))}
                </tr>
              )}
            </thead>
          )}

          {/* Body */}
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b border-border last:border-b-0',
                  safeConfig.striped && rowIndex % 2 === 1 && 'bg-muted/30'
                )}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'px-3 py-2',
                      safeConfig.bordered && 'border border-border',
                      safeConfig.compact && 'px-2 py-1',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {formatCellValue(row[col.field], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {safeConfig.showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              className="px-2 py-1 rounded border disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 rounded border disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
