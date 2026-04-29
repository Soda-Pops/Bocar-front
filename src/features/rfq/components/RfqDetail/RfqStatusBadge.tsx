import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';
import type { RfqStatusMeta } from '@/features/rfq/state/rfqStatusMeta';

type RfqStatusBadgeProps = {
  status: RfqStatus;
  meta: RfqStatusMeta;
};

export function RfqStatusBadge({ meta }: RfqStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-[6px] border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em]',
        meta.badgeClass,
      ].join(' ')}
    >
      <span className={['h-[6px] w-[6px] rounded-full', meta.dotClass].join(' ')} />
      {meta.label}
    </span>
  );
}
