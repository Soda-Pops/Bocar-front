import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { useSolicitudesEdicion } from '@/features/purchasing/hooks/useSolicitudesEdicion';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { formatId } from '@/shared/utils/rfqId';

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M10.5 3.5L6 8L10.5 12.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
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

function UnlockRequestsPage() {
  const navigate = useNavigate();
  const { state, mutations, approve, reject } = useSolicitudesEdicion();

  return (
    <MainLayout header={<Header areaLabel="Purchasing — Solicitudes" />}>
      <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 pb-10 pt-8 sm:px-8 xl:px-0">

        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.01em] text-[var(--bocar-text)]">
              Pending Edit Requests
            </h1>
            <p className="m-0 mt-1.5 text-[13px] text-[var(--bocar-blue-70)]">
              Edit requests from Industrialization to return an RFQ for corrections. Must be resolved before assigning suppliers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full px-0 py-2 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-70)]"
          >
            <BackArrowIcon />
            Back
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">

          {/* Loading */}
          {state.status === 'loading' ? (
            <div className="rounded-[8px] border border-[var(--bocar-border)] bg-white px-7 py-8 text-[13px] text-[var(--bocar-blue-70)]">
              Loading requests...
            </div>
          ) : null}

          {/* Error */}
          {state.status === 'error' ? (
            <div
              role="alert"
              className="rounded-[8px] border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.07)] px-7 py-6 text-[13px] text-[var(--bocar-error)]"
            >
              {state.error}
            </div>
          ) : null}

          {/* Empty */}
          {state.status === 'success' && state.items.length === 0 ? (
            <div className="rounded-[8px] border border-[var(--bocar-border)] bg-white px-7 py-10 text-center">
              <p className="m-0 text-[14px] font-semibold text-[var(--bocar-text)]">
                No pending requests
              </p>
              <p className="m-0 mt-1 text-[13px] text-[var(--bocar-blue-70)]">
                There are no active edit requests at this time.
              </p>
            </div>
          ) : null}

          {/* List */}
          {state.status === 'success' && state.items.length > 0 ? (
            <div className="overflow-hidden rounded-[8px] border border-[var(--bocar-border)] bg-white">

              {/* Table header — desktop */}
              <div className="hidden border-b border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-6 py-3 sm:grid sm:grid-cols-[auto_1fr_1fr_180px] sm:gap-4">
                {['RFQ', 'Requester / Date', 'Reason', 'Actions'].map((h) => (
                  <span key={h} className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">
                    {h}
                  </span>
                ))}
              </div>

              {state.items.map((item, idx) => {
                const mut = mutations[item.id];
                const isSubmitting = mut?.status === 'submitting';
                const isDone = mut?.status === 'success' || mut?.status === 'error';

                return (
                  <article
                    key={item.id}
                    className={[
                      'border-b border-[rgba(217,222,229,0.6)] px-6 py-5 last:border-b-0',
                      'sm:grid sm:grid-cols-[auto_1fr_1fr_180px] sm:items-center sm:gap-4',
                      idx % 2 === 0 ? 'bg-white' : 'bg-[rgba(245,247,250,0.5)]',
                    ].join(' ')}
                  >
                    {/* RFQ ID + tipo */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `${ROUTES.PURCHASING.RFQ_DETAIL_FULL.replace(':id', String(item.rfqId))}?tipo=${item.rfqTipo}`,
                          )
                        }
                        className="text-left text-[13px] font-semibold text-[var(--bocar-blue-100)] underline-offset-2 hover:underline"
                      >
                        {formatId(item.rfqId)}
                      </button>
                      <span className="inline-flex w-fit items-center rounded-[4px] border border-[rgba(0,46,93,0.2)] bg-[rgba(0,46,93,0.07)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-70)]">
                        {item.rfqTipo}
                      </span>
                    </div>

                    {/* Solicitante + fecha */}
                    <div className="mt-3 sm:mt-0">
                      <p className="m-0 text-[13px] font-medium text-[var(--bocar-text)]">
                        {item.requestedByName}
                      </p>
                      <p className="m-0 mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">
                        {formatDateTime(item.requestedAt)}
                      </p>
                    </div>

                    {/* Motivo */}
                    <div className="mt-2 sm:mt-0">
                      <p className="m-0 text-[13px] leading-[1.5] text-[var(--bocar-blue-70)]">
                        {item.reason}
                      </p>
                    </div>

                    {/* Acciones / feedback */}
                    <div className="mt-4 sm:mt-0">
                      {isDone ? (
                        <p
                          className={[
                            'text-[12px] font-medium leading-[1.45]',
                            mut.status === 'success'
                              ? 'text-[#3a6310]'
                              : 'text-[var(--bocar-error)]',
                          ].join(' ')}
                        >
                          {mut.message}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void approve(item.id, item.rfqTipo)}
                            className="rounded-[6px] border border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[var(--bocar-blue-90)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmitting ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void reject(item.id, item.rfqTipo)}
                            className="rounded-[6px] border border-[rgba(170,0,15,0.45)] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[var(--bocar-error)] transition hover:bg-[rgba(170,0,15,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmitting ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

        </div>
      </div>
    </MainLayout>
  );
}

export default UnlockRequestsPage;
