import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';

export type RfqStatusMeta = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

export const rfqStatusMeta: Record<RfqStatus, RfqStatusMeta> = {
  DRAFT: {
    label: 'Draft',
    badgeClass:
      'border-[rgba(174,179,184,0.36)] bg-[rgba(174,179,184,0.18)] text-[var(--bocar-blue-90)]',
    dotClass: 'bg-[var(--bocar-neutral)]',
  },
  PENDING: {
    label: 'Pending assignment',
    badgeClass:
      'border-[rgba(255,242,0,0.5)] bg-[rgba(255,242,0,0.28)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-review)]',
  },
  PENDING_EDIT_REQUEST: {
    label: 'Edit request',
    badgeClass:
      'border-[rgba(255,242,0,0.5)] bg-[rgba(255,242,0,0.28)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-review)]',
  },
  QUOTING: {
    label: 'In quotation',
    badgeClass:
      'border-[rgba(0,46,93,0.22)] bg-[rgba(0,46,93,0.1)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-blue-100)]',
  },
  PARTIALLY_QUOTED: {
    label: 'Partially quoted',
    badgeClass:
      'border-[rgba(255,242,0,0.44)] bg-[rgba(255,242,0,0.2)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[#c8b800]',
  },
  ANSWERED: {
    label: 'Answered',
    badgeClass:
      'border-[rgba(141,198,63,0.4)] bg-[rgba(141,198,63,0.24)] text-[#3a6310]',
    dotClass: 'bg-[var(--bocar-done)]',
  },
  BENCHMARK_READY: {
    label: 'Benchmark ready',
    badgeClass:
      'border-[rgba(0,120,180,0.35)] bg-[rgba(0,120,180,0.12)] text-[#005f8e]',
    dotClass: 'bg-[#0078b4]',
  },
  EXPIRED: {
    label: 'Expired',
    badgeClass:
      'border-[rgba(170,0,15,0.26)] bg-[rgba(170,0,15,0.1)] text-[var(--bocar-error)]',
    dotClass: 'bg-[var(--bocar-error)]',
  },
  CLOSED: {
    label: 'Closed',
    badgeClass:
      'border-[rgba(174,179,184,0.36)] bg-[rgba(174,179,184,0.18)] text-[var(--bocar-blue-70)]',
    dotClass: 'bg-[var(--bocar-blue-50)]',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass:
      'border-[rgba(170,0,15,0.26)] bg-[rgba(170,0,15,0.1)] text-[var(--bocar-error)]',
    dotClass: 'bg-[var(--bocar-error)]',
  },
};
