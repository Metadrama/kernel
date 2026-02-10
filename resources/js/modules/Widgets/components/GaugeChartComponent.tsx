import { MOCK_CHART_DATA, useGoogleSheetsData } from '@/modules/Widgets/hooks/useGoogleSheetsChartData';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import type { GaugeChartConfig, GoogleSheetsDataSource } from '@/modules/DataLayer/types/component-config';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Cell, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(
  value: number,
  options?: {
    compact?: boolean;
    decimals?: number;
    style?: 'currency' | 'percent' | 'decimal';
    currency?: string;
  }
): string {
  const { compact = false, decimals = 0, style = 'decimal', currency = 'USD' } = options || {};

  if (style === 'percent') {
    return (
      new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value) + '%'
    );
  }

  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      style: style === 'currency' ? 'currency' : 'decimal',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: style === 'currency' ? 'currency' : 'decimal',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// ============================================================================
// Component
// ============================================================================

interface GaugeChartComponentProps {
  config: GaugeChartConfig;
}

export default function GaugeChartComponent({ config }: GaugeChartComponentProps) {
  const safeConfig = config || { dataSource: { type: 'static' } };

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

  const {
    data: fetchedData,
    loading,
    error,
  } = useGoogleSheetsData({
    dataSource:
      dataSource.type === 'google-sheets'
        ? dataSource
        : { type: 'google-sheets', spreadsheetId: '', sheetName: '', range: '' },
    aggregation: safeConfig.aggregation || 'sum',
  });

  // Compute the gauge value
  const gaugeValue = useMemo(() => {
    if (dataSource.type === 'static') {
      const mock = MOCK_CHART_DATA.bar;
      return mock.values.reduce((a, b) => a + b, 0);
    }
    if (fetchedData) {
      return fetchedData.values.reduce((a, b) => a + b, 0);
    }
    return 0;
  }, [dataSource.type, fetchedData]);

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

  const min = safeConfig.min ?? 0;
  const max = safeConfig.max ?? Math.max(gaugeValue * 1.2, 100);
  const clampedValue = Math.max(min, Math.min(max, gaugeValue));
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  const primaryColor = safeConfig.colors?.primary || '#3b82f6';
  const trackColor = safeConfig.colors?.track || '#e5e7eb';

  // Data for RadialBarChart (background track + value bar)
  const data = [
    { name: 'track', value: 100, fill: trackColor },
    { name: 'value', value: percentage, fill: primaryColor },
  ];

  // Format value for display
  const formattedValue = formatNumber(gaugeValue, {
    compact: true,
    style:
      safeConfig.formatType === 'currency'
        ? 'currency'
        : safeConfig.formatType === 'percent'
          ? 'percent'
          : 'decimal',
    currency: safeConfig.currencyCode || 'USD',
  });

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <RadialBarChart
          cx="50%"
          cy="70%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={16}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar dataKey="value" cornerRadius={8} background={false} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {safeConfig.showValue !== false && (
          <div className="text-2xl font-bold tabular-nums">{formattedValue}</div>
        )}
        {safeConfig.showLabel !== false && safeConfig.label && (
          <div className="text-xs text-muted-foreground mt-1">{safeConfig.label}</div>
        )}
      </div>
    </div>
  );
}
