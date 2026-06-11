import type { SupplierRfqRow } from '@/features/supplier/types';

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
