import { ROUTES } from '@/app/config/routes';
import type { ChartPoint } from '@/features/analytics/types';
import { getDeadlineRange, getDeadlineUrgencyTone, getPriorityRank } from '@/features/purchasing/constants';
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

export const purchasingAdminUser: PurchasingUser = {
  initials: 'AR',
  name: 'Anairam Rodriguez',
  department: 'Ing.Materiales',
  role: 'compras_admin',
};

export const purchasingMetrics: PurchasingDashboardMetric[] = [
  {
    key: 'pending',
    label: 'RFQs POR ASIGNAR',
    status: 'PENDING',
    value: '2',
    valueColor: 'var(--bocar-blue-100)',
  },
  {
    key: 'quoting',
    label: 'RFQs EN COTIZACIÓN',
    status: 'QUOTING',
    value: '3',
    valueColor: 'var(--bocar-done)',
  },
  {
    key: 'expired',
    label: 'RFQs VENCIDAS',
    status: 'EXPIRED',
    value: '6',
    valueColor: 'var(--bocar-error)',
  },
  {
    key: 'benchmark_ready',
    label: 'RFQs HISTÓRICAS',
    status: 'BENCHMARK_READY',
    value: '10',
    valueColor: 'var(--bocar-blue-50)',
  },
];

export const superuserPurchasingMetrics: PurchasingDashboardMetric[] = [
  {
    key: 'pending',
    label: 'RFQs POR ASIGNAR',
    status: 'PENDING',
    value: '2',
    valueColor: 'var(--bocar-blue-100)',
  },
  {
    key: 'quoting',
    label: 'RFQs EN COTIZACIÓN',
    status: 'QUOTING',
    value: '3',
    valueColor: 'var(--bocar-done)',
  },
  {
    key: 'eliminated',
    label: 'RFQs ELIMINADAS',
    status: 'CANCELLED',
    value: '3',
    valueColor: 'var(--bocar-blue-50)',
  },
  {
    key: 'expired',
    label: 'RFQs VENCIDAS',
    status: 'EXPIRED',
    value: '6',
    valueColor: 'var(--bocar-error)',
  },
  {
    key: 'benchmark_ready',
    label: 'RFQs HISTÓRICAS',
    status: 'BENCHMARK_READY',
    value: '10',
    valueColor: 'var(--bocar-blue-50)',
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
    machineType: 'Mold',
    deadline: '29/04/2026',
    hoursToDeadline: 18,
    priority: 'Alta',
    owner: 'Karen Salgado',
    status: 'QUOTING',
    createdAt: '20/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-1018',
    material: 'Aluminio ADC12',
    project: 'Soporte carcasa inverter',
    supplierSuggestion: 'FUNDIMEX',
    region: 'Europa',
    machineType: 'Trimming',
    deadline: '30/04/2026',
    hoursToDeadline: 34,
    priority: 'Alta',
    owner: 'Daniel Nunez',
    status: 'QUOTING',
    createdAt: '20/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-1009',
    material: 'Acero HSS',
    project: 'Bracket refuerzo frontal',
    supplierSuggestion: 'STAMPFORGE',
    region: 'Norteamerica',
    machineType: 'Mold',
    deadline: '02/05/2026',
    hoursToDeadline: 18,
    priority: 'Media',
    owner: 'Mariana Cruz',
    status: 'EXPIRED',
    createdAt: '19/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-1003',
    material: 'PP 20% talco',
    project: 'Alojamiento ducto HVAC',
    supplierSuggestion: 'INYECTA BAJIO',
    region: 'Latam',
    machineType: 'Mold',
    deadline: '05/05/2026',
    hoursToDeadline: 144,
    priority: 'Media',
    owner: 'Carlos Mena',
    status: 'EXPIRED',
    createdAt: '18/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0996',
    material: 'Acero SAE 1045',
    project: 'Base soporte pedal',
    supplierSuggestion: 'MECANIZADOS DEL NORTE',
    region: 'Asia',
    machineType: 'Trimming',
    deadline: '08/05/2026',
    hoursToDeadline: 198,
    priority: 'Baja',
    owner: 'Sandra Fierro',
    status: 'QUOTING',
    createdAt: '17/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0991',
    material: 'ABS FR',
    project: 'Marco consola central',
    supplierSuggestion: 'RAMCO',
    region: 'Norteamerica',
    machineType: 'Mold',
    deadline: '09/05/2026',
    hoursToDeadline: 226,
    priority: 'Baja',
    owner: 'Oscar Villegas',
    status: 'EXPIRED',
    createdAt: '16/06/2024',
    supplierProgress: null,
  },
];

