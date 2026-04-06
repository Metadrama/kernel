import type { KpiConfig } from '@/types/component-config';

interface KpiComponentProps {
  config?: Record<string, unknown>;
}

function formatMetricValue(value: number, config: Partial<KpiConfig>): string {
  const decimals = typeof config.decimals === 'number' ? config.decimals : 0;
  const formatType = config.formatType || 'number';
  const currencyCode = config.currencyCode || 'USD';

  if (formatType === 'currency') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  if (formatType === 'percent') {
    return `${value.toFixed(decimals)}%`;
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function KpiComponent({ config }: KpiComponentProps) {
  const kpiConfig = (config || {}) as Partial<KpiConfig> & { value?: number };

  const title = kpiConfig.title || 'Metric';
  const rawValue = typeof kpiConfig.value === 'number' ? kpiConfig.value : 0;
  const prefix = kpiConfig.prefix || '';
  const suffix = kpiConfig.suffix || '';
  const valueColor = kpiConfig.valueColor || 'hsl(var(--foreground))';

  const formatted = formatMetricValue(rawValue, kpiConfig);

  return (
    <div className="h-full w-full rounded-md border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold leading-tight" style={{ color: valueColor }}>
        {prefix}{formatted}{suffix}
      </p>
      {kpiConfig.showTrend && (
        <p className="mt-2 text-xs text-muted-foreground">
          Trend enabled
        </p>
      )}
    </div>
  );
}
