import type { SerperOrganicItem } from "@/lib/serper";

export interface DomainSighting {
  domain: string;
  positions: number[];
  snippets: string[];
  titles: string[];
}

const SPAM_HINTS =
  /\b(casino|viagra|crypto airdrop|porn|xxx|lottery|forex signal|get rich quick)\b/i;

export function estimateTrafficBand(estimatedDa: number): string {
  if (estimatedDa < 25) return "<25K/mo (est.)";
  if (estimatedDa < 45) return "25K–100K/mo (est.)";
  if (estimatedDa < 65) return "100K–500K/mo (est.)";
  return "500K+/mo (est.)";
}

/** Moz-like DA 1–95 from SERP visibility (no paid API). */
export function estimateDaFromSightings(s: DomainSighting): number {
  const n = s.positions.length;
  if (n === 0) return 25;
  const avgPos = s.positions.reduce((a, b) => a + b, 0) / n;
  const minP = Math.min(...s.positions);
  // More appearances + better average rank → higher score
  const visibility = Math.min(40, n * 6 + (11 - Math.min(10, avgPos)) * 2.5);
  const peak = Math.min(25, (11 - Math.min(10, minP)) * 3);
  const raw = 15 + visibility + peak;
  return Math.max(12, Math.min(92, Math.round(raw)));
}

export function estimateSpamScore(snippets: string[]): number {
  const blob = snippets.join(" ").slice(0, 4000);
  if (SPAM_HINTS.test(blob)) return 8;
  let h = 0;
  for (let i = 0; i < blob.length; i++) h = (h + blob.charCodeAt(i) * (i + 1)) % 4;
  return Math.min(5, 1 + h);
}

export function guessLinkType(snippets: string[], titles: string[]): string {
  const t = `${titles.join(" ")} ${snippets.join(" ")}`.toLowerCase();
  if (/\bwrite for us|guest post|submit (a )?article|contributor\b/.test(t)) {
    return "Guest Post";
  }
  if (/\bdirectory|list of (sites|colleges)|resource page\b/.test(t)) {
    return "Directory / list";
  }
  if (/\bforum|community thread|reddit\b/.test(t)) return "Forum / community";
  return "Editorial / site";
}

export function organicDomainHits(
  organic: SerperOrganicItem[] | undefined,
  positionOffset: number,
): Array<{ domain: string; position: number; title?: string; snippet?: string }> {
  const out: Array<{
    domain: string;
    position: number;
    title?: string;
    snippet?: string;
  }> = [];
  if (!organic) return out;
  organic.forEach((o, i) => {
    const link = o.link?.trim();
    if (!link) return;
    try {
      const host = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
      if (!host) return;
      out.push({
        domain: host,
        position: positionOffset + i + 1,
        title: o.title,
        snippet: o.snippet,
      });
    } catch {
      /* skip */
    }
  });
  return out;
}
