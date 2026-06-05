import { listRfqsComercializacion } from '@/features/purchasing/services/comercializacionService';
import { useResource } from '@/shared/hooks/useResource';

export function usePurchasingRfqList() {
  return useResource((signal) => listRfqsComercializacion(signal), []);
}

