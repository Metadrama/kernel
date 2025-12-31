/**
 * Google Sheets Data Hook
 * Fetches and transforms data from Google Sheets for use in components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoogleSheetsDataSource, AggregationType } from '@/types/component-config';

interface UseGoogleSheetsOptions {
  dataSource: GoogleSheetsDataSource;
  aggregation?: AggregationType;
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  showOther?: boolean;
}

interface ChartDataset {
  labels: string[];
  values: number[];
  rawData?: Array<Record<string, unknown>>;
}

interface UseGoogleSheetsResult {
  data: ChartDataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Parse numeric value from string (handles currency formatting)
function parseNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Aggregate values by label
function aggregateData(
  data: Array<{ label: string; value: number }>,
  aggregation: AggregationType
): Map<string, number> {
  const groups = new Map<string, number[]>();

  // Group values by label
  for (const item of data) {
    if (!groups.has(item.label)) {
      groups.set(item.label, []);
    }
    groups.get(item.label)!.push(item.value);
  }

  // Apply aggregation
  const result = new Map<string, number>();

  for (const [label, values] of groups) {
    let aggregatedValue: number;

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'average':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'none':
      default:
        aggregatedValue = values[0] ?? 0;
        break;
    }

    result.set(label, aggregatedValue);
  }

  return result;
}

export function useGoogleSheetsData(options: UseGoogleSheetsOptions): UseGoogleSheetsResult {
  const {
    dataSource,
    aggregation = 'sum',
    sortBy = 'none',
    sortOrder = 'desc',
    limit,
    showOther = false
  } = options;

  const [data, setData] = useState<ChartDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey(k => k + 1);
  }, []);

  // Memoize the config to avoid unnecessary re-fetches
  const configKey = useMemo(() => {
    return JSON.stringify({
      spreadsheetId: dataSource.spreadsheetId,
      sheetName: dataSource.sheetName,
      labelColumn: dataSource.labelColumn,
      valueColumn: dataSource.valueColumn,
      filterColumn: dataSource.filterColumn,
      filterValue: dataSource.filterValue,
      headerRow: dataSource.headerRow,
      dataStartRow: dataSource.dataStartRow,
    });
  }, [dataSource]);

  useEffect(() => {
    const {
      spreadsheetId,
      sheetName,
      labelColumn,
      valueColumn,
      headerRow = 2,
      dataStartRow = 3,
      filterColumn,
      filterValue
    } = dataSource;

    // Validate required fields (labelColumn only needed if mode is 'column' or undefined)
    const mode = dataSource.labelMode || 'column';
    if (!spreadsheetId || !sheetName || !valueColumn || (mode === 'column' && !labelColumn)) {
      setData(null);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Escape sheet name for Google Sheets API (wrap in single quotes if it contains special characters)
        const escapedSheetName = /[^\w]/.test(sheetName) ? `'${sheetName.replace(/'/g, "''")}'` : sheetName;

        // First, fetch headers to get column indices
        const headerRange = `${escapedSheetName}!A${headerRow}:ZZ${headerRow}`;
        const headerResponse = await fetch('/api/sheets/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheet_id: spreadsheetId,
            range: headerRange,
          }),
        });

        const headerData = await headerResponse.json();

        if (!headerData.success || !headerData.data?.[0]) {
          throw new Error('Failed to fetch headers');
        }

        const headers: string[] = headerData.data[0];
        const labelColIndex = mode === 'column' ? headers.findIndex(h => h === labelColumn) : -1;
        const valueColIndex = headers.findIndex(h => h === valueColumn);
        const filterColIndex = filterColumn
          ? headers.findIndex(h => h === filterColumn)
          : -1;

        if (valueColIndex === -1 || (mode === 'column' && labelColIndex === -1)) {
          throw new Error('Could not find specified columns');
        }

        // Fetch data rows
        const dataRange = `${escapedSheetName}!A${dataStartRow}:ZZ`;
        const dataResponse = await fetch('/api/sheets/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheet_id: spreadsheetId,
            range: dataRange,
          }),
        });

        const rowData = await dataResponse.json();

        if (!rowData.success) {
          throw new Error(rowData.error || 'Failed to fetch data');
        }

        if (cancelled) return;

        const rows: string[][] = rowData.data || [];

        // Transform data
        const transformedData: Array<{ label: string; value: number }> = [];

        for (const row of rows) {
          // Determine label
          let label = '';
          if (mode === 'column') {
            label = row[labelColIndex] || '';
          } else if (mode === 'generated' && dataSource.generatedLabels) {
            // We'll generate labels after collecting all values to ensure correct index
            // For now, use placeholder
            label = `__GEN__${transformedData.length}`;
          }

          const value = parseNumericValue(row[valueColIndex]);

          // Skip empty rows (only check label if using column mode)
          if ((mode === 'column' && !label) && value === 0) continue;

          // Apply filter if specified
          if (filterColIndex !== -1 && filterValue) {
            const filterCellValue = row[filterColIndex] || '';
            if (!filterCellValue.toLowerCase().includes(filterValue.toLowerCase())) {
              continue;
            }
          }

          transformedData.push({ label, value });
        }

        // Handle Generated Labels
        if (mode === 'generated' && dataSource.generatedLabels) {
          const { startDate, endDate, interval, mode: genMode = 'step' } = dataSource.generatedLabels;
          const start = new Date(startDate);
          const end = endDate ? new Date(endDate) : new Date();
          const count = transformedData.length;

          if (genMode === 'fit' && count > 1) {
            // Fit Mode: Spread points evenly between start and end
            const totalDuration = end.getTime() - start.getTime();
            const step = totalDuration / (count - 1);

            transformedData.forEach((item, index) => {
              const date = new Date(start.getTime() + (step * index));
              // Smart formatting based on duration
              const daysSpan = totalDuration / (1000 * 60 * 60 * 24);
              if (daysSpan < 365) {
                item.label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              } else {
                item.label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
            });
          } else {
            // Step Mode: Add fixed interval
            transformedData.forEach((item, index) => {
              const date = new Date(start);
              if (interval === 'day') date.setDate(date.getDate() + index);
              else if (interval === 'week') date.setDate(date.getDate() + index * 7);
              else if (interval === 'month') date.setMonth(date.getMonth() + index);
              else if (interval === 'quarter') date.setMonth(date.getMonth() + index * 3);
              else if (interval === 'year') date.setFullYear(date.getFullYear() + index);

              item.label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            });
          }
        }

        // Aggregate data
        const aggregated = aggregateData(transformedData, aggregation);

        // Convert to arrays and sort
        let entries = Array.from(aggregated.entries());

        if (sortBy === 'label') {
          entries.sort((a, b) => {
            const cmp = a[0].localeCompare(b[0]);
            return sortOrder === 'desc' ? -cmp : cmp;
          });
        } else if (sortBy === 'value') {
          entries.sort((a, b) => {
            const cmp = a[1] - b[1];
            return sortOrder === 'desc' ? -cmp : cmp;
          });
        }

        // Apply limit
        let finalLabels: string[];
        let finalValues: number[];

        if (limit && entries.length > limit) {
          const topEntries = entries.slice(0, limit);
          finalLabels = topEntries.map(e => e[0]);
          finalValues = topEntries.map(e => e[1]);

          // Add "Other" category if enabled
          if (showOther) {
            const otherEntries = entries.slice(limit);
            const otherValue = otherEntries.reduce((sum, e) => sum + e[1], 0);
            finalLabels.push('Other');
            finalValues.push(otherValue);
          }
        } else {
          finalLabels = entries.map(e => e[0]);
          finalValues = entries.map(e => e[1]);
        }

        setData({
          labels: finalLabels,
          values: finalValues,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [configKey, aggregation, sortBy, sortOrder, limit, showOther, fetchKey]);

  return { data, loading, error, refetch };
}

// Static mock data for fallback
export const MOCK_CHART_DATA: Record<string, ChartDataset> = {
  line: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    values: [12000, 19000, 15000, 25000, 22000, 30000, 35000],
  },
  bar: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [650, 590, 800, 810, 560, 550, 400],
  },
  doughnut: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    values: [55, 35, 10],
  },
};
