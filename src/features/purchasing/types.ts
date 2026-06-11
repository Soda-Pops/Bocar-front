export type PurchasingUserRole = 'compras' | 'compras_admin';

export type PurchasingRfqStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PENDING_EDIT_REQUEST'
  | 'QUOTING'
  | 'PARTIALLY_QUOTED'
  | 'BENCHMARK_READY'
  | 'EXPIRED'
  | 'CLOSED'
  | 'CANCELLED';

export type PurchasingDashboardMetricKey =
  | 'pending'
  | 'quoting'
  | 'benchmark_ready'
  | 'closed'
  | 'expired'
  | 'eliminated';

export type PurchasingPriority = 'High' | 'Medium' | 'Low';

export type PurchasingMachineType =
  | 'Injection'
  | 'Stamping'
  | 'Die Casting'
  | 'Machining'
  | 'Assembly'
  | 'Mold'
  | 'Trimming';

export type PurchasingDeadlineRange = 'TODAY' | 'WITHIN_48H' | 'THIS_WEEK' | 'LATER';

export type PurchasingUser = {
  initials: string;
  name: string;
  department: string;
  role: PurchasingUserRole;
};

export type PurchasingDashboardMetric = {
  key: PurchasingDashboardMetricKey;
  label: string;
  status: Extract<
    PurchasingRfqStatus,
    'PENDING' | 'QUOTING' | 'BENCHMARK_READY' | 'CLOSED' | 'EXPIRED' | 'CANCELLED'
  >;
  value: string;
  valueColor: string;
};

export type PurchasingDashboardRow = {
  id: string;
  desc?: string;
  project: string;
  supplierSuggestion: string;
  region: string;
  machineType: PurchasingMachineType;
  deadline: string;
  hoursToDeadline: number;
  priority: PurchasingPriority;
  owner: string;
  status: PurchasingRfqStatus;
  createdAt: string;
  supplierProgress: PurchasingSupplierProgress | null;
};

export type PurchasingWidgetItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  hoursToDeadline?: number;
  actionLabel: string;
};

export type PurchasingSupplierProgress = {
  quotedSuppliers: number;
  totalSuppliers: number;
  label: string;
};

export type PurchasingRfqRow = {
  id: string;
  desc?: string;
  project: string;
  region: string;
  machineType: PurchasingMachineType;
  deadline: string;
  hoursToDeadline: number;
  status: PurchasingRfqStatus;
  supplierProgress: PurchasingSupplierProgress | null;
  priority: PurchasingPriority;
  owner: string;
};

export type PurchasingRfqAction = {
  key:
    | 'view_detail'
    | 'assign'
    | 'extend_deadline'
    | 'close_rfq';
  label: string;
  href?: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
};

export type PurchasingRfqFilters = {
  searchValue: string;
  statusValue: PurchasingRfqStatus | '';
  priorityValue: PurchasingPriority | '';
  regionValue: string;
  machineTypeValue: PurchasingMachineType | '';
  deadlineRangeValue: PurchasingDeadlineRange | '';
};
