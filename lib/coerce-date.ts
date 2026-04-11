/**
 * `unstable_cache` and some RSC serialisation paths turn `Date` into ISO strings.
 * Use before calling `.toISOString()` / date formatting on persisted or cached data.
 */
export function coerceDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}
