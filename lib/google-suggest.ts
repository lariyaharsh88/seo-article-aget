/**
 * Fetches Google Search autocomplete suggestions (unofficial suggest endpoint).
 */
export async function fetchGoogleSearchSuggestions(query: string): Promise<
  string[]
> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SEO-Article-Agent/1.0; +https://github.com)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Suggest request failed (${res.status})`);
  }

  const text = await res.text();
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data) || data.length < 2) return [];

  const suggestions = data[1];
  if (!Array.isArray(suggestions)) return [];

  const out: string[] = [];
  for (const item of suggestions) {
    if (Array.isArray(item) && typeof item[0] === "string") {
      const s = item[0].trim();
      if (s) out.push(s);
    } else if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
    }
  }
  return out;
}
