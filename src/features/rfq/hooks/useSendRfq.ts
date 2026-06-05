import { sendRfqToCom } from '@/features/rfq/services/rfqLifecycleService';
import { useMutation } from '@/shared/hooks/useMutation';

export function useSendRfq() {
  return useMutation(sendRfqToCom);
}

