import { ROUTES } from '@/app/config/routes';
import type { ChartPoint } from '@/features/analytics/types';
import { getDeadlineUrgencyTone, getPriorityRank } from '@/features/purchasing/constants';
import type {
  PurchasingDashboardMetric,
  PurchasingDashboardRow,
  PurchasingRfqStatus,
  PurchasingUser,
  PurchasingWidgetItem,
} from '@/features/purchasing/types';

export const purchasingUser: PurchasingUser = {
  initials: 'CM',
  name: 'Carlos Mena',
  department: 'Compras',
  role: 'compras_admin',
};

export const purchasingMetrics: PurchasingDashboardMetric[] = [
  {
    key: 'pending',
    label: 'RFQs por asignar',
    status: 'PENDING',
    value: '12',
    valueColor: 'var(--bocar-blue-100)',
  },
  {
    key: 'quoting',
    label: 'En cotizacion',
    status: 'QUOTING',
    value: '18',
    valueColor: 'var(--bocar-blue-90)',
  },
  {
    key: 'benchmark_ready',
    label: 'Benchmark listo',
    status: 'BENCHMARK_READY',
    value: '5',
    valueColor: 'var(--bocar-done)',
  },
  {
    key: 'expired',
    label: 'Vencidas',
    status: 'EXPIRED',
    value: '3',
    valueColor: 'var(--bocar-error)',
  },
];

export const purchasingMonthlySeries: ChartPoint[] = [
  { month: 'Ene', value: 6.2 },
  { month: 'Feb', value: 7.8 },
  { month: 'Mar', value: 8.4 },
  { month: 'Abr', value: 9.1 },
  { month: 'May', value: 8.7 },
  { month: 'Jun', value: 10.2 },
];

export const purchasingQueueRows: PurchasingDashboardRow[] = [
  {
    id: 'RFQ-1021',
    material: 'PA66 GF30',
    project: 'Cubierta sensor caja EV',
    supplierSuggestion: 'PLASTIMEX',
    region: 'Norteamerica',
    deadline: '29/04/2026',
    hoursToDeadline: 18,
    priority: 'Alta',
    owner: 'Karen Salgado',
    status: 'PENDING',
  },
  {
    id: 'RFQ-1018',
    material: 'Aluminio ADC12',
    project: 'Soporte carcasa inverter',
    supplierSuggestion: 'FUNDIMEX',
    region: 'Europa',
    deadline: '30/04/2026',
    hoursToDeadline: 34,
    priority: 'Alta',
    owner: 'Daniel Nunez',
    status: 'PENDING',
  },
  {
    id: 'RFQ-1009',
    material: 'Acero HSS',
    project: 'Bracket refuerzo frontal',
    supplierSuggestion: 'STAMPFORGE',
    region: 'Norteamerica',
    deadline: '02/05/2026',
    hoursToDeadline: 76,
    priority: 'Media',
    owner: 'Mariana Cruz',
    status: 'PENDING',
  },
  {
    id: 'RFQ-1003',
    material: 'PP 20% talco',
    project: 'Alojamiento ducto HVAC',
    supplierSuggestion: 'INYECTA BAJIO',
    region: 'Latam',
    deadline: '05/05/2026',
    hoursToDeadline: 132,
    priority: 'Media',
    owner: 'Carlos Mena',
    status: 'PENDING',
  },
  {
    id: 'RFQ-0996',
    material: 'Acero SAE 1045',
    project: 'Base soporte pedal',
    supplierSuggestion: 'MECANIZADOS DEL NORTE',
    region: 'Asia',
    deadline: '08/05/2026',
    hoursToDeadline: 198,
    priority: 'Baja',
    owner: 'Sandra Fierro',
    status: 'PENDING',
  },
  {
    id: 'RFQ-0991',
    material: 'ABS FR',
    project: 'Marco consola central',
    supplierSuggestion: 'RAMCO',
    region: 'Norteamerica',
    deadline: '09/05/2026',
    hoursToDeadline: 226,
    priority: 'Baja',
    owner: 'Oscar Villegas',
    status: 'PENDING',
  },
];

export const urgentDeadlines: PurchasingWidgetItem[] = [
  {
    id: 'RFQ-1012',
    title: 'RFQ-1012',
    subtitle: 'Conector plastico motor HVAC',
    meta: '2 de 5 cotizados · GM Silao',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 22,
    actionLabel: 'Abrir lista',
  },
  {
    id: 'RFQ-1005',
    title: 'RFQ-1005',
    subtitle: 'Carcasa soporte radar ADAS',
    meta: '3 de 4 cotizados · Ford Hermosillo',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 41,
    actionLabel: 'Abrir lista',
  },
  {
    id: 'RFQ-0988',
    title: 'RFQ-0988',
    subtitle: 'Troquel bracket lateral',
    meta: '1 de 4 cotizados · Stellantis Toluca',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 62,
    actionLabel: 'Abrir lista',
  },
];

export const unlockRequests: PurchasingWidgetItem[] = [
  {
    id: 'ULK-14',
    title: 'ULK-14',
    subtitle: 'Proveedor MAGNATECH solicita reapertura RFQ-0974',
    meta: 'Motivo: ajuste de lead time y herramental',
    href: ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS,
    actionLabel: 'Atender',
  },
  {
    id: 'ULK-12',
    title: 'ULK-12',
    subtitle: 'Proveedor PLASTIMEX solicita reapertura RFQ-0968',
    meta: 'Motivo: PDF oficial corregido',
    href: ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS,
    actionLabel: 'Atender',
  },
];

function matchesSearch(row: PurchasingDashboardRow, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [row.id, row.material, row.project, row.owner, row.supplierSuggestion].some((field) =>
    field.toLowerCase().includes(normalizedSearch),
  );
}

function matchesStatus(rowStatus: PurchasingRfqStatus, statusValue: PurchasingRfqStatus | '') {
  return !statusValue || rowStatus === statusValue;
}

export function getFilteredPurchasingQueueRows(
  rows: PurchasingDashboardRow[],
  searchValue = '',
  statusValue: PurchasingRfqStatus | '' = '',
  supplierValue = '',
  sortValue: 'deadline' | 'priority' | 'material' = 'deadline',
) {
  const normalizedSupplier = supplierValue.trim().toLowerCase();

  return rows
    .filter((row) => {
      const matchesSupplier =
        normalizedSupplier.length === 0 ||
        row.supplierSuggestion.toLowerCase().includes(normalizedSupplier);

      return (
        matchesSearch(row, searchValue) &&
        matchesStatus(row.status, statusValue) &&
        matchesSupplier
      );
    })
    .sort((leftRow, rightRow) => {
      if (sortValue === 'priority') {
        return getPriorityRank(leftRow.priority) - getPriorityRank(rightRow.priority);
      }

      if (sortValue === 'material') {
        return leftRow.material.localeCompare(rightRow.material, 'es');
      }

      return leftRow.hoursToDeadline - rightRow.hoursToDeadline;
    });
}

export function getDashboardCardStatusClass(hoursToDeadline: number) {
  const urgency = getDeadlineUrgencyTone(hoursToDeadline);

  if (urgency === 'critical') {
    return 'border-[rgba(170,0,15,0.2)] bg-[rgba(170,0,15,0.05)]';
  }

  if (urgency === 'warning') {
    return 'border-[rgba(255,242,0,0.26)] bg-[rgba(255,242,0,0.12)]';
  }

  return 'border-[rgba(217,222,229,0.84)] bg-white';
}
