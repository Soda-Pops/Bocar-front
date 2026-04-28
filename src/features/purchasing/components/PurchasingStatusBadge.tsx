import { purchasingStatusMeta } from '@/features/purchasing/constants';
import type { PurchasingRfqStatus } from '@/features/purchasing/types';

type PurchasingStatusBadgeProps = {
  status: PurchasingRfqStatus;
};

export function PurchasingStatusBadge({ status }: PurchasingStatusBadgeProps) {
  const meta = purchasingStatusMeta[status];

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.01em]',
        meta.className,
      ].join(' ')}
    >
      {meta.label}
    </span>
  );
}
