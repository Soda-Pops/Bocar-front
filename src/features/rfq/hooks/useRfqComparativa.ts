import type { RfqTipo } from '@/features/analytics/types';
import { getRfqComparativa } from '@/features/rfq/services/rfqComparativaService';
import { useResource } from '@/shared/hooks/useResource';

export function useRfqComparativa(tipo: RfqTipo, rfqId: number) {
  return useResource((signal) => getRfqComparativa(tipo, rfqId, signal), [tipo, rfqId]);
}
