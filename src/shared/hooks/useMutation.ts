import { useCallback, useState } from 'react';

type MutationState<T> =
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'submitting'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

export function useMutation<TArgs extends unknown[], TResult>(
  mutateFn: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<MutationState<TResult>>({ status: 'idle' });

  const mutate = useCallback(
    async (...args: TArgs) => {
      setState({ status: 'submitting' });
      try {
        const data = await mutateFn(...args);
        setState({ status: 'success', data });
        return data;
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', error: normalized });
        throw normalized;
      }
    },
    [mutateFn],
  );

  return { mutate, state, isSubmitting: state.status === 'submitting' };
}

