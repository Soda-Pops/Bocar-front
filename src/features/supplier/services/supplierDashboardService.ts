import type { SupplierMetric, SupplierRfqRow } from '@/features/supplier/types';
import { misAsignaciones } from '@/features/supplier/services/asignacionesService';

export const supplierMetrics: SupplierMetric[] = [
  { key: 'assigned', label: 'ASSIGNED RFQs', value: '6', valueColor: 'var(--bocar-blue-100)' },
  { key: 'pending', label: 'PENDING RFQs', value: '3', valueColor: '#c8970a' },
  { key: 'quoted', label: 'QUOTED RFQs', value: '3', valueColor: '#5a8a1f' },
  { key: 'historical', label: 'HISTORICAL RFQs', value: '6', valueColor: 'var(--bocar-blue-50)' },
];

export const assignedRows: SupplierRfqRow[] = [
  { id: 'RFQ-021', status: 'PENDING', tipo: 'Trimming', deadline: '20/06/2024' },
  { id: 'RFQ-004', status: 'QUOTED', tipo: 'Mold', deadline: '20/06/2024' },
  { id: 'RFQ-005', status: 'QUOTED', tipo: 'Trimming', deadline: '20/06/2024' },
  { id: 'RFQ-022', status: 'PENDING', tipo: 'Mold', deadline: '22/06/2024' },
  { id: 'RFQ-006', status: 'QUOTED', tipo: 'Trimming', deadline: '25/06/2024' },
  { id: 'RFQ-023', status: 'PENDING', tipo: 'Mold', deadline: '28/06/2024' },
];

export const historicalRows: SupplierRfqRow[] = [
  { id: 'RFQ-010', status: 'DONE', tipo: 'Mold', deadline: '10/04/2024' },
  { id: 'RFQ-011', status: 'DONE', tipo: 'Mold', deadline: '12/04/2024' },
  { id: 'RFQ-012', status: 'DONE', tipo: 'Trimming', deadline: '18/04/2024' },
  { id: 'RFQ-013', status: 'DONE', tipo: 'Mold', deadline: '22/04/2024' },
  { id: 'RFQ-014', status: 'DONE', tipo: 'Trimming', deadline: '01/05/2024' },
  { id: 'RFQ-015', status: 'DONE', tipo: 'Mold', deadline: '15/05/2024' },
];

export function getFilteredRows(
  rows: SupplierRfqRow[],
  search: string,
  deadline: string,
): SupplierRfqRow[] {
  let result = rows;
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        (r.desc ?? '').toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q),
    );
  }
  if (deadline) {
    result = result.filter((r) => r.deadline === deadline);
  }
  return result;
}

export async function fetchSupplierDashboardData(): Promise<{
  assignedRows: SupplierRfqRow[];
  historicalRows: SupplierRfqRow[];
  supplierMetrics: SupplierMetric[];
}> {
  const data = await misAsignaciones();
  return {
    assignedRows: data.assignedRows,
    historicalRows: data.historicalRows,
    supplierMetrics: data.metrics,
  };
}
