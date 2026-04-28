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
    label: 'Borrador',
    className: 'border-[rgba(174,179,184,0.3)] bg-[rgba(174,179,184,0.14)] text-[var(--bocar-blue-90)]',
  },
  PENDING: {
    label: 'Pendiente asignacion',
    className: 'border-[rgba(255,242,0,0.34)] bg-[rgba(255,242,0,0.2)] text-[var(--bocar-blue-100)]',
  },
  PENDING_EDIT_REQUEST: {
    label: 'Solicitud de edicion',
    className: 'border-[rgba(127,143,163,0.3)] bg-[rgba(127,143,163,0.12)] text-[var(--bocar-blue-90)]',
  },
  QUOTING: {
    label: 'En cotizacion',
    className: 'border-[rgba(31,58,97,0.16)] bg-[rgba(31,58,97,0.08)] text-[var(--bocar-blue-100)]',
  },
  PARTIALLY_QUOTED: {
    label: 'Cotizada parcial',
    className: 'border-[rgba(255,242,0,0.24)] bg-[rgba(255,242,0,0.16)] text-[var(--bocar-blue-100)]',
  },
  BENCHMARK_READY: {
    label: 'Benchmark listo',
    className: 'border-[rgba(141,198,63,0.28)] bg-[rgba(141,198,63,0.18)] text-[var(--bocar-blue-100)]',
  },
  EXPIRED: {
    label: 'Vencida',
    className: 'border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]',
  },
  CLOSED: {
    label: 'Cerrada',
    className: 'border-[rgba(174,179,184,0.24)] bg-[rgba(174,179,184,0.12)] text-[var(--bocar-blue-90)]',
  },
  CANCELLED: {
    label: 'Cancelada',
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
  Alta: {
    className: 'border-[rgba(170,0,15,0.18)] bg-[rgba(170,0,15,0.06)] text-[var(--bocar-error)]',
    rank: 0,
  },
  Media: {
    className: 'border-[rgba(255,242,0,0.28)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]',
    rank: 1,
  },
  Baja: {
    className: 'border-[rgba(174,179,184,0.28)] bg-[rgba(174,179,184,0.14)] text-[var(--bocar-blue-90)]',
    rank: 2,
  },
};

export const purchasingPriorityOptions: PurchasingPriority[] = ['Alta', 'Media', 'Baja'];

export const purchasingMachineTypeOptions: PurchasingMachineType[] = [
  'Inyeccion',
  'Estampado',
  'Fundicion',
  'Maquinado',
  'Ensamble',
];

export const purchasingDeadlineRangeOptions: Array<{
  label: string;
  value: PurchasingDeadlineRange;
}> = [
  { label: 'Vence hoy', value: 'TODAY' },
  { label: '<= 48 horas', value: 'WITHIN_48H' },
  { label: 'Esta semana', value: 'THIS_WEEK' },
  { label: 'Despues', value: 'LATER' },
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
    return `Hoy · ${hoursToDeadline} h`;
  }

  const days = Math.ceil(hoursToDeadline / 24);
  return `${days} d`;
}
