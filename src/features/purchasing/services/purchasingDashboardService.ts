import { ROUTES } from '@/app/config/routes';
import type { ChartPoint } from '@/features/analytics/types';
import { getDeadlineRange, getDeadlineUrgencyTone, getPriorityRank } from '@/features/purchasing/constants';
import type { ExtensionRequestItem } from '@/features/purchasing/services/comercializacionService';
import type {
  PurchasingDashboardMetric,
  PurchasingDashboardRow,
  PurchasingRfqStatus,
  PurchasingUser,
  PurchasingWidgetItem,
} from '@/features/purchasing/types';
import { formatId } from '@/shared/utils/rfqId';

export const purchasingUser: PurchasingUser = {
  initials: 'CM',
  name: 'Carlos Mena',
  department: 'Purchasing',
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
    label: 'RFQs PENDING ASSIGNMENT',
    status: 'PENDING',
    value: '2',
    valueColor: 'var(--bocar-blue-100)',
  },
  {
    key: 'quoting',
    label: 'RFQs IN QUOTATION',
    status: 'QUOTING',
    value: '3',
    valueColor: 'var(--bocar-done)',
  },
  {
    key: 'expired',
    label: 'EXPIRED RFQs',
    status: 'EXPIRED',
    value: '6',
    valueColor: 'var(--bocar-error)',
  },
  {
    key: 'benchmark_ready',
    label: 'BENCHMARK READY',
    status: 'BENCHMARK_READY',
    value: '5',
    valueColor: '#005f8e',
  },
  {
    key: 'closed',
    label: 'CLOSED RFQs',
    status: 'CLOSED',
    value: '5',
    valueColor: 'var(--bocar-blue-50)',
  },
];

export const superuserPurchasingMetrics: PurchasingDashboardMetric[] = [
  {
    key: 'pending',
    label: 'RFQs TO ASSIGN',
    status: 'PENDING',
    value: '2',
    valueColor: 'var(--bocar-blue-100)',
  },
  {
    key: 'quoting',
    label: 'RFQs IN QUOTATION',
    status: 'QUOTING',
    value: '3',
    valueColor: 'var(--bocar-done)',
  },
  {
    key: 'eliminated',
    label: 'DELETED RFQs',
    status: 'CANCELLED',
    value: '3',
    valueColor: 'var(--bocar-blue-50)',
  },
  {
    key: 'expired',
    label: 'EXPIRED RFQs',
    status: 'EXPIRED',
    value: '6',
    valueColor: 'var(--bocar-error)',
  },
  {
    key: 'benchmark_ready',
    label: 'BENCHMARK READY',
    status: 'BENCHMARK_READY',
    value: '5',
    valueColor: '#005f8e',
  },
  {
    key: 'closed',
    label: 'CLOSED RFQs',
    status: 'CLOSED',
    value: '5',
    valueColor: 'var(--bocar-blue-50)',
  },
];

export const purchasingMonthlySeries: ChartPoint[] = [
  { month: 'Jan', value: 6.2 },
  { month: 'Feb', value: 7.8 },
  { month: 'Mar', value: 8.4 },
  { month: 'Apr', value: 9.1 },
  { month: 'May', value: 8.7 },
  { month: 'Jun', value: 10.2 },
];

