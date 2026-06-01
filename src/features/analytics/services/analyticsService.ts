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
  { key: 'revision', label: 'Awaiting Authorization' },
  { key: 'activas', label: 'Active' },
  { key: 'historicas', label: 'Historical' },
];

export const dashboardMetrics: DashboardMetric[] = [
  { key: 'borradores', label: 'RFQs Drafts', value: '2', valueColor: 'var(--bocar-blue-100)' },
  { key: 'revision', label: 'RFQs Under Review', value: '1', valueColor: 'var(--bocar-review)' },
  { key: 'activas', label: 'RFQs Active', value: '3', valueColor: 'var(--bocar-done)' },
  { key: 'historicas', label: 'RFQs Historical', value: '10', valueColor: 'var(--bocar-neutral)' },
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
    { id: 'RFQ-004', material: 'Steel', createdBy: 'Ricardo Soto', date: '20/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Draft' },
    { id: 'RFQ-006', material: 'Aluminum', createdBy: 'Ricardo Soto', date: '17/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Draft' },
    { id: 'RFQ-009', material: 'Plastic', createdBy: 'Ricardo Soto', date: '17/06/2024', supplier: 'Bosch', tipo: 'Trimming', status: 'Draft' },
    { id: 'RFQ-001', material: 'Steel', createdBy: 'Ricardo Soto', date: '20/06/2024', supplier: 'Magna', tipo: 'Mold', status: 'Draft' },
    { id: 'RFQ-011', material: 'Steel', createdBy: 'Gabriela Ruiz', date: '14/06/2024', supplier: 'Metalsa', tipo: 'Trimming', status: 'Draft' },
    { id: 'RFQ-013', material: 'Resin', createdBy: 'Laura Flores', date: '13/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Draft' },
  ],
  revision: [
    { id: 'RFQ-014', material: 'Steel', createdBy: 'Ricardo Soto', date: '21/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Under Review' },
    { id: 'RFQ-015', material: 'Aluminum', createdBy: 'Sofia Lara', date: '18/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Under Review' },
    { id: 'RFQ-016', material: 'Plastic', createdBy: 'Antonio Leon', date: '16/06/2024', supplier: 'Bosch', tipo: 'Trimming', status: 'Under Review' },
    { id: 'RFQ-017', material: 'Resin', createdBy: 'Valeria Cruz', date: '12/06/2024', supplier: 'Metalsa', tipo: 'Mold', status: 'Under Review' },
  ],
  activas: [
    { id: 'RFQ-021', material: 'Steel', createdBy: 'Ricardo Soto', date: '22/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Active' },
    { id: 'RFQ-022', material: 'Plastic', createdBy: 'Karina Diaz', date: '18/06/2024', supplier: 'Bosch', tipo: 'Mold', status: 'Active' },
    { id: 'RFQ-023', material: 'Aluminum', createdBy: 'Jorge Pineda', date: '15/06/2024', supplier: 'Nemak', tipo: 'Trimming', status: 'Active' },
    { id: 'RFQ-024', material: 'Steel', createdBy: 'Laura Flores', date: '11/06/2024', supplier: 'Metalsa', tipo: 'Mold', status: 'Active' },
  ],
  historicas: [
    { id: 'RFQ-031', material: 'Steel', createdBy: 'Ricardo Soto', date: '05/06/2024', supplier: 'Magna', tipo: 'Trimming', status: 'Historical' },
    { id: 'RFQ-032', material: 'Aluminum', createdBy: 'Karina Diaz', date: '03/06/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Historical' },
    { id: 'RFQ-033', material: 'Plastic', createdBy: 'Ricardo Soto', date: '29/05/2024', supplier: 'Bosch', tipo: 'Trimming', status: 'Historical' },
    { id: 'RFQ-034', material: 'Steel', createdBy: 'Jorge Pineda', date: '28/05/2024', supplier: 'Magna', tipo: 'Mold', status: 'Historical' },
    { id: 'RFQ-035', material: 'Resin', createdBy: 'Laura Flores', date: '22/05/2024', supplier: 'Metalsa', tipo: 'Trimming', status: 'Historical' },
    { id: 'RFQ-036', material: 'Steel', createdBy: 'Ana Campos', date: '18/05/2024', supplier: 'Magna', tipo: 'Mold', status: 'Historical' },
    { id: 'RFQ-037', material: 'Aluminum', createdBy: 'Sofia Lara', date: '15/05/2024', supplier: 'Nemak', tipo: 'Trimming', status: 'Historical' },
    { id: 'RFQ-038', material: 'Plastic', createdBy: 'Antonio Leon', date: '13/05/2024', supplier: 'Bosch', tipo: 'Mold', status: 'Historical' },
    { id: 'RFQ-039', material: 'Steel', createdBy: 'Valeria Cruz', date: '10/05/2024', supplier: 'Metalsa', tipo: 'Trimming', status: 'Historical' },
    { id: 'RFQ-040', material: 'Resin', createdBy: 'Ricardo Soto', date: '07/05/2024', supplier: 'Nemak', tipo: 'Mold', status: 'Historical' },
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
    { id: 'RFQ-051', material: 'Steel', createdBy: 'Ricardo Soto', date: '19/06/2024', supplier: 'Magna' },
    { id: 'RFQ-052', material: 'Aluminum', createdBy: 'Sofia Lara', date: '15/06/2024', supplier: 'Nemak' },
    { id: 'RFQ-053', material: 'Plastic', createdBy: 'Antonio Leon', date: '10/06/2024', supplier: 'Bosch' },
    { id: 'RFQ-054', material: 'Resin', createdBy: 'Karina Diaz', date: '08/06/2024', supplier: 'Metalsa' },
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
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [row.id, row.material, row.createdBy].some((field) =>
        field.toLowerCase().includes(normalizedSearch),
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
    if (sortValue === 'material') {
      return leftRow.material.localeCompare(rightRow.material, 'es');
    }

    if (sortValue === 'creator') {
      return leftRow.createdBy.localeCompare(rightRow.createdBy, 'es');
    }

    return parseDateValue(rightRow.date) - parseDateValue(leftRow.date);
  });
}
