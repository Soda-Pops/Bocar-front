export function parseNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v !== 'string') return 0;
  const trimmed = v.trim();
  if (trimmed === '') return 0;
  const normalized = trimmed.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function mul(a: unknown, b: unknown): number {
  return parseNum(a) * parseNum(b);
}

export function sumColumn(
  rows: ReadonlyArray<Record<string, unknown> | undefined>,
  key: string
): number {
  let total = 0;
  for (const row of rows) {
    if (!row) continue;
    total += parseNum(row[key]);
  }
  return total;
}

export function formatNum(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
