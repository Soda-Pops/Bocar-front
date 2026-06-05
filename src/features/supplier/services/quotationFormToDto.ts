function flattenNumericValues(value: unknown, prefix = '', out: Record<string, number | string> = {}) {
  if (value === null || value === undefined) return out;
  if (typeof value === 'number') {
    out[prefix] = value;
    return out;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return out;
    const numeric = Number(trimmed);
    out[prefix] = Number.isNaN(numeric) ? trimmed : numeric;
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenNumericValues(item, `${prefix}_${index}`, out));
    return out;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      flattenNumericValues(child, prefix ? `${prefix}_${key}` : key, out);
    });
  }
  return out;
}

export function quotationFormToDto(values: unknown): Record<string, number | string> {
  const flattened = flattenNumericValues(values);
  return Object.fromEntries(
    Object.entries(flattened).filter(([key]) => !key.includes('basic_data')),
  );
}