export const purchasingQueueRows: PurchasingDashboardRow[] = [
  {
    id: 'RFQ-1021',
    project: 'EV box sensor cover',
    supplierSuggestion: 'PLASTIMEX',
    region: 'North America',
    machineType: 'Mold',
    deadline: '29/04/2026',
    hoursToDeadline: 18,
    priority: 'High',
    owner: 'Karen Salgado',
    status: 'QUOTING',
    createdAt: '20/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-1018',
    project: 'Inverter housing bracket',
    supplierSuggestion: 'FUNDIMEX',
    region: 'Europe',
    machineType: 'Trimming',
    deadline: '30/04/2026',
    hoursToDeadline: 34,
    priority: 'High',
    owner: 'Daniel Nunez',
    status: 'QUOTING',
    createdAt: '20/06/2024',
    supplierProgress: null,
  },
  {
    id: 'RFQ-1009',
    project: 'Front reinforcement bracket',
    supplierSuggestion: 'STAMPFORGE',
    region: 'North America',
    machineType: 'Mold',
    deadline: '15/06/2026',
    hoursToDeadline: 408,
    priority: 'Medium',
    owner: 'Mariana Cruz',
    status: 'PENDING',
    createdAt: '19/05/2026',
    supplierProgress: null,
  },
  {
    id: 'RFQ-1003',
    project: 'HVAC duct housing',
    supplierSuggestion: 'INYECTA BAJIO',
    region: 'Latam',
    machineType: 'Mold',
    deadline: '20/06/2026',
    hoursToDeadline: 528,
    priority: 'Medium',
    owner: 'Carlos Mena',
    status: 'PENDING',
    createdAt: '18/05/2026',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0996',
    project: 'Pedal support base',
    supplierSuggestion: 'MECANIZADOS DEL NORTE',
    region: 'Asia',
    machineType: 'Trimming',
    deadline: '08/06/2026',
    hoursToDeadline: 240,
    priority: 'Low',
    owner: 'Sandra Fierro',
    status: 'QUOTING',
    createdAt: '17/05/2026',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0991',
    project: 'Center console frame',
    supplierSuggestion: 'RAMCO',
    region: 'North America',
    machineType: 'Mold',
    deadline: '25/06/2026',
    hoursToDeadline: 648,
    priority: 'Low',
    owner: 'Oscar Villegas',
    status: 'PENDING',
    createdAt: '16/05/2026',
    supplierProgress: null,
  },
];

export const historicalRows: PurchasingDashboardRow[] = [
  {
    id: 'RFQ-0979',
    project: 'Center console frame',
    supplierSuggestion: 'RAMCO',
    region: 'Europe',
    machineType: 'Mold',
    deadline: '06/03/2026',
    hoursToDeadline: 9999,
    priority: 'Low',
    owner: 'Oscar Villegas',
    status: 'CLOSED',
    createdAt: '10/01/2026',
    supplierProgress: { quotedSuppliers: 4, totalSuppliers: 5, label: '4/5 quoted' },
  },
  {
    id: 'RFQ-0974',
    project: 'Fixed latch insert',
    supplierSuggestion: 'FUNDICION GLOBAL',
    region: 'Latam',
    machineType: 'Trimming',
    deadline: '01/03/2026',
    hoursToDeadline: 9999,
    priority: 'Medium',
    owner: 'Daniel Nunez',
    status: 'CLOSED',
    createdAt: '05/01/2026',
    supplierProgress: { quotedSuppliers: 1, totalSuppliers: 4, label: '1/4 quoted' },
  },
  {
    id: 'RFQ-0968',
    project: 'Lateral air duct cover',
    supplierSuggestion: 'PLASTIMEX',
    region: 'North America',
    machineType: 'Mold',
    deadline: '20/02/2026',
    hoursToDeadline: 9999,
    priority: 'Low',
    owner: 'Karen Salgado',
    status: 'CLOSED',
    createdAt: '03/12/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0955',
    project: 'HEV battery bracket',
    supplierSuggestion: 'STAMPFORGE',
    region: 'Latam',
    machineType: 'Trimming',
    deadline: '10/02/2026',
    hoursToDeadline: 9999,
    priority: 'High',
    owner: 'Mariana Cruz',
    status: 'CLOSED',
    createdAt: '15/11/2025',
    supplierProgress: { quotedSuppliers: 3, totalSuppliers: 3, label: '3/3 quoted' },
  },
  {
    id: 'RFQ-0941',
    project: 'Turbo hose bracket',
    supplierSuggestion: 'MECANIZADOS DEL NORTE',
    region: 'Asia',
    machineType: 'Mold',
    deadline: '28/01/2026',
    hoursToDeadline: 9999,
    priority: 'Medium',
    owner: 'Sandra Fierro',
    status: 'CLOSED',
    createdAt: '01/11/2025',
    supplierProgress: { quotedSuppliers: 2, totalSuppliers: 2, label: '2/2 quoted' },
  },
];

