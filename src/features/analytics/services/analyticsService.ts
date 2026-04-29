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
  { key: 'borradores', label: 'Borradores' },
  { key: 'revision', label: 'Espera de Autorización' },
  { key: 'activas', label: 'Activas' },
  { key: 'historicas', label: 'Históricas' },
];

export const dashboardMetrics: DashboardMetric[] = [
  { key: 'borradores', label: 'RFQs Borradores', value: '2', valueColor: 'var(--bocar-blue-100)' },
  { key: 'revision', label: 'RFQs en Revisión', value: '1', valueColor: 'var(--bocar-review)' },
  { key: 'activas', label: 'RFQs Activas', value: '3', valueColor: 'var(--bocar-done)' },
  { key: 'historicas', label: 'RFQs Históricas', value: '10', valueColor: 'var(--bocar-neutral)' },
];

export const monthlyRfqSeries: ChartPoint[] = [
  { month: 'Ene', value: 3.1 },
  { month: 'Feb', value: 4.8 },
  { month: 'Mar', value: 3.5 },
  { month: 'Abr', value: 5.2 },
  { month: 'May', value: 6.9 },
  { month: 'Jun', value: 8.4 },
];

export const dashboardRowsByTab: Record<DashboardTabKey, DashboardRow[]> = {
  borradores: [
    { id: 'RFQ-004', material: 'Acero', createdBy: 'Ricardo Soto', date: '20/06/2024', supplier: 'Magna' },
    { id: 'RFQ-006', material: 'Aluminio', createdBy: 'Ricardo Soto', date: '17/06/2024', supplier: 'Nemak' },
    { id: 'RFQ-009', material: 'Plastico', createdBy: 'Ricardo Soto', date: '17/06/2024', supplier: 'Bosch' },
    { id: 'RFQ-001', material: 'Acero', createdBy: 'Ricardo Soto', date: '20/06/2024', supplier: 'Magna' },
    { id: 'RFQ-011', material: 'Acero', createdBy: 'Gabriela Ruiz', date: '14/06/2024', supplier: 'Metalsa' },
    { id: 'RFQ-013', material: 'Resina', createdBy: 'Laura Flores', date: '13/06/2024', supplier: 'Nemak' },
  ],
  revision: [
    { id: 'RFQ-014', material: 'Acero', createdBy: 'Ricardo Soto', date: '21/06/2024', supplier: 'Magna' },
    { id: 'RFQ-015', material: 'Aluminio', createdBy: 'Sofia Lara', date: '18/06/2024', supplier: 'Nemak' },
    { id: 'RFQ-016', material: 'Plastico', createdBy: 'Antonio Leon', date: '16/06/2024', supplier: 'Bosch' },
    { id: 'RFQ-017', material: 'Resina', createdBy: 'Valeria Cruz', date: '12/06/2024', supplier: 'Metalsa' },
  ],
  activas: [
    { id: 'RFQ-021', material: 'Acero', createdBy: 'Ricardo Soto', date: '22/06/2024', supplier: 'Magna' },
    { id: 'RFQ-022', material: 'Plastico', createdBy: 'Karina Diaz', date: '18/06/2024', supplier: 'Bosch' },
    { id: 'RFQ-023', material: 'Aluminio', createdBy: 'Jorge Pineda', date: '15/06/2024', supplier: 'Nemak' },
    { id: 'RFQ-024', material: 'Acero', createdBy: 'Laura Flores', date: '11/06/2024', supplier: 'Metalsa' },
  ],
  historicas: [
    { id: 'RFQ-031', material: 'Acero', createdBy: 'Ricardo Soto', date: '05/06/2024', supplier: 'Magna' },
    { id: 'RFQ-032', material: 'Aluminio', createdBy: 'Karina Diaz', date: '03/06/2024', supplier: 'Nemak' },
    { id: 'RFQ-033', material: 'Plastico', createdBy: 'Ricardo Soto', date: '29/05/2024', supplier: 'Bosch' },
    { id: 'RFQ-034', material: 'Acero', createdBy: 'Jorge Pineda', date: '28/05/2024', supplier: 'Magna' },
    { id: 'RFQ-035', material: 'Resina', createdBy: 'Laura Flores', date: '22/05/2024', supplier: 'Metalsa' },
    { id: 'RFQ-036', material: 'Acero', createdBy: 'Ana Campos', date: '18/05/2024', supplier: 'Magna' },
    { id: 'RFQ-037', material: 'Aluminio', createdBy: 'Sofia Lara', date: '15/05/2024', supplier: 'Nemak' },
    { id: 'RFQ-038', material: 'Plastico', createdBy: 'Antonio Leon', date: '13/05/2024', supplier: 'Bosch' },
    { id: 'RFQ-039', material: 'Acero', createdBy: 'Valeria Cruz', date: '10/05/2024', supplier: 'Metalsa' },
    { id: 'RFQ-040', material: 'Resina', createdBy: 'Ricardo Soto', date: '07/05/2024', supplier: 'Nemak' },
  ],
};

export const superuserTabs: SuperUserTab[] = [
  { key: 'borradores', label: 'Borradores' },
  { key: 'eliminadas', label: 'RFQs Eliminadas' },
  { key: 'activas', label: 'Activas' },
  { key: 'historicas', label: 'Históricas' },
];

export const superuserMetrics: SuperUserMetric[] = [
  { key: 'borradores', label: 'RFQs Borradores', value: '2', valueColor: 'var(--bocar-blue-100)' },
  { key: 'eliminadas', label: 'RFQs Eliminadas', value: '4', valueColor: '#AA000F' },
  { key: 'activas', label: 'RFQs Activas', value: '3', valueColor: 'var(--bocar-done)' },
  { key: 'historicas', label: 'RFQs Históricas', value: '10', valueColor: 'var(--bocar-neutral)' },
];

export const superuserRowsByTab: Record<SuperUserTabKey, DashboardRow[]> = {
  borradores: dashboardRowsByTab.borradores,
  eliminadas: [
    { id: 'RFQ-051', material: 'Acero', createdBy: 'Ricardo Soto', date: '19/06/2024', supplier: 'Magna' },
    { id: 'RFQ-052', material: 'Aluminio', createdBy: 'Sofia Lara', date: '15/06/2024', supplier: 'Nemak' },
    { id: 'RFQ-053', material: 'Plastico', createdBy: 'Antonio Leon', date: '10/06/2024', supplier: 'Bosch' },
    { id: 'RFQ-054', material: 'Resina', createdBy: 'Karina Diaz', date: '08/06/2024', supplier: 'Metalsa' },
  ],
  activas: dashboardRowsByTab.activas,
  historicas: dashboardRowsByTab.historicas,
};

function parseDateValue(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

export function getFilteredDashboardRows(
  rows: DashboardRow[],
  searchValue: string,
  supplierValue: string,
  sortValue: SortOption,
) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [row.id, row.material, row.createdBy].some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      );
    const matchesSupplier = supplierValue.length === 0 || row.supplier === supplierValue;

    return matchesSearch && matchesSupplier;
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
