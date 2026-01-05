/**
 * Hook for managing saved spreadsheets (links)
 */

import { useState, useEffect, useCallback } from 'react';

export interface SavedSpreadsheet {
  id: string;
  name: string;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseSavedSpreadsheetsReturn {
  savedSpreadsheets: SavedSpreadsheet[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveSpreadsheet: (data: {
    name: string;
    spreadsheetId: string;
    spreadsheetTitle?: string;
    url?: string;
  }) => Promise<SavedSpreadsheet | null>;
  updateSpreadsheet: (id: string, data: Partial<Omit<SavedSpreadsheet, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<SavedSpreadsheet | null>;
  deleteSpreadsheet: (id: string) => Promise<boolean>;
}

export function useSavedSpreadsheets(): UseSavedSpreadsheetsReturn {
  const [savedSpreadsheets, setSavedSpreadsheets] = useState<SavedSpreadsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spreadsheets');
      const data = await response.json();

      if (data.success) {
        setSavedSpreadsheets(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch saved spreadsheets');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSpreadsheet = useCallback(async (data: {
    name: string;
    spreadsheetId: string;
    spreadsheetTitle?: string;
    url?: string;
  }): Promise<SavedSpreadsheet | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await refresh();
        return result.data;
      } else {
        setError(result.error || 'Failed to save spreadsheet');
        return null;
      }
    } catch (err) {
      setError('Failed to connect to API');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const updateSpreadsheet = useCallback(async (
    id: string,
    updates: Partial<Omit<SavedSpreadsheet, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<SavedSpreadsheet | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spreadsheets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        await refresh();
        return result.data;
      } else {
        setError(result.error || 'Failed to update spreadsheet');
        return null;
      }
    } catch (err) {
      setError('Failed to connect to API');
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const deleteSpreadsheet = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spreadsheets/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await refresh();
        return true;
      } else {
        setError(result.error || 'Failed to delete spreadsheet');
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
    savedSpreadsheets,
    loading,
    error,
    refresh,
    saveSpreadsheet,
    updateSpreadsheet,
    deleteSpreadsheet,
  };
}
