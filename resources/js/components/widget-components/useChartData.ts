
import { useMemo } from 'react';
import { useGoogleSheetsData, MOCK_CHART_DATA } from '@/lib/use-google-sheets';
import type {
    ChartConfig,
    BarChartConfig,
    DoughnutChartConfig,
    GoogleSheetsDataSource
} from '@/types/component-config';

export function useChartData(
    config?: Partial<ChartConfig> & {
        chartType?: 'line' | 'bar' | 'doughnut';
        dataSource?: GoogleSheetsDataSource; // Allow strict typing or partial
    }
) {
    const chartType = config?.chartType || 'line';

    // Check if we should use Google Sheets data
    const dataSource = config?.dataSource;
    const useGoogleSheets = dataSource?.type === 'google-sheets' &&
        (dataSource as GoogleSheetsDataSource).spreadsheetId &&
        (dataSource as GoogleSheetsDataSource).sheetName &&
        (dataSource as GoogleSheetsDataSource).labelColumn &&
        (dataSource as GoogleSheetsDataSource).valueColumn;

    // Fetch Google Sheets data if configured
    const { data: sheetsData, loading, error } = useGoogleSheetsData({
        dataSource: useGoogleSheets
            ? dataSource as GoogleSheetsDataSource
            : { type: 'google-sheets', spreadsheetId: '', sheetName: '', range: '' },
        aggregation: (config as BarChartConfig | DoughnutChartConfig)?.aggregation,
        sortBy: (config as BarChartConfig | DoughnutChartConfig)?.sortBy,
        sortOrder: (config as BarChartConfig | DoughnutChartConfig)?.sortOrder as any,
        limit: (config as BarChartConfig | DoughnutChartConfig)?.limit,
        showOther: (config as DoughnutChartConfig)?.showOther,
    });

    // Determine chart data
    const chartData = useMemo(() => {
        if (useGoogleSheets && sheetsData) {
            return {
                labels: sheetsData.labels,
                values: sheetsData.values,
            };
        }
        // Fall back to mock data
        return MOCK_CHART_DATA[chartType] || MOCK_CHART_DATA.line;
    }, [useGoogleSheets, sheetsData, chartType]);

    return { chartData, loading, error, useGoogleSheets };
}