export const historicalRows: PurchasingDashboardRow[] = [
  {
    id: 'RFQ-0979',
    material: 'ABS FR',
    project: 'Marco consola central',
    supplierSuggestion: 'RAMCO',
    region: 'Europa',
    machineType: 'Inyeccion',
    deadline: '06/03/2026',
    hoursToDeadline: 9999,
    priority: 'Baja',
    owner: 'Oscar Villegas',
    status: 'CLOSED',
    createdAt: '10/01/2026',
    supplierProgress: { quotedSuppliers: 4, totalSuppliers: 5, label: '4/5 cotizados' },
  },
  {
    id: 'RFQ-0974',
    material: 'Zamak 5',
    project: 'Inserto fijo cerradura',
    supplierSuggestion: 'FUNDICION GLOBAL',
    region: 'Latam',
    machineType: 'Fundicion',
    deadline: '01/03/2026',
    hoursToDeadline: 9999,
    priority: 'Media',
    owner: 'Daniel Nunez',
    status: 'EXPIRED',
    createdAt: '05/01/2026',
    supplierProgress: { quotedSuppliers: 1, totalSuppliers: 4, label: '1/4 cotizados' },
  },
  {
    id: 'RFQ-0968',
    material: 'PA12',
    project: 'Tapa ducto aire lateral',
    supplierSuggestion: 'PLASTIMEX',
    region: 'Norteamerica',
    machineType: 'Inyeccion',
    deadline: '20/02/2026',
    hoursToDeadline: 9999,
    priority: 'Baja',
    owner: 'Karen Salgado',
    status: 'CANCELLED',
    createdAt: '03/12/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0955',
    material: 'Acero galvanizado',
    project: 'Bracket bateria HEV',
    supplierSuggestion: 'STAMPFORGE',
    region: 'Latam',
    machineType: 'Estampado',
    deadline: '10/02/2026',
    hoursToDeadline: 9999,
    priority: 'Alta',
    owner: 'Mariana Cruz',
    status: 'CLOSED',
    createdAt: '15/11/2025',
    supplierProgress: { quotedSuppliers: 3, totalSuppliers: 3, label: '3/3 cotizados' },
  },
  {
    id: 'RFQ-0941',
    material: 'Acero SAE 1018',
    project: 'Soporte manguera turbo',
    supplierSuggestion: 'MECANIZADOS DEL NORTE',
    region: 'Asia',
    machineType: 'Maquinado',
    deadline: '28/01/2026',
    hoursToDeadline: 9999,
    priority: 'Media',
    owner: 'Sandra Fierro',
    status: 'CLOSED',
    createdAt: '01/11/2025',
    supplierProgress: { quotedSuppliers: 2, totalSuppliers: 2, label: '2/2 cotizados' },
  },
];

export const eliminatedRows: PurchasingDashboardRow[] = [
  {
    id: 'RFQ-0968',
    material: 'PA12',
    project: 'Tapa ducto aire lateral',
    supplierSuggestion: 'PLASTIMEX',
    region: 'Norteamerica',
    machineType: 'Mold',
    deadline: '20/02/2026',
    hoursToDeadline: 9999,
    priority: 'Baja',
    owner: 'Karen Salgado',
    status: 'CANCELLED',
    createdAt: '03/12/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0952',
    material: 'ABS FR',
    project: 'Cubierta modulo BCM',
    supplierSuggestion: 'RAMCO',
    region: 'Norteamerica',
    machineType: 'Trimming',
    deadline: '15/01/2026',
    hoursToDeadline: 9999,
    priority: 'Media',
    owner: 'Daniel Nunez',
    status: 'CANCELLED',
    createdAt: '20/11/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0940',
    material: 'PP Impact',
    project: 'Panel puerta trasera',
    supplierSuggestion: 'INYECTA BAJIO',
    region: 'Latam',
    machineType: 'Mold',
    deadline: '05/01/2026',
    hoursToDeadline: 9999,
    priority: 'Baja',
    owner: 'Sandra Fierro',
    status: 'CANCELLED',
    createdAt: '10/11/2025',
    supplierProgress: null,
  },
];

export const urgentDeadlines: PurchasingWidgetItem[] = [
  {
    id: 'urgent-rfq-004',
    title: 'RFQ-004',
    subtitle: '',
    meta: '2 de 5 cotizados',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 18,
    actionLabel: '',
  },
  {
    id: 'urgent-rfq-003a',
    title: 'RFQ-003',
    subtitle: '',
    meta: '3 de 4 cotizados',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 34,
    actionLabel: '',
  },
  {
    id: 'urgent-rfq-003b',
    title: 'RFQ-003',
    subtitle: '',
    meta: '1 de 4 cotizados',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 144,
    actionLabel: '',
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

export function getFilteredDashboardRows(
  rows: PurchasingDashboardRow[],
  {
    searchValue = '',
    tipoValue = '',
    deadlineValue = '',
  }: { searchValue?: string; tipoValue?: string; deadlineValue?: string },
) {
  const normalized = searchValue.trim().toLowerCase();

  return rows.filter((row) => {
    if (
      normalized &&
      ![row.id, row.material, row.project, row.owner, row.supplierSuggestion].some((field) =>
        field.toLowerCase().includes(normalized),
      )
    ) {
      return false;
    }

    if (tipoValue && row.machineType !== tipoValue) {
      return false;
    }

    if (deadlineValue && row.hoursToDeadline < 9999) {
      const range = getDeadlineRange(row.hoursToDeadline);
      if (range !== deadlineValue) {
        return false;
      }
    }

    return true;
  });
}

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
