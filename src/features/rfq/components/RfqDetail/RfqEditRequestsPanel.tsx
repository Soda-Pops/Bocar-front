import { useEffect, useState } from 'react';

import { listEditRequests, approveEdit, rejectEdit } from '@/features/purchasing/services/comercializacionService';
import { extractApiError } from '@/shared/utils/extractApiError';
import type { EditRequestItem } from '@/features/purchasing/services/comercializacionService';
import type { RfqTipo } from '@/features/analytics/types';

type Props = {
  rfqNumericId: number;
  tipo: RfqTipo;
  onResolved?: () => void;
};

type MutState = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string };

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function RfqEditRequestsPanel({ rfqNumericId, tipo, onResolved }: Props) {
  const [items, setItems] = useState<EditRequestItem[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'done' | 'error'>('loading');
  const [mut, setMut] = useState<MutState>({ status: 'idle', message: '' });

  useEffect(() => {
    const ac = new AbortController();
    setLoadState('loading');
    listEditRequests(ac.signal)
      .then((all) => {
        const filtered = all.filter(
          (r) => r.rfqId === rfqNumericId && r.rfqTipo === tipo,
        );
        setItems(filtered);
        setLoadState('done');
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setLoadState('error');
      });
    return () => ac.abort();
  }, [rfqNumericId, tipo]);

  // Don't render anything while loading or if there are no requests
  if (loadState === 'loading') return null;
  if (loadState === 'error') return null;
  if (items.length === 0) return null;

  const item = items[0]; // show the most recent pending request (list is sorted desc)
  const isSubmitting = mut.status === 'submitting';
  const isDone = mut.status === 'success' || mut.status === 'error';

  async function handleApprove() {
    setMut({ status: 'submitting', message: '' });
    try {
      await approveEdit(tipo, item.id);
      setMut({ status: 'success', message: 'Solicitud aprobada. El RFQ volvió a Industrialización.' });
      onResolved?.();
    } catch (err) {
      setMut({
        status: 'error',
        message: extractApiError(err),
      });
    }
  }

  async function handleReject() {
    setMut({ status: 'submitting', message: '' });
    try {
      await rejectEdit(tipo, item.id);
      setMut({ status: 'success', message: 'Solicitud rechazada. El RFQ permanece en Comercialización.' });
      onResolved?.();
    } catch (err) {
      setMut({
        status: 'error',
        message: extractApiError(err),
      });
    }
  }

  return (
    <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">
          Solicitud de edición pendiente
        </h2>
        <span className="inline-flex items-center rounded-[4px] bg-[rgba(255,242,0,0.2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#7a6e00]">
          Pendiente de resolución
        </span>
      </div>

      {/* Card */}
      <div className="mt-4 overflow-hidden rounded-[8px] border border-[rgba(200,184,0,0.36)] bg-[rgba(255,242,0,0.06)]">
        <div className="px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">

            {/* Solicitante + fecha */}
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">
                Solicitado por
              </p>
              <p className="m-0 mt-1 text-[13px] font-medium text-[var(--bocar-text)]">
                {item.requestedByName}
              </p>
              <p className="m-0 mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">
                {formatDateTime(item.requestedAt)}
              </p>
            </div>

            {/* Motivo */}
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">
                Motivo
              </p>
              <p className="m-0 mt-1 text-[13px] leading-[1.55] text-[var(--bocar-text)]">
                {item.reason}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-start justify-center gap-2 sm:items-end">
              {isDone ? (
                <p
                  className={[
                    'text-[12px] font-medium leading-[1.45]',
                    mut.status === 'success' ? 'text-[#3a6310]' : 'text-[var(--bocar-error)]',
                  ].join(' ')}
                >
                  {mut.message}
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleApprove()}
                    className="w-full rounded-[6px] border border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[var(--bocar-blue-90)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? 'Procesando...' : 'Aprobar'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleReject()}
                    className="w-full rounded-[6px] border border-[rgba(170,0,15,0.45)] bg-white px-4 py-2 text-[12px] font-semibold text-[var(--bocar-error)] transition hover:bg-[rgba(170,0,15,0.06)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? 'Procesando...' : 'Rechazar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
