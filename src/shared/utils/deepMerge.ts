function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merges `override` onto `base`, recursing into plain objects only.
 * Arrays and primitives in `override` replace the value in `base`.
 * `base` is not mutated. Keys present in `override` with `undefined` are ignored.
 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : (override as T));
  }
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    result[key] = isPlainObject(result[key]) && isPlainObject(value)
      ? deepMerge(result[key], value)
      : value;
  }
  return result as T;
}
