export function formatId(id: number): string {
  return `RFQ-${String(id).padStart(4, '0')}`;
}

export function parseId(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

