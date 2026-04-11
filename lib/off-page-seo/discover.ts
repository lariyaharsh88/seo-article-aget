import { serperSearch } from "@/lib/serper";
import {
  hostnameFromUrl,
  isProspectDomain,
  normalizeInputDomain,
  rootDomainKey,
} from "@/lib/off-page-seo/domains";
import { organicDomainHits } from "@/lib/off-page-seo/estimate-metrics";
import type { DomainSighting } from "@/lib/off-page-seo/estimate-metrics";

function mergeSighting(
  map: Map<string, DomainSighting>,
  domain: string,
  position: number,
  title?: string,
  snippet?: string,
) {
  const key = rootDomainKey(domain);
  const cur =
    map.get(key) ??
    ({ domain: key, positions: [], snippets: [], titles: [] } satisfies DomainSighting);
  cur.positions.push(position);
  if (snippet?.trim()) cur.snippets.push(snippet.trim());
  if (title?.trim()) cur.titles.push(title.trim());
  map.set(key, cur);
}

const MAX_QUERIES = 10;

export async function discoverCompetitorsAndSources(
  rawDomain: string,
  country: string,
  niche: string,
  serperKey: string,
): Promise<{ sightings: DomainSighting[]; queriesRun: number }> {
  const exclude = normalizeInputDomain(rawDomain);
  const map = new Map<string, DomainSighting>();

  const queries: string[] = [
    `${niche} blogs ${country}`,
    `best ${niche} websites ${country}`,
    `${niche} write for us`,
    `guest post ${niche} ${country}`,
    `top ${niche} sites`,
    `${niche} websites list ${country}`,
    `popular ${niche} blogs`,
    `submit guest post ${niche}`,
  ];

  let queriesRun = 0;
  for (const q of queries) {
    if (queriesRun >= MAX_QUERIES) break;
    try {
      const data = await serperSearch(q, serperKey, "search");
      queriesRun += 1;
      const organic = data.organic ?? [];
      for (const hit of organicDomainHits(organic, 0)) {
        if (!isProspectDomain(hit.domain, exclude)) continue;
        mergeSighting(map, hit.domain, hit.position, hit.title, hit.snippet);
      }
      for (const p of data.peopleAlsoAsk ?? []) {
        const link = p.link?.trim();
        if (!link) continue;
        const host = hostnameFromUrl(link);
        if (!host || !isProspectDomain(host, exclude)) continue;
        mergeSighting(map, host, 11, p.title, p.snippet);
      }
    } catch {
      /* Serper error — try next query */
    }
  }

  const sightings = Array.from(map.values()).filter((s) => s.positions.length > 0);
  sightings.sort((a, b) => {
    const avg = (s: DomainSighting) =>
      s.positions.reduce((x, y) => x + y, 0) / s.positions.length;
    return avg(a) - avg(b);
  });

  return { sightings, queriesRun };
}
