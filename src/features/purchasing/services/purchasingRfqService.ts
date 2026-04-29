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

export const purchasingRfqRows: PurchasingRfqRow[] = [
  {
    id: 'RFQ-1021',
    material: 'PA66 GF30',
    project: 'Cubierta sensor caja EV',
    region: 'Norteamerica',
    machineType: 'Inyeccion',
    deadline: '29/04/2026',
    hoursToDeadline: 18,
    status: 'PENDING',
    supplierProgress: null,
    priority: 'Alta',
    owner: 'Karen Salgado',
  },
  {
    id: 'RFQ-1018',
    material: 'Aluminio ADC12',
    project: 'Soporte carcasa inverter',
    region: 'Europa',
    machineType: 'Fundicion',
    deadline: '30/04/2026',
    hoursToDeadline: 34,
    status: 'PENDING',
    supplierProgress: null,
    priority: 'Alta',
    owner: 'Daniel Nunez',
  },
  {
    id: 'RFQ-1012',
    material: 'PC ABS',
    project: 'Conector plastico motor HVAC',
    region: 'Norteamerica',
    machineType: 'Inyeccion',
    deadline: '29/04/2026',
    hoursToDeadline: 22,
    status: 'QUOTING',
    supplierProgress: {
      quotedSuppliers: 2,
      totalSuppliers: 5,
      label: '2/5 cotizados',
    },
    priority: 'Alta',
    owner: 'Carlos Mena',
  },
  {
    id: 'RFQ-1005',
    material: 'Acero galvanizado',
    project: 'Bracket bateria HEV',
    region: 'Latam',
    machineType: 'Estampado',
    deadline: '30/04/2026',
    hoursToDeadline: 41,
    status: 'PARTIALLY_QUOTED',
    supplierProgress: {
      quotedSuppliers: 3,
      totalSuppliers: 4,
      label: '3/4 cotizados',
    },
    priority: 'Media',
    owner: 'Mariana Cruz',
  },
  {
    id: 'RFQ-0998',
    material: 'Acero SAE 1045',
    project: 'Base soporte pedal',
    region: 'Asia',
    machineType: 'Maquinado',
    deadline: '02/05/2026',
    hoursToDeadline: 82,
    status: 'BENCHMARK_READY',
    supplierProgress: {
      quotedSuppliers: 4,
      totalSuppliers: 4,
      label: '4/4 cotizados',
    },
    priority: 'Media',
    owner: 'Sandra Fierro',
  },
  {
    id: 'RFQ-0988',
    material: 'Acero HSS',
    project: 'Troquel bracket lateral',
    region: 'Norteamerica',
    machineType: 'Estampado',
    deadline: '28/04/2026',
    hoursToDeadline: 8,
    status: 'EXPIRED',
    supplierProgress: {
      quotedSuppliers: 1,
      totalSuppliers: 4,
      label: '1/4 cotizados',
    },
    priority: 'Alta',
    owner: 'Carlos Mena',
  },
  {
    id: 'RFQ-0979',
    material: 'ABS FR',
    project: 'Marco consola central',
    region: 'Europa',
    machineType: 'Inyeccion',
    deadline: '06/05/2026',
    hoursToDeadline: 150,
    status: 'CLOSED',
    supplierProgress: {
      quotedSuppliers: 4,
      totalSuppliers: 5,
      label: '4/5 cotizados',
    },
    priority: 'Baja',
    owner: 'Oscar Villegas',
  },
  {
    id: 'RFQ-0974',
    material: 'Zamak 5',
    project: 'Inserto fijo cerradura',
    region: 'Latam',
    machineType: 'Fundicion',
    deadline: '01/05/2026',
    hoursToDeadline: 56,
    status: 'PENDING_EDIT_REQUEST',
    supplierProgress: null,
    priority: 'Media',
    owner: 'Daniel Nunez',
  },
  {
    id: 'RFQ-0968',
    material: 'PA12',
    project: 'Tapa ducto aire lateral',
    region: 'Norteamerica',
    machineType: 'Inyeccion',
    deadline: '07/05/2026',
    hoursToDeadline: 176,
    status: 'CANCELLED',
    supplierProgress: null,
    priority: 'Baja',
    owner: 'Karen Salgado',
  },
];

export const purchasingRfqFilterOptions = {
  statuses: purchasingStatusOptions,
  priorities: purchasingPriorityOptions.map((value) => ({ label: value, value })),
  regions: ['Norteamerica', 'Europa', 'Latam', 'Asia'].map((value) => ({ label: value, value })),
  machineTypes: purchasingMachineTypeOptions.map((value) => ({ label: value, value })),
  deadlineRanges: purchasingDeadlineRangeOptions,
};

function buildRfqDetailRoute(id: string) {
  return ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', id);
}

function buildAssignRoute(id: string) {
  return ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS.replace(':id', id);
}

function buildBenchmarkRoute(id: string) {
  return ROUTES.PURCHASING.BENCHMARK.replace(':rfqId', id);
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
    label: 'Ver detalle',
    href: buildRfqDetailRoute(row.id),
  };

  if (row.status === 'PENDING') {
    return [
      {
        key: 'assign',
        label: 'Asignar',
        href: buildAssignRoute(row.id),
      },
      detailAction,
    ];
  }

  if (row.status === 'QUOTING' || row.status === 'PARTIALLY_QUOTED') {
    return [
      detailAction,
      createDisabledAdminAction('extend_deadline', 'Extender plazo', role),
    ].filter(Boolean) as PurchasingRfqAction[];
  }

  if (row.status === 'BENCHMARK_READY') {
    return [
      {
        key: 'view_benchmark',
        label: 'Ver benchmark',
        href: buildBenchmarkRoute(row.id),
      },
      createDisabledAdminAction('close_rfq', 'Cerrar RFQ', role),
    ].filter(Boolean) as PurchasingRfqAction[];
  }

  if (row.status === 'EXPIRED') {
    return [
      detailAction,
      createDisabledAdminAction('extend_deadline', 'Extender plazo', role),
      createDisabledAdminAction('close_rfq', 'Cerrar RFQ', role),
    ].filter(Boolean) as PurchasingRfqAction[];
  }

  return [detailAction];
}

function matchesSearch(row: PurchasingRfqRow, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [row.id, row.material, row.project, row.region, row.owner].some((field) =>
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
