import { ROUTES } from '@/app/config/routes';
import {
  getDeadlineRange,
  getDeadlineUrgencyTone,
  getPriorityRank,
  purchasingDeadlineRangeOptions,
  purchasingMachineTypeOptions,
  purchasingPriorityOptions,
  purchasingStatusOptions,
} from '@/features/purchasing/constants';
import type {
  PurchasingRfqAction,
  PurchasingRfqFilters,
  PurchasingRfqRow,
  PurchasingUserRole,
} from '@/features/purchasing/types';
import { listRfqsComercializacion } from '@/features/purchasing/services/comercializacionService';

export const purchasingRfqRows: PurchasingRfqRow[] = [
  {
    id: 'RFQ-1021',
    project: 'EV box sensor cover',
    region: 'North America',
    machineType: 'Injection',
    deadline: '29/04/2026',
    hoursToDeadline: 18,
    status: 'PENDING',
    supplierProgress: null,
    priority: 'High',
    owner: 'Karen Salgado',
  },
  {
    id: 'RFQ-1018',
    project: 'Inverter housing bracket',
    region: 'Europe',
    machineType: 'Die Casting',
    deadline: '30/04/2026',
    hoursToDeadline: 34,
    status: 'PENDING',
    supplierProgress: null,
    priority: 'High',
    owner: 'Daniel Nunez',
  },
  {
    id: 'RFQ-1012',
    project: 'HVAC motor plastic connector',
    region: 'North America',
    machineType: 'Injection',
    deadline: '29/04/2026',
    hoursToDeadline: 22,
    status: 'QUOTING',
    supplierProgress: {
      quotedSuppliers: 2,
      totalSuppliers: 5,
      label: '2/5 quoted',
    },
    priority: 'High',
    owner: 'Carlos Mena',
  },
  {
    id: 'RFQ-1005',
    project: 'HEV battery bracket',
    region: 'Latam',
    machineType: 'Stamping',
    deadline: '30/04/2026',
    hoursToDeadline: 41,
    status: 'PARTIALLY_QUOTED',
    supplierProgress: {
      quotedSuppliers: 3,
      totalSuppliers: 4,
      label: '3/4 quoted',
    },
    priority: 'Medium',
    owner: 'Mariana Cruz',
  },
  {
    id: 'RFQ-0998',
    project: 'Pedal support base',
    region: 'Asia',
    machineType: 'Machining',
    deadline: '02/05/2026',
    hoursToDeadline: 82,
    status: 'BENCHMARK_READY',
    supplierProgress: {
      quotedSuppliers: 4,
      totalSuppliers: 4,
      label: '4/4 quoted',
    },
    priority: 'Medium',
    owner: 'Sandra Fierro',
  },
  {
    id: 'RFQ-0988',
    project: 'Lateral bracket die',
    region: 'North America',
    machineType: 'Stamping',
    deadline: '28/04/2026',
    hoursToDeadline: 8,
    status: 'EXPIRED',
    supplierProgress: {
      quotedSuppliers: 1,
      totalSuppliers: 4,
      label: '1/4 quoted',
    },
    priority: 'High',
    owner: 'Carlos Mena',
  },
  {
    id: 'RFQ-0979',
    project: 'Center console frame',
    region: 'Europe',
    machineType: 'Injection',
    deadline: '06/05/2026',
    hoursToDeadline: 150,
    status: 'CLOSED',
    supplierProgress: {
      quotedSuppliers: 4,
      totalSuppliers: 5,
      label: '4/5 quoted',
    },
    priority: 'Low',
    owner: 'Oscar Villegas',
  },
  {
    id: 'RFQ-0974',
    project: 'Fixed latch insert',
    region: 'Latam',
    machineType: 'Die Casting',
    deadline: '01/05/2026',
    hoursToDeadline: 56,
    status: 'PENDING_EDIT_REQUEST',
    supplierProgress: null,
    priority: 'Medium',
    owner: 'Daniel Nunez',
  },
  {
    id: 'RFQ-0968',
    project: 'Lateral air duct cover',
    region: 'North America',
    machineType: 'Injection',
    deadline: '07/05/2026',
    hoursToDeadline: 176,
    status: 'CANCELLED',
    supplierProgress: null,
    priority: 'Low',
    owner: 'Karen Salgado',
  },
];

