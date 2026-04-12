/** Shared page size for `/blogs` and `/news` index listings. */
export const LIST_PAGE_SIZE = 10;

/**
 * Parse `?page=` from URL search params. Returns integer ≥ 1, or 1 for missing/invalid.
 */
export function parseListPageParam(
  raw: string | string[] | undefined,
): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(String(s ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}
