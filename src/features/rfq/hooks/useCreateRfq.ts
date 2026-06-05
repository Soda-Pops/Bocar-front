import { createRfq } from '@/features/rfq/services/rfqLifecycleService';
import { useMutation } from '@/shared/hooks/useMutation';

export function useCreateRfq() {
  return useMutation(createRfq);
}

