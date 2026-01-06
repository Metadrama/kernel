/**
 * Google Sheets Data Hook
 * Fetches and transforms data from Google Sheets for use in components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoogleSheetsDataSource, AggregationType } from '@/features/data-sources/types/component-config';

interface UseGoogleSheetsOptions {
  dataSource: GoogleSheetsDataSource;
  aggregation?: AggregationType;
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  showOther?: boolean;
  // For Combo Charts
  secondValueColumn?: string;
}

interface ChartDataset {
  labels: string[];
  values: number[];
  secondaryValues?: number[];
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
  data: Array<{ label: string; value: number; secondaryValue?: number }>,
  aggregation: AggregationType
): { primary: Map<string, number>; secondary: Map<string, number> } {
  const primaryGroups = new Map<string, number[]>();
  const secondaryGroups = new Map<string, number[]>();

  // Group values by label
  for (const item of data) {
    if (!primaryGroups.has(item.label)) {
      primaryGroups.set(item.label, []);
      secondaryGroups.set(item.label, []);
    }
    primaryGroups.get(item.label)!.push(item.value);
    if (item.secondaryValue !== undefined) {
      secondaryGroups.get(item.label)!.push(item.secondaryValue);
    }
  }

  // Apply aggregation helper
  const calculateAgg = (values: number[], agg: AggregationType) => {
    if (values.length === 0) return 0;
    switch (agg) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'count': return values.length;
      case 'average': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return values[0];
    }
  };

  const primaryResult = new Map<string, number>();
  const secondaryResult = new Map<string, number>();

  for (const [label, values] of primaryGroups) {
    primaryResult.set(label, calculateAgg(values, aggregation));

    const secValues = secondaryGroups.get(label) || [];
    if (secValues.length > 0) {
      secondaryResult.set(label, calculateAgg(secValues, aggregation));
    }
  }

  return { primary: primaryResult, secondary: secondaryResult };
}

export function useGoogleSheetsData(options: UseGoogleSheetsOptions): UseGoogleSheetsResult {
  const {
    dataSource,
    aggregation = dataSource.aggregation || 'sum',
    sortBy = 'none',
    sortOrder = 'desc',
    limit,
    showOther = false,
    secondValueColumn
  } = options;

  // Force aggregation to 'sum' if mode is generated and aggregation is 'none' (or undefined)
  // because binning requires aggregation to return a single value per bin.
  const effectiveAggregation = (dataSource.labelMode === 'generated' && (!aggregation || aggregation === 'none'))
    ? 'sum'
    : (aggregation || 'sum');

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
        const secondValueColIndex = secondValueColumn ? headers.findIndex(h => h === secondValueColumn) : -1;

        const dateColIndex = (mode === 'generated' && dataSource.generatedLabels?.useDateColumn)
          ? headers.findIndex(h => h === dataSource.generatedLabels?.useDateColumn)
          : -1;

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
        const transformedData: Array<{ label: string; value: number; secondaryValue?: number; explicitDate?: Date }> = [];

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
          let secondaryValue: number | undefined;
          if (secondValueColIndex !== -1) {
            secondaryValue = parseNumericValue(row[secondValueColIndex]);
          }

          // Skip empty rows (only check label if using column mode)
          if ((mode === 'column' && !label) && value === 0) continue;

          // Apply filter if specified
          if (filterColIndex !== -1 && filterValue) {
            const filterCellValue = row[filterColIndex] || '';
            if (!filterCellValue.toLowerCase().includes(filterValue.toLowerCase())) {
              continue;
            }
          }

          let explicitDate: Date | undefined;
          if (dateColIndex !== -1 && row[dateColIndex]) {
            const d = new Date(row[dateColIndex]);
            if (!isNaN(d.getTime())) explicitDate = d;
          }

          transformedData.push({ label, value, secondaryValue, explicitDate });
        }

        // Handle Generated Labels
        if (mode === 'generated' && dataSource.generatedLabels) {
          const { startDate, endDate, interval, mode: genMode = 'step' } = dataSource.generatedLabels;
          const start = new Date(startDate);
          const end = endDate ? new Date(endDate) : new Date();
          const count = transformedData.length;

          if (genMode === 'fit' && count > 1) {
            if (dataSource.generatedLabels.useDateColumn) {
              // STRICT TIME SERIES MODE
              // 1. Generate empty buckets for the full range
              const buckets: Array<{ label: string; values: number[]; secondaryValues: number[] }> = [];
              const current = new Date(start);

              while (current <= end) {
                let label = '';
                if (interval === 'day') {
                  label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  buckets.push({ label, values: [], secondaryValues: [] });
                  current.setDate(current.getDate() + 1);
                } else if (interval === 'week') {
                  label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  buckets.push({ label, values: [], secondaryValues: [] });
                  current.setDate(current.getDate() + 7);
                } else if (interval === 'month') {
                  label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  buckets.push({ label, values: [], secondaryValues: [] });
                  current.setMonth(current.getMonth() + 1);
                } else if (interval === 'quarter') {
                  label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  buckets.push({ label, values: [], secondaryValues: [] });
                  current.setMonth(current.getMonth() + 3);
                } else { // Year
                  label = current.toLocaleDateString('en-US', { year: 'numeric' });
                  buckets.push({ label, values: [], secondaryValues: [] });
                  current.setFullYear(current.getFullYear() + 1);
                }
              }

              // 2. Distribute data into buckets
              transformedData.forEach(item => {
                if (!item.explicitDate) return;

                // Simple linear search for bucket (optimization: could be binary search)
                // We look for the buckets that this date falls into
                const dateMs = item.explicitDate.getTime();

                // Re-calculate start to ensure alignment
                const rangeStart = start.getTime();
                const dayMs = 86400000;

                let bucketIndex = -1;

                if (interval === 'day') {
                  bucketIndex = Math.floor((dateMs - rangeStart) / dayMs);
                } else if (interval === 'week') {
                  bucketIndex = Math.floor((dateMs - rangeStart) / (dayMs * 7));
                } else if (interval === 'month') {
                  bucketIndex = (item.explicitDate.getFullYear() - start.getFullYear()) * 12 + (item.explicitDate.getMonth() - start.getMonth());
                } else if (interval === 'quarter') {
                  bucketIndex = Math.floor(((item.explicitDate.getFullYear() - start.getFullYear()) * 12 + (item.explicitDate.getMonth() - start.getMonth())) / 3);
                } else if (interval === 'year') {
                  bucketIndex = item.explicitDate.getFullYear() - start.getFullYear();
                }

                if (bucketIndex >= 0 && bucketIndex < buckets.length) {
                  buckets[bucketIndex].values.push(item.value);
                  if (item.secondaryValue !== undefined) {
                    buckets[bucketIndex].secondaryValues.push(item.secondaryValue);
                  }
                }
              });

              // 3. Flatten for aggregation
              // We replace transformedData with our bucketed data
              // The main aggregation function will handle sum/avg/etc.
              transformedData.length = 0; // Clear original
              buckets.forEach(b => {
                // pre-aggregate here or let main aggregator handle it?
                // Main aggregator expects { label, value }.
                // If we have multiple values per bucket, we should emit multiple rows with same label
                // so the main aggregateData function can do its job (sum/avg/count)
                if (b.values.length > 0) {
                  b.values.forEach((v, i) => {
                    transformedData.push({
                      label: b.label,
                      value: v,
                      secondaryValue: b.secondaryValues[i]
                    });
                  });
                } else {
                  // Important: Ensure empty buckets appear with 0 value for valid trend line
                  transformedData.push({ label: b.label, value: 0 });
                }
              });

            } else {
              // LINEAR FIT MODE (Fallback / Original)
              let bucketCount = 12; // Default to months

              // Calculate buckets based on interval default
              const durationMs = end.getTime() - start.getTime();
              const dayMs = 1000 * 60 * 60 * 24;

              if (interval === 'day') bucketCount = Math.max(1, Math.ceil(durationMs / dayMs));
              else if (interval === 'week') bucketCount = Math.max(1, Math.ceil(durationMs / (dayMs * 7)));
              else if (interval === 'month') bucketCount = Math.max(1, Math.ceil(durationMs / (dayMs * 30)));
              else if (interval === 'quarter') bucketCount = Math.max(1, Math.ceil(durationMs / (dayMs * 90)));
              else if (interval === 'year') bucketCount = Math.max(1, Math.ceil(durationMs / (dayMs * 365)));

              const itemsPerBucket = count / bucketCount;

              transformedData.forEach((item, index) => {
                // Determine which bucket this index falls into
                const bucketIndex = Math.floor(index / itemsPerBucket);

                // Calculate date for this bucket
                // Use Start + (BucketIndex * Duration/Buckets)
                const date = new Date(start.getTime() + (bucketIndex * (durationMs / bucketCount)));

                // Format label - this will group them for aggregation later
                // Only show Year for long spans, Month/Day for shorter
                if (interval === 'day' || (interval === 'week' && durationMs < dayMs * 60)) {
                  item.label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                  item.label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
              });
            }
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
        const { primary, secondary } = aggregateData(transformedData, effectiveAggregation);

        // Convert to arrays and sort (using primary value)
        const entries = Array.from(primary.entries());

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
        let finalSecondaryValues: number[] | undefined;

        if (secondary.size > 0) {
          finalSecondaryValues = [];
        }

        if (limit && entries.length > limit) {
          const topEntries = entries.slice(0, limit);
          finalLabels = topEntries.map(e => e[0]);
          finalValues = topEntries.map(e => e[1]);

          if (finalSecondaryValues) {
            finalSecondaryValues = topEntries.map(e => secondary.get(e[0]) ?? 0);
          }

          // Add "Other" category if enabled
          if (showOther) {
            const otherEntries = entries.slice(limit);
            const otherValue = otherEntries.reduce((sum, e) => sum + e[1], 0);
            finalLabels.push('Other');
            finalValues.push(otherValue);

            if (finalSecondaryValues) {
              // Aggregation for secondary "Other" is complex, assume sum for now
              const otherSec = otherEntries.reduce((sum, e) => sum + (secondary.get(e[0]) ?? 0), 0);
              finalSecondaryValues.push(otherSec);
            }
          }
        } else {
          finalLabels = entries.map(e => e[0]);
          finalValues = entries.map(e => e[1]);
          if (finalSecondaryValues) {
            finalSecondaryValues = entries.map(e => secondary.get(e[0]) ?? 0);
          }
        }

        setData({
          labels: finalLabels,
          values: finalValues,
          secondaryValues: finalSecondaryValues
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
  }, [configKey, effectiveAggregation, sortBy, sortOrder, limit, showOther, secondValueColumn, fetchKey]);

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

