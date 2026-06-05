export type SupplierRfqStatus = 'PENDING' | 'QUOTED' | 'DONE';

export type SupplierTab = 'assigned' | 'historical';

export type SupplierMetricKey = 'assigned' | 'pending' | 'quoted' | 'historical';

export type SupplierRfqRow = {
  id: string;
  assignmentId?: number;
  status: SupplierRfqStatus;
  tipo: string;
  deadline: string;
};

export type SupplierMetric = {
  key: SupplierMetricKey;
  label: string;
  value: string;
  valueColor: string;
};
