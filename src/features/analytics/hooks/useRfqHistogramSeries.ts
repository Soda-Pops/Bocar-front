import { fetchDashboardCounts } from '@/features/rfq/services/rfqLifecycleService';
import type { ChartPoint } from '@/features/analytics/types';
import { useResource } from '@/shared/hooks/useResource';

const MONTH_LABELS: Record<string, string> = {
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
  April: 'Apr',
  May: 'May',
  June: 'Jun',
  July: 'Jul',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
};

const MONTH_ORDER = Object.keys(MONTH_LABELS);

function histogramToSeries(histograma: unknown): ChartPoint[] {
  if (!histograma || typeof histograma !== 'object' || Array.isArray(histograma)) {
    return MONTH_ORDER.map((month) => ({ month: MONTH_LABELS[month], value: 0 }));
  }

  const values = histograma as Record<string, unknown>;
  return MONTH_ORDER.map((month) => {
    const value = values[month];
    return {
      month: MONTH_LABELS[month],
      value: typeof value === 'number' && Number.isFinite(value) ? value : 0,
    };
  });
}

export function useRfqHistogramSeries() {
  const resource = useResource((signal) => fetchDashboardCounts(undefined, signal), []);
  const series =
    resource.state.status === 'success'
      ? histogramToSeries(resource.state.data.histograma)
      : histogramToSeries(null);

  return {
    series,
    status: resource.state.status,
    error: resource.state.status === 'error' ? resource.state.error : null,
  };
}
