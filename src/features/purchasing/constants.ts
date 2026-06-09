import type {
  PurchasingDeadlineRange,
  PurchasingMachineType,
  PurchasingPriority,
  PurchasingRfqStatus,
} from '@/features/purchasing/types';

export const purchasingStatusMeta: Record<
  PurchasingRfqStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: 'Draft',
    className: 'border-[rgba(174,179,184,0.3)] bg-[rgba(174,179,184,0.14)] text-[var(--bocar-blue-90)]',
  },
  PENDING: {
    label: 'Pending assignment',
    className: 'border-[rgba(255,242,0,0.34)] bg-[rgba(255,242,0,0.2)] text-[var(--bocar-blue-100)]',
  },
  PENDING_EDIT_REQUEST: {
    label: 'Edit request',
    className: 'border-[rgba(127,143,163,0.3)] bg-[rgba(127,143,163,0.12)] text-[var(--bocar-blue-90)]',
  },
  QUOTING: {
    label: 'In quotation',
    className: 'border-[rgba(31,58,97,0.16)] bg-[rgba(31,58,97,0.08)] text-[var(--bocar-blue-100)]',
  },
  PARTIALLY_QUOTED: {
    label: 'Partially quoted',
    className: 'border-[rgba(255,242,0,0.24)] bg-[rgba(255,242,0,0.16)] text-[var(--bocar-blue-100)]',
  },
  BENCHMARK_READY: {
    label: 'Benchmark ready',
    className: 'border-[rgba(0,120,180,0.35)] bg-[rgba(0,120,180,0.12)] text-[#005f8e]',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]',
  },
  CLOSED: {
    label: 'Closed',
    className: 'border-[rgba(174,179,184,0.24)] bg-[rgba(174,179,184,0.12)] text-[var(--bocar-blue-90)]',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'border-[rgba(170,0,15,0.18)] bg-[rgba(170,0,15,0.05)] text-[var(--bocar-error)]',
  },
};

export const purchasingStatusOptions = (
  Object.entries(purchasingStatusMeta) as Array<[PurchasingRfqStatus, { label: string }]>
).map(([value, meta]) => ({
  label: meta.label,
  value,
}));

export const purchasingPriorityMeta: Record<
  PurchasingPriority,
  {
    className: string;
    rank: number;
  }
> = {
  High: {
    className: 'border-[rgba(170,0,15,0.18)] bg-[rgba(170,0,15,0.06)] text-[var(--bocar-error)]',
    rank: 0,
  },
  Medium: {
    className: 'border-[rgba(255,242,0,0.28)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]',
    rank: 1,
  },
  Low: {
    className: 'border-[rgba(174,179,184,0.28)] bg-[rgba(174,179,184,0.14)] text-[var(--bocar-blue-90)]',
    rank: 2,
  },
};

export const purchasingPriorityOptions: PurchasingPriority[] = ['High', 'Medium', 'Low'];

export const purchasingMachineTypeOptions: PurchasingMachineType[] = [
  'Injection',
  'Stamping',
  'Die Casting',
  'Machining',
  'Assembly',
];

export const purchasingDeadlineRangeOptions: Array<{
  label: string;
  value: PurchasingDeadlineRange;
}> = [
  { label: 'Due today', value: 'TODAY' },
  { label: '<= 48 hours', value: 'WITHIN_48H' },
  { label: 'This week', value: 'THIS_WEEK' },
  { label: 'Later', value: 'LATER' },
];

export function getPurchasingStatusLabel(status: PurchasingRfqStatus) {
  return purchasingStatusMeta[status].label;
}

export function getPriorityRank(priority: PurchasingPriority) {
  return purchasingPriorityMeta[priority].rank;
}

export function getDeadlineUrgencyTone(hoursToDeadline: number) {
  if (hoursToDeadline <= 24) {
    return 'critical';
  }

  if (hoursToDeadline <= 48) {
    return 'warning';
  }

  return 'neutral';
}

export function getDeadlineRange(hoursToDeadline: number): PurchasingDeadlineRange {
  if (hoursToDeadline <= 24) {
    return 'TODAY';
  }

  if (hoursToDeadline <= 48) {
    return 'WITHIN_48H';
  }

  if (hoursToDeadline <= 168) {
    return 'THIS_WEEK';
  }

  return 'LATER';
}

export function formatDeadlineLabel(hoursToDeadline: number) {
  if (hoursToDeadline <= 24) {
    return `Today · ${hoursToDeadline} h`;
  }

  const days = Math.ceil(hoursToDeadline / 24);
  return `${days} d`;
}
