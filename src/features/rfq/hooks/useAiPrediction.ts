import { useCallback, useEffect, useState } from 'react';

import type { RfqDetail } from '@/features/rfq/services/rfqDetailService';
import type { AiPredictionResponse } from '@/features/rfq/services/iaPredictionService';
import { fetchAiPredictions } from '@/features/rfq/services/iaPredictionService';
import type { RemoteData } from '@/shared/types/remoteData';

export function useAiPrediction(
  detail: RfqDetail | null,
  enabled: boolean,
): { state: RemoteData<AiPredictionResponse>; retry: () => void } {
  const [state, setState] = useState<RemoteData<AiPredictionResponse>>({ status: 'idle' });
  const [version, setVersion] = useState(0);

  const retry = useCallback(() => setVersion((current) => current + 1), []);
  const input = enabled ? detail?.predictionInput : undefined;

  useEffect(() => {
    if (!input) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchAiPredictions(input, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
      });

    return () => controller.abort();
  }, [input, version]);

  return { state, retry };
}
