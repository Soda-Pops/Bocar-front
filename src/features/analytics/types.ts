export type DashboardTabKey = 'borradores' | 'revision' | 'activas' | 'historicas';

export type SortOption = '' | 'recent' | 'material' | 'creator';

export type DashboardMetric = {
  key: DashboardTabKey;
  label: string;
  value: string;
  valueColor: string;
};

export type DashboardRow = {
  id: string;
  material: string;
  createdBy: string;
  date: string;
  supplier: string;
};

export type DashboardTab = {
  key: DashboardTabKey;
  label: string;
};

export type ChartPoint = {
  month: string;
  value: number;
};

export type DashboardUser = {
  initials: string;
  name: string;
  department: string;
};
