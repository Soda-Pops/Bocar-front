import { updateRfq } from '@/features/rfq/services/rfqLifecycleService';
import { useMutation } from '@/shared/hooks/useMutation';

export function useUpdateRfq() {
  return useMutation(updateRfq);
}

