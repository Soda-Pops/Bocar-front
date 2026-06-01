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
    key: 'expired',
    label: 'EXPIRED RFQs',
    status: 'EXPIRED',
    value: '6',
    valueColor: 'var(--bocar-error)',
  },
  {
    key: 'benchmark_ready',
    label: 'HISTORICAL RFQs',
    status: 'BENCHMARK_READY',
    value: '10',
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
    label: 'HISTORICAL RFQs',
    status: 'BENCHMARK_READY',
    value: '10',
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
    material: 'PA66 GF30',
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
    material: 'Aluminum ADC12',
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
    material: 'Steel HSS',
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
    material: 'PP 20% talc',
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
    material: 'Steel SAE 1045',
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
    material: 'ABS FR',
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
    material: 'ABS FR',
    project: 'Center console frame',
    supplierSuggestion: 'RAMCO',
    region: 'Europe',
    machineType: 'Injection',
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
    material: 'Zamak 5',
    project: 'Fixed latch insert',
    supplierSuggestion: 'FUNDICION GLOBAL',
    region: 'Latam',
    machineType: 'Die Casting',
    deadline: '01/03/2026',
    hoursToDeadline: 9999,
    priority: 'Medium',
    owner: 'Daniel Nunez',
    status: 'EXPIRED',
    createdAt: '05/01/2026',
    supplierProgress: { quotedSuppliers: 1, totalSuppliers: 4, label: '1/4 quoted' },
  },
  {
    id: 'RFQ-0968',
    material: 'PA12',
    project: 'Lateral air duct cover',
    supplierSuggestion: 'PLASTIMEX',
    region: 'North America',
    machineType: 'Injection',
    deadline: '20/02/2026',
    hoursToDeadline: 9999,
    priority: 'Low',
    owner: 'Karen Salgado',
    status: 'CANCELLED',
    createdAt: '03/12/2025',
    supplierProgress: null,
  },
  {
    id: 'RFQ-0955',
    material: 'Galvanized steel',
    project: 'HEV battery bracket',
    supplierSuggestion: 'STAMPFORGE',
    region: 'Latam',
    machineType: 'Stamping',
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
    material: 'Steel SAE 1018',
    project: 'Turbo hose bracket',
    supplierSuggestion: 'MECANIZADOS DEL NORTE',
    region: 'Asia',
    machineType: 'Machining',
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
    material: 'PA12',
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
    material: 'ABS FR',
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
    material: 'PP Impact',
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

export const urgentDeadlines: PurchasingWidgetItem[] = [
  {
    id: 'urgent-rfq-004',
    title: 'RFQ-004',
    subtitle: '',
    meta: '2 of 5 quoted',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 18,
    actionLabel: '',
  },
  {
    id: 'urgent-rfq-003a',
    title: 'RFQ-003',
    subtitle: '',
    meta: '3 of 4 quoted',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 34,
    actionLabel: '',
  },
  {
    id: 'urgent-rfq-003b',
    title: 'RFQ-003',
    subtitle: '',
    meta: '1 of 4 quoted',
    href: ROUTES.PURCHASING.RFQ_LIST,
    hoursToDeadline: 144,
    actionLabel: '',
  },
];

export const unlockRequests: PurchasingWidgetItem[] = [
  {
    id: 'ULK-14',
    title: 'ULK-14',
    subtitle: 'Supplier MAGNATECH requests reopening of RFQ-0974',
    meta: 'Reason: lead time and tooling adjustment',
    href: ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS,
    actionLabel: 'Review',
  },
  {
    id: 'ULK-12',
    title: 'ULK-12',
    subtitle: 'Supplier PLASTIMEX requests reopening of RFQ-0968',
    meta: 'Reason: official PDF corrected',
    href: ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS,
    actionLabel: 'Review',
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
