import { fetchDashboardCounts } from '@/features/rfq/services/rfqLifecycleService';
import type { DashboardCountDto } from '@/features/rfq/services/rfqDtos';
import { useResource } from '@/shared/hooks/useResource';

export function usePurchasingDashboardCounts() {
  return useResource((signal) => fetchDashboardCounts(undefined, signal), []);
}

export type PurchasingStatusCounts = NonNullable<DashboardCountDto['estatus']>;
