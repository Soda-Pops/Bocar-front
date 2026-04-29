import type { RfqDetail } from '@/features/rfq/services/rfqDetailService';
import { RfqStatusBadge } from '@/features/rfq/components/RfqDetail/RfqStatusBadge';
import type { RfqStatusMeta } from '@/features/rfq/state/rfqStatusMeta';
import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';

type RfqStatusHeaderProps = {
  rfq: RfqDetail;
  status: RfqStatus;
  statusMeta: RfqStatusMeta;
};

export function RfqStatusHeader({ rfq, status, statusMeta }: RfqStatusHeaderProps) {
  return (
    <div className="flex flex-col gap-4 bg-[var(--bocar-bg)] px-7 py-6 lg:px-12">
      {/* Title row */}
      <div className="min-w-0">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bocar-blue-50)]">
          Detalle RFQ
        </p>
        <h1 className="m-0 mt-0.5 truncate text-[20px] font-semibold leading-[1.2] tracking-[0.01em] text-[var(--bocar-text)] lg:text-[22px]">
          {rfq.id.toUpperCase()} — {rfq.title}
        </h1>
      </div>

      {/* Meta row: badge + details */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <RfqStatusBadge status={status} meta={statusMeta} />

        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-[12px] text-[var(--bocar-blue-70)]">
            <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">
              Material
            </span>
            {rfq.material}
          </span>
          <span className="text-[12px] text-[var(--bocar-blue-70)]">
            <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">
              Cliente
            </span>
            {rfq.client}
          </span>
          <span className="text-[12px] text-[var(--bocar-blue-70)]">
            <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">
              Creado por
            </span>
            {rfq.createdBy}
          </span>
          <span className="text-[12px] text-[var(--bocar-blue-70)]">
            <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">
              Fecha
            </span>
            {rfq.createdAt}
          </span>
          {rfq.deadline ? (
            <span className="text-[12px] text-[var(--bocar-blue-70)]">
              <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">
                Plazo
              </span>
              {rfq.deadline}
              {rfq.daysRemaining !== undefined ? (
                <span
                  className={[
                    'ml-1.5 inline-flex rounded-[4px] px-1.5 py-[2px] text-[10px] font-semibold',
                    rfq.daysRemaining <= 1
                      ? 'bg-[rgba(170,0,15,0.1)] text-[var(--bocar-error)]'
                      : rfq.daysRemaining <= 3
                        ? 'bg-[rgba(255,242,0,0.3)] text-[var(--bocar-blue-100)]'
                        : 'bg-[rgba(174,179,184,0.18)] text-[var(--bocar-blue-70)]',
                  ].join(' ')}
                >
                  {rfq.daysRemaining}d
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
