import { MOCK_CHART_DATA, useGoogleSheetsData } from '@/features/widgets/hooks/useGoogleSheetsChartData';
import type { KpiConfig, GoogleSheetsDataSource } from '@/features/data-sources/types/component-config';
import { useArtboardContext } from '@/core/context/ArtboardContext';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

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
      maximumFractionDigits: 1,
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

interface KpiComponentProps {
  config: KpiConfig;
}

export default function KpiComponent({ config }: KpiComponentProps) {
  const safeConfig = config || { dataSource: { type: 'static' } };

  // Merge Global Data Source
  const { dataSourceConfig: globalDataSource } = useArtboardContext();
  const localDataSource = safeConfig.dataSource || {};

  const dataSource = useMemo(() => {
    if (!globalDataSource) return localDataSource;
    if (localDataSource.type === 'static') return globalDataSource;

    if (globalDataSource.type === 'google-sheets') {
      return {
        ...globalDataSource,
        ...localDataSource,
        type: 'google-sheets' as const,
        spreadsheetId: (globalDataSource as GoogleSheetsDataSource).spreadsheetId,
        sheetName: (globalDataSource as GoogleSheetsDataSource).sheetName,
      };
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
    aggregation: safeConfig.aggregation,
  });

  // Compute the main value
  const { mainValue, trendValue, trendPercent } = useMemo(() => {
    let val = 0;
    let trend: number | null = null;
    let pct: number | null = null;

    if (dataSource.type === 'static') {
      // Mock data for static mode
      const mock = MOCK_CHART_DATA.bar;
      val = mock.values.reduce((a, b) => a + b, 0);
    } else if (fetchedData) {
      // Sum values from hook (aggregation already applied if configured)
      val = fetchedData.values.reduce((a, b) => a + b, 0);

      // If trend is enabled and there's secondary values, compute trend
      if (safeConfig.showTrend && fetchedData.secondaryValues?.length) {
        const compareVal = fetchedData.secondaryValues.reduce((a, b) => a + b, 0);
        trend = val - compareVal;
        pct = compareVal !== 0 ? ((val - compareVal) / Math.abs(compareVal)) * 100 : 0;
      }
    }

    return { mainValue: val, trendValue: trend, trendPercent: pct };
  }, [dataSource.type, fetchedData, safeConfig.showTrend, safeConfig.aggregation]);

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

  // Format the main value
  const formattedValue = formatNumber(mainValue, {
    decimals: safeConfig.decimals ?? 0,
    style:
      safeConfig.formatType === 'currency'
        ? 'currency'
        : safeConfig.formatType === 'percent'
          ? 'percent'
          : 'decimal',
    currency: safeConfig.currencyCode || 'USD',
  });

  // Build display string with prefix/suffix
  const displayValue = `${safeConfig.prefix || ''}${formattedValue}${safeConfig.suffix || ''}`;

  // Trend display
  const showTrendIndicator = safeConfig.showTrend && trendPercent !== null;
  const isUp = (trendValue ?? 0) >= 0;
  const trendColor = isUp
    ? safeConfig.trendUpColor || '#22c55e'
    : safeConfig.trendDownColor || '#ef4444';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      {/* Title */}
      {safeConfig.title && (
        <div className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {safeConfig.title}
        </div>
      )}

      {/* Value */}
      <div
        className="text-3xl font-bold tabular-nums"
        style={{ color: safeConfig.valueColor }}
      >
        {displayValue}
      </div>

      {/* Trend */}
      {showTrendIndicator && (
        <div className="mt-2 flex items-center gap-1 text-sm" style={{ color: trendColor }}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="font-medium">
            {isUp ? '+' : ''}
            {trendPercent?.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
