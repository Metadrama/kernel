/**
 * Hook for managing saved data sources
 */

import { useState, useEffect, useCallback } from 'react';
import type { SavedDataSource, GoogleSheetsDataSource, ApiDataSource } from '@/features/data-sources/types/component-config';

interface UseSavedDataSourcesReturn {
  savedSources: SavedDataSource[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveDataSource: (name: string, type: 'google-sheets' | 'api', config: Omit<GoogleSheetsDataSource, 'type'> | Omit<ApiDataSource, 'type'>, sourceChartType?: string) => Promise<SavedDataSource | null>;
  updateDataSource: (id: string, data: Partial<Omit<SavedDataSource, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<SavedDataSource | null>;
  deleteDataSource: (id: string) => Promise<boolean>;
}

export function useSavedDataSources(): UseSavedDataSourcesReturn {
  const [savedSources, setSavedSources] = useState<SavedDataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data-sources');
      const data = await response.json();

      if (data.success) {
        setSavedSources(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch saved data sources');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDataSource = useCallback(async (
    name: string,
    type: 'google-sheets' | 'api',
    config: Omit<GoogleSheetsDataSource, 'type'> | Omit<ApiDataSource, 'type'>,
    sourceChartType?: string
  ): Promise<SavedDataSource | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, config, sourceChartType }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        await refresh();
        return data.data;
      } else {
        setError(data.error || 'Failed to save data source');
        return null;
      }
    } catch (err) {
      setError('Failed to connect to API');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const updateDataSource = useCallback(async (
    id: string,
    updates: Partial<Omit<SavedDataSource, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<SavedDataSource | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/data-sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        await refresh();
        return data.data;
      } else {
        setError(data.error || 'Failed to update data source');
        return null;
      }
    } catch (err) {
      setError('Failed to connect to API');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const deleteDataSource = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/data-sources/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await refresh();
        return true;
      } else {
        setError(data.error || 'Failed to delete data source');
        return false;
      }
    } catch (err) {
      setError('Failed to connect to API');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    savedSources,
    loading,
    error,
    refresh,
    saveDataSource,
    updateDataSource,
    deleteDataSource,
  };
}