export const eliminatedRows: PurchasingDashboardRow[] = [
  {
    id: 'RFQ-0968',
    project: 'Lateral air duct cover',
    supplierSuggestion: 'PLASTIMEX',
    region: 'North America',
    machineType: 'Mold',
    deadline: '20/02/2026',
    hoursToDeadline: 9999,
    priority: 'Low',
    owner: 'Karen Salgado',
    status: 'CANCELLED',
    createdAt: '03/12/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0952',
    project: 'BCM module cover',
    supplierSuggestion: 'RAMCO',
    region: 'North America',
    machineType: 'Trimming',
    deadline: '15/01/2026',
    hoursToDeadline: 9999,
    priority: 'Medium',
    owner: 'Daniel Nunez',
    status: 'CANCELLED',
    createdAt: '20/11/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0940',
    project: 'Rear door panel',
    supplierSuggestion: 'INYECTA BAJIO',
    region: 'Latam',
    machineType: 'Mold',
    deadline: '05/01/2026',
    hoursToDeadline: 9999,
    priority: 'Low',
    owner: 'Sandra Fierro',
    status: 'CANCELLED',
    createdAt: '10/11/2025',
    supplierProgress: null,
  },
];

/** Estados de RFQ activos que aún requieren seguimiento antes de cerrarse. */
const FOLLOW_UP_STATUSES: PurchasingRfqStatus[] = ['QUOTING', 'PARTIALLY_QUOTED'];

/**
 * Construye los items del widget "UPCOMING DEADLINES" a partir de las RFQs
 * reales de Comercialización: RFQs activas con fecha límite próxima, ordenadas
 * por urgencia. Devuelve la lista completa; el widget se encarga de paginar.
 * Cada item enlaza al detalle de la RFQ.
 */
export function buildUpcomingDeadlineItems(rows: PurchasingDashboardRow[]): PurchasingWidgetItem[] {
  return rows
    .filter((row) => FOLLOW_UP_STATUSES.includes(row.status) && row.hoursToDeadline < 9999)
    .sort((leftRow, rightRow) => leftRow.hoursToDeadline - rightRow.hoursToDeadline)
    .map((row) => ({
      id: row.id,
      title: row.id,
      subtitle: row.project,
      meta: row.supplierProgress?.label ?? 'No quotations',
      href: `${ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', row.id)}?status=${row.status}&tipo=${row.machineType}`,
      hoursToDeadline: row.hoursToDeadline,
      actionLabel: '',
    }));
}

/**
 * Construye los items del widget "PENDING UNLOCK REQUESTS" a partir de las
 * solicitudes de extensión reales enviadas por proveedores. Devuelve la lista
 * completa; el widget se encarga de paginar. Cada item enlaza al detalle de la
 * RFQ correspondiente.
 */
export function buildUnlockRequestItems(requests: ExtensionRequestItem[]): PurchasingWidgetItem[] {
  return requests.map((req) => ({
    id: String(req.id),
    title: req.rfqId > 0 ? formatId(req.rfqId) : req.rfqNombre,
    subtitle: `${req.proveedorNombre} solicita reabrir su asignación`,
    meta: req.motivo ? `Motivo: ${req.motivo}` : '',
    href:
      req.rfqId > 0
        ? `${ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', formatId(req.rfqId))}?tipo=${req.rfqTipo}`
        : '',
    actionLabel: 'Review',
  }));
}

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
      ![row.id, row.desc ?? '', row.project, row.machineType, row.owner, row.supplierSuggestion].some((field) =>
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

  return [row.id, row.desc ?? '', row.project, row.machineType, row.owner, row.supplierSuggestion].some((field) =>
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
  sortValue: 'deadline' | 'priority' = 'deadline',
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
