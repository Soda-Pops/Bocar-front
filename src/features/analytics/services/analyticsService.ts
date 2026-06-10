import type {
  ChartPoint,
  DashboardMetric,
  DashboardRow,
  DashboardTab,
  DashboardTabKey,
  DashboardUser,
  SortOption,
  SuperUserTabKey,
} from '@/features/analytics/types';

type SuperUserMetric = { key: SuperUserTabKey; label: string; value: string; valueColor: string };
type SuperUserTab = { key: SuperUserTabKey; label: string };

export const dashboardUser: DashboardUser = {
  initials: 'AR',
  name: 'Aniaram Rodriguez',
  department: 'Ing.Materiales',
};

export const dashboardTabs: DashboardTab[] = [
  { key: 'borradores', label: 'Drafts' },
  { key: 'activas', label: 'Active' },
  { key: 'historicas', label: 'Closed' },
];

export const dashboardMetrics: DashboardMetric[] = [
  { key: 'borradores', label: 'RFQs Drafts', value: '2', valueColor: 'var(--bocar-blue-100)' },
  { key: 'activas', label: 'RFQs Active', value: '3', valueColor: 'var(--bocar-done)' },
  { key: 'historicas', label: 'RFQs Closed', value: '10', valueColor: 'var(--bocar-neutral)' },
];

export const monthlyRfqSeries: ChartPoint[] = [
  { month: 'Jan', value: 3.1 },
  { month: 'Feb', value: 4.8 },
  { month: 'Mar', value: 3.5 },
  { month: 'Apr', value: 5.2 },
  { month: 'May', value: 6.9 },
  { month: 'Jun', value: 8.4 },
];

export const dashboardRowsByTab: Record<DashboardTabKey, DashboardRow[]> = {
  borradores: [
    { id: 'RFQ-004', createdBy: 'Ricardo Soto', date: '20/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Draft' },
    { id: 'RFQ-006', createdBy: 'Ricardo Soto', date: '17/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Draft' },
    { id: 'RFQ-009', createdBy: 'Ricardo Soto', date: '17/06/2024', supplier: 'Bosch', tipo: 'Trimming', status: 'Draft' },
    { id: 'RFQ-001', createdBy: 'Ricardo Soto', date: '20/06/2024', supplier: 'Magna', tipo: 'Mold', status: 'Draft' },
    { id: 'RFQ-011', createdBy: 'Gabriela Ruiz', date: '14/06/2024', supplier: 'Metalsa', tipo: 'Trimming', status: 'Draft' },
    { id: 'RFQ-013', createdBy: 'Laura Flores', date: '13/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Draft' },
  ],
  activas: [
    { id: 'RFQ-021', createdBy: 'Ricardo Soto', date: '22/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Active' },
    { id: 'RFQ-022', createdBy: 'Karina Diaz', date: '18/06/2024', supplier: 'Bosch', tipo: 'Mold', status: 'Active' },
    { id: 'RFQ-023', createdBy: 'Jorge Pineda', date: '15/06/2024', supplier: 'Nemak', tipo: 'Trimming', status: 'Active' },
    { id: 'RFQ-024', createdBy: 'Laura Flores', date: '11/06/2024', supplier: 'Metalsa', tipo: 'Mold', status: 'Active' },
  ],
  historicas: [
    { id: 'RFQ-031', createdBy: 'Ricardo Soto', date: '05/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Closed' },
    { id: 'RFQ-032', createdBy: 'Karina Diaz', date: '03/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Closed' },
    { id: 'RFQ-033', createdBy: 'Ricardo Soto', date: '29/05/2024', supplier: 'Bosch', tipo: 'Trimming', status: 'Closed' },
    { id: 'RFQ-034', createdBy: 'Jorge Pineda', date: '28/05/2024', supplier: 'Magna', tipo: 'Mold', status: 'Closed' },
    { id: 'RFQ-035', createdBy: 'Laura Flores', date: '22/05/2024', supplier: 'Metalsa', tipo: 'Trimming', status: 'Closed' },
    { id: 'RFQ-036', createdBy: 'Ana Campos', date: '18/05/2024', supplier: 'Magna', tipo: 'Mold', status: 'Closed' },
    { id: 'RFQ-037', createdBy: 'Sofia Lara', date: '15/05/2024', supplier: 'Nemak', tipo: 'Trimming', status: 'Closed' },
    { id: 'RFQ-038', createdBy: 'Antonio Leon', date: '13/05/2024', supplier: 'Bosch', tipo: 'Mold', status: 'Closed' },
    { id: 'RFQ-039', createdBy: 'Valeria Cruz', date: '10/05/2024', supplier: 'Metalsa', tipo: 'Trimming', status: 'Closed' },
    { id: 'RFQ-040', createdBy: 'Ricardo Soto', date: '07/05/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Closed' },
  ],
};

