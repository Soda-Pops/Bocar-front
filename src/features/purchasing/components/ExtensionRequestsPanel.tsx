import { useEffect, useMemo, useState } from 'react';

import {
  resolverExtension,
  type ExtensionRequestItem,
} from '@/features/purchasing/services/comercializacionService';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatDateForDisplay } from '@/shared/utils/deadline';
import { extractApiError } from '@/shared/utils/extractApiError';
import { formatId } from '@/shared/utils/rfqId';

type ExtensionRequestsPanelProps = {
  requests: ExtensionRequestItem[];
  isLoading?: boolean;
  /** Recarga la lista tras aprobar/rechazar una solicitud. */
  onResolved: () => void;
  pageSize?: number;
};

/**
 * Panel del dashboard de Compras para revisar las solicitudes de extensión de
 * plazo enviadas por proveedores. Cualquier usuario de Compras (role='Com')
 * puede aprobarlas o rechazarlas; al aprobar, el backend reabre la asignación
 * con la nueva fecha propuesta.
 */
export function ExtensionRequestsPanel({
  requests,
  isLoading = false,
  onResolved,
  pageSize = 2,
}: ExtensionRequestsPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const visibleRequests = useMemo(
    () => requests.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [requests, currentPage, pageSize],
  );

  async function resolve(req: ExtensionRequestItem, status: 'Aprobada' | 'Rechazada') {
    setPendingId(req.id);
    setError(null);
    try {
      const tipo = req.rfqTipo === 'Mold' ? 'Mold' : 'Trimming';
      await resolverExtension(tipo, req.id, status);
      onResolved();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="flex flex-col rounded-[14px] border border-[var(--bocar-border)] bg-white p-5 shadow-[0_10px_24px_rgba(0,46,93,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.07em] text-[var(--bocar-text)]">
            PENDING UNLOCK REQUESTS
          </h2>
          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">
            Deadline extension requests received from suppliers.
          </p>
        </div>
        {!isLoading && requests.length > 0 ? (
          <span className="shrink-0 rounded-full bg-[var(--bocar-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bocar-blue-70)]">
            {requests.length}
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-[6px] border border-[rgba(170,0,15,0.24)] bg-[rgba(170,0,15,0.07)] px-4 py-2.5 text-[12px] text-[var(--bocar-error)]"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid flex-1 gap-3">
        {isLoading ? (
          <p className="m-0 text-[13px] text-[var(--bocar-blue-50)]">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="m-0 text-[13px] text-[var(--bocar-blue-50)]">No pending unlock requests.</p>
        ) : (
          visibleRequests.map((req) => {
            const isBusy = pendingId === req.id;
            return (
              <article
                key={`${req.rfqTipo}-${req.id}`}
                className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                    {req.rfqId > 0 ? formatId(req.rfqId) : req.rfqNombre}
                  </p>
                  <span className="shrink-0 rounded-full border border-[rgba(217,222,229,0.9)] bg-[var(--bocar-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--bocar-blue-90)]">
                    {req.rfqTipo}
                  </span>
                </div>
                <p className="m-0 mt-1 text-[12px] text-[var(--bocar-text)]">
                  {req.proveedorNombre} requests to reopen their assignment.
                </p>
                {req.motivo ? (
                  <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">Reason: {req.motivo}</p>
                ) : null}
                <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                  {formatDateForDisplay(req.dueDateActual)} → {formatDateForDisplay(req.nuevaFecha)}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void resolve(req, 'Aprobada')}
                    className="inline-flex h-8 items-center rounded-[8px] border border-[#4a7a10] bg-[#4a7a10] px-3 text-[12px] font-semibold text-white transition hover:bg-[#3f6a0e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBusy ? 'Working...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void resolve(req, 'Rechazada')}
                    className="inline-flex h-8 items-center rounded-[8px] border border-[rgba(170,0,15,0.4)] bg-white px-3 text-[12px] font-semibold text-[var(--bocar-error)] transition hover:bg-[rgba(170,0,15,0.07)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {!isLoading && requests.length > pageSize ? (
        <div className="mt-2 border-t border-[var(--bocar-border)]">
          <TablePagination
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            visibleCount={visibleRequests.length}
            totalCount={requests.length}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}
    </section>
  );
}
