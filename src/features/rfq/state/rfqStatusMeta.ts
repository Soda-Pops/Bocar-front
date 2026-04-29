import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';

export type RfqStatusMeta = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

export const rfqStatusMeta: Record<RfqStatus, RfqStatusMeta> = {
  DRAFT: {
    label: 'Borrador',
    badgeClass:
      'border-[rgba(174,179,184,0.36)] bg-[rgba(174,179,184,0.18)] text-[var(--bocar-blue-90)]',
    dotClass: 'bg-[var(--bocar-neutral)]',
  },
  PENDING: {
    label: 'Pendiente asignación',
    badgeClass:
      'border-[rgba(255,242,0,0.5)] bg-[rgba(255,242,0,0.28)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-review)]',
  },
  PENDING_EDIT_REQUEST: {
    label: 'Solicitud de edición',
    badgeClass:
      'border-[rgba(255,242,0,0.5)] bg-[rgba(255,242,0,0.28)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-review)]',
  },
  QUOTING: {
    label: 'En cotización',
    badgeClass:
      'border-[rgba(0,46,93,0.22)] bg-[rgba(0,46,93,0.1)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-blue-100)]',
  },
  PARTIALLY_QUOTED: {
    label: 'Cotizada parcial',
    badgeClass:
      'border-[rgba(255,242,0,0.44)] bg-[rgba(255,242,0,0.2)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[#c8b800]',
  },
  BENCHMARK_READY: {
    label: 'Benchmark listo',
    badgeClass:
      'border-[rgba(141,198,63,0.4)] bg-[rgba(141,198,63,0.24)] text-[#3a6310]',
    dotClass: 'bg-[var(--bocar-done)]',
  },
  EXPIRED: {
    label: 'Vencida',
    badgeClass:
      'border-[rgba(170,0,15,0.26)] bg-[rgba(170,0,15,0.1)] text-[var(--bocar-error)]',
    dotClass: 'bg-[var(--bocar-error)]',
  },
  CLOSED: {
    label: 'Cerrada',
    badgeClass:
      'border-[rgba(174,179,184,0.36)] bg-[rgba(174,179,184,0.18)] text-[var(--bocar-blue-70)]',
    dotClass: 'bg-[var(--bocar-blue-50)]',
  },
  CANCELLED: {
    label: 'Cancelada',
    badgeClass:
      'border-[rgba(170,0,15,0.26)] bg-[rgba(170,0,15,0.1)] text-[var(--bocar-error)]',
    dotClass: 'bg-[var(--bocar-error)]',
  },
};
