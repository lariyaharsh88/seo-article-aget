export interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
  sitelinks?: Array<{ title?: string; link?: string }>;
}

export interface SerperPeopleAlsoAskItem {
  question?: string;
  snippet?: string;
  title?: string;
  link?: string;
}

export interface SerperRelatedSearch {
  query?: string;
}

export interface SerperResponse {
  organic?: SerperOrganicItem[];
  peopleAlsoAsk?: SerperPeopleAlsoAskItem[];
  relatedSearches?: SerperRelatedSearch[];
  news?: SerperOrganicItem[];
}

export async function serperSearch(
  query: string,
  apiKey: string,
  type: "search" | "news" = "search",
): Promise<SerperResponse> {
  const endpoint =
    type === "news"
      ? "https://google.serper.dev/news"
      : "https://google.serper.dev/search";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      throw new Error(
        "Serper rate limit reached. Wait a moment and try again, or check your plan limits.",
      );
    }
    throw new Error(`Serper error ${res.status}: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as SerperResponse;
}

export function extractRelatedQueries(data: SerperResponse): string[] {
  const out: string[] = [];
  for (const r of data.relatedSearches ?? []) {
    if (r.query) out.push(r.query);
  }
  return out;
}

export function extractSitelinkTexts(data: SerperResponse): string[] {
  const out: string[] = [];
  for (const o of data.organic ?? []) {
    for (const s of o.sitelinks ?? []) {
      if (s.title) out.push(s.title);
    }
  }
  return out;
}
