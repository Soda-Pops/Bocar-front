export type DashboardTabKey = 'borradores' | 'activas' | 'historicas';

export type SuperUserTabKey = 'borradores' | 'eliminadas' | 'activas' | 'historicas';

export type SortOption = '' | 'recent' | 'material' | 'creator';

export type DashboardMetric = {
  key: DashboardTabKey;
  label: string;
  value: string;
  valueColor: string;
};

export type RfqTipo = 'Trimming' | 'Mold';

export type DashboardRow = {
  id: string;
  material: string;
  createdBy: string;
  date: string;
  supplier: string;
  tipo?: RfqTipo;
  status?: string;
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
