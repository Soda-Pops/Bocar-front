import { useCallback, useEffect, useState } from 'react';

import { approveEdit, listEditRequests, rejectEdit } from '@/features/purchasing/services/comercializacionService';
import { extractApiError } from '@/shared/utils/extractApiError';
import type { EditRequestItem } from '@/features/purchasing/services/comercializacionService';
import type { RfqTipo } from '@/features/analytics/types';

type State =
  | { status: 'loading' }
  | { status: 'success'; items: EditRequestItem[] }
  | { status: 'error'; error: string };

type MutationResult = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string };

export function useSolicitudesEdicion() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [mutations, setMutations] = useState<Record<number, MutationResult>>({});

  const load = useCallback((signal?: AbortSignal) => {
    setState({ status: 'loading' });
    listEditRequests(signal)
      .then((items) => setState({ status: 'success', items }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({
          status: 'error',
          error: extractApiError(err),
        });
      });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  function setMutation(id: number, result: MutationResult) {
    setMutations((prev) => ({ ...prev, [id]: result }));
  }

  async function approve(id: number, tipo: RfqTipo) {
    setMutation(id, { status: 'submitting', message: '' });
    try {
      await approveEdit(tipo, id);
      setMutation(id, { status: 'success', message: 'Approved. RFQ returned to Industrialization.' });
      // Remove from list after brief delay
      setTimeout(() => {
        setState((prev) =>
          prev.status === 'success'
            ? { ...prev, items: prev.items.filter((r) => r.id !== id) }
            : prev,
        );
      }, 1800);
    } catch (err) {
      setMutation(id, {
        status: 'error',
        message: extractApiError(err),
      });
    }
  }

  async function reject(id: number, tipo: RfqTipo) {
    setMutation(id, { status: 'submitting', message: '' });
    try {
      await rejectEdit(tipo, id);
      setMutation(id, { status: 'success', message: 'Rejected. RFQ remains in Purchasing.' });
      setTimeout(() => {
        setState((prev) =>
          prev.status === 'success'
            ? { ...prev, items: prev.items.filter((r) => r.id !== id) }
            : prev,
        );
      }, 1800);
    } catch (err) {
      setMutation(id, {
        status: 'error',
        message: extractApiError(err),
      });
    }
  }

  return { state, mutations, approve, reject };
}
