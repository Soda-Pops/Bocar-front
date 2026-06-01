import type { StatusValue } from '@/features/rfq/types';

// Not used by active screens yet; reserved for future integration.

type StatusBadgeProps = {
  value: StatusValue;
};

export function RfqStatusBadge({ value }: StatusBadgeProps) {
  const tones: Record<StatusValue, string> = {
    Review: 'border border-amber-200 bg-amber-50 text-amber-700',
    Pending: 'border border-yellow-200 bg-yellow-50 text-yellow-700',
    Done: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[value]}`}
    >
      {value}
    </span>
  );
}
