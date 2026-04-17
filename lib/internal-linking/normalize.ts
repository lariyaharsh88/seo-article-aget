/** Lowercase, collapse spaces — for keyword matching. */
export function normalizePhrase(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function tokenize(text: string): string[] {
  const m = text.toLowerCase().match(/[a-z0-9]+/g);
  return m ?? [];
}

export function primaryFromKeywords(
  kws: { phrase: string; role?: string }[],
): string | undefined {
  const p = kws.find((k) => k.role === "primary");
  return p?.phrase?.trim() || kws[0]?.phrase?.trim();
}