export async function fetchPurchasingRfqRows(): Promise<PurchasingRfqRow[]> {
  return listRfqsComercializacion();
}

export const purchasingRfqFilterOptions = {
  statuses: purchasingStatusOptions,
  priorities: purchasingPriorityOptions.map((value) => ({ label: value, value })),
  regions: ['North America', 'Europe', 'Latam', 'Asia'].map((value) => ({ label: value, value })),
  machineTypes: purchasingMachineTypeOptions.map((value) => ({ label: value, value })),
  deadlineRanges: purchasingDeadlineRangeOptions,
};

function buildRfqDetailRoute(id: string) {
  return ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', id);
}

function buildAssignRoute(id: string) {
  return ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS.replace(':id', id);
}

function createDisabledAdminAction(
  key: PurchasingRfqAction['key'],
  label: string,
  role: PurchasingUserRole,
) {
  if (role !== 'compras_admin') {
    return null;
  }

  return {
    key,
    label,
    disabled: true,
  } satisfies PurchasingRfqAction;
}

export function getActionsByStatus(
  row: PurchasingRfqRow,
  role: PurchasingUserRole,
): PurchasingRfqAction[] {
  const detailAction: PurchasingRfqAction = {
    key: 'view_detail',
    label: 'View details',
    href: buildRfqDetailRoute(row.id),
  };

  if (row.status === 'PENDING') {
    return [
      {
        key: 'assign',
        label: 'Assign',
        href: buildAssignRoute(row.id),
      },
      detailAction,
    ];
  }

  if (row.status === 'QUOTING' || row.status === 'PARTIALLY_QUOTED') {
    return [
      detailAction,
      createDisabledAdminAction('extend_deadline', 'Extend deadline', role),
    ].filter(Boolean) as PurchasingRfqAction[];
  }

  if (row.status === 'BENCHMARK_READY') {
    return [
      detailAction,
      createDisabledAdminAction('close_rfq', 'Close RFQ', role),
    ].filter(Boolean) as PurchasingRfqAction[];
  }

  if (row.status === 'EXPIRED') {
    return [
      detailAction,
      createDisabledAdminAction('extend_deadline', 'Extend deadline', role),
      createDisabledAdminAction('close_rfq', 'Close RFQ', role),
    ].filter(Boolean) as PurchasingRfqAction[];
  }

  return [detailAction];
}

function matchesSearch(row: PurchasingRfqRow, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [row.id, row.desc ?? '', row.project, row.region, row.owner].some((field) =>
    field.toLowerCase().includes(normalizedSearch),
  );
}

function matchesDeadlineRange(
  row: PurchasingRfqRow,
  deadlineRangeValue: PurchasingRfqFilters['deadlineRangeValue'],
) {
  if (!deadlineRangeValue) {
    return true;
  }

  return getDeadlineRange(row.hoursToDeadline) === deadlineRangeValue;
}

export function getFilteredPurchasingRfqRows(
  rows: PurchasingRfqRow[],
  filters: PurchasingRfqFilters,
) {
  return rows
    .filter((row) => {
      const matchesStatus = !filters.statusValue || row.status === filters.statusValue;
      const matchesPriority = !filters.priorityValue || row.priority === filters.priorityValue;
      const matchesRegion = !filters.regionValue || row.region === filters.regionValue;
      const matchesMachineType =
        !filters.machineTypeValue || row.machineType === filters.machineTypeValue;

      return (
        matchesSearch(row, filters.searchValue) &&
        matchesStatus &&
        matchesPriority &&
        matchesRegion &&
        matchesMachineType &&
        matchesDeadlineRange(row, filters.deadlineRangeValue)
      );
    })
    .sort((leftRow, rightRow) => {
      const urgencyDelta =
        urgencyWeight(getDeadlineUrgencyTone(leftRow.hoursToDeadline)) -
        urgencyWeight(getDeadlineUrgencyTone(rightRow.hoursToDeadline));

      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }

      const priorityDelta = getPriorityRank(leftRow.priority) - getPriorityRank(rightRow.priority);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return leftRow.hoursToDeadline - rightRow.hoursToDeadline;
    });
}

function urgencyWeight(urgency: ReturnType<typeof getDeadlineUrgencyTone>) {
  if (urgency === 'critical') {
    return 0;
  }

  if (urgency === 'warning') {
    return 1;
  }

  return 2;
}
