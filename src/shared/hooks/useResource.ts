import { useCallback, useEffect, useState } from 'react';

import type { RemoteData } from '@/shared/types/remoteData';

export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): { state: RemoteData<T>; reload: () => void } {
  const [state, setState] = useState<RemoteData<T>>({ status: 'idle' });
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
      });

    return () => controller.abort();
  }, [...deps, version]);

  return { state, reload };
}