export const superuserTabs: SuperUserTab[] = [
  { key: 'borradores', label: 'Drafts' },
  { key: 'eliminadas', label: 'Deleted RFQs' },
  { key: 'activas', label: 'Active' },
  { key: 'historicas', label: 'Historical' },
];

export const superuserMetrics: SuperUserMetric[] = [
  { key: 'borradores', label: 'RFQs Drafts', value: '2', valueColor: 'var(--bocar-blue-100)' },
  { key: 'eliminadas', label: 'Deleted RFQs', value: '4', valueColor: '#AA000F' },
  { key: 'activas', label: 'RFQs Active', value: '3', valueColor: 'var(--bocar-done)' },
  { key: 'historicas', label: 'RFQs Historical', value: '10', valueColor: 'var(--bocar-neutral)' },
];

export const superuserRowsByTab: Record<SuperUserTabKey, DashboardRow[]> = {
  borradores: dashboardRowsByTab.borradores,
  eliminadas: [
    { id: 'RFQ-051', createdBy: 'Ricardo Soto', date: '19/06/2024', supplier: 'Magna', status: 'Deleted', tipo: 'Mold' },
    { id: 'RFQ-052', createdBy: 'Sofia Lara', date: '15/06/2024', supplier: 'Nemak', status: 'Deleted', tipo: 'Trimming' },
    { id: 'RFQ-053', createdBy: 'Antonio Leon', date: '10/06/2024', supplier: 'Bosch', status: 'Deleted', tipo: 'Mold' },
    { id: 'RFQ-054', createdBy: 'Karina Diaz', date: '08/06/2024', supplier: 'Metalsa', status: 'Deleted', tipo: 'Trimming' },
  ],
  activas: dashboardRowsByTab.activas,
  historicas: dashboardRowsByTab.historicas,
};

function parseDateValue(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function getMonthYearKey(date: string) {
  const [, month, year] = date.split('/');
  return `${month}/${year}`;
}

export function getMonthLabel(monthYearKey: string) {
  const [month, year] = monthYearKey.split('/');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(month) - 1]} ${year}`;
}

export function getDateOptions(rows: DashboardRow[]): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const row of rows) {
    const key = getMonthYearKey(row.date);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys.map(getMonthLabel);
}

export function getFilteredDashboardRows(
  rows: DashboardRow[],
  searchValue: string,
  supplierValue: string,
  sortValue: SortOption,
  tipoValue?: string,
  dateValue?: string,
) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredRows = rows.filter((row) => {
    // Busca sobre los campos reales del backend: ID, DESC, TYPE, STATUS, DATE, CREATED BY.
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [row.id, row.desc ?? '', row.tipo ?? '', row.status ?? '', row.date, row.createdBy].some(
        (field) => field.toLowerCase().includes(normalizedSearch),
      );
    const matchesSupplier = supplierValue.length === 0 || row.supplier === supplierValue;
    const matchesTipo = !tipoValue || tipoValue.length === 0 || row.tipo === tipoValue;
    const matchesDate =
      !dateValue ||
      dateValue.length === 0 ||
      getMonthLabel(getMonthYearKey(row.date)) === dateValue;

    return matchesSearch && matchesSupplier && matchesTipo && matchesDate;
  });

  return [...filteredRows].sort((leftRow, rightRow) => {
    if (sortValue === 'creator') {
      return leftRow.createdBy.localeCompare(rightRow.createdBy, 'es');
    }

    return parseDateValue(rightRow.date) - parseDateValue(leftRow.date);
  });
}
