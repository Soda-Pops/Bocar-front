import { listRfqsIndustrializacion } from '@/features/rfq/services/rfqLifecycleService';
import { useResource } from '@/shared/hooks/useResource';

export function useRfqList() {
  return useResource((signal) => listRfqsIndustrializacion(signal), []);
}

