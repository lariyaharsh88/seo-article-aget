import { discoverCompetitorsAndSources } from "@/lib/off-page-seo/discover";
import {
  estimateDaFromSightings,
  estimateSpamScore,
  estimateTrafficBand,
  guessLinkType,
} from "@/lib/off-page-seo/estimate-metrics";
import { extractContactsForDomain } from "@/lib/off-page-seo/extract-contacts";
import { estimatePriceInr } from "@/lib/off-page-seo/price-inr";
import type { BacklinkOpportunity } from "@/lib/off-page-seo/types";

/** Keeps serverless runs within reasonable wall time (contact fetches per domain). */
const MAX_ENRICH = 36;
const BATCH = 6;

export async function enrichSightings(
  rawDomain: string,
  country: string,
  niche: string,
  serperKey: string,
): Promise<{
  opportunities: BacklinkOpportunity[];
  queriesRun: number;
  discovered: number;
}> {
  const { sightings, queriesRun } = await discoverCompetitorsAndSources(
    rawDomain,
    country,
    niche,
    serperKey,
  );

  const top = sightings.slice(0, MAX_ENRICH);
  const opportunities: BacklinkOpportunity[] = [];

  for (let i = 0; i < top.length; i += BATCH) {
    const slice = top.slice(i, i + BATCH);
    const batch = await Promise.all(
      slice.map(async (s) => {
        const estimated_da = estimateDaFromSightings(s);
        const spam_score = estimateSpamScore(s.snippets);
        const type = guessLinkType(s.snippets, s.titles);
        const traffic_estimate = estimateTrafficBand(estimated_da);
        const estimated_price = estimatePriceInr(estimated_da);
        const contacts = await extractContactsForDomain(s.domain);

        const row: BacklinkOpportunity = {
          domain: s.domain,
          type,
          estimated_da,
          traffic_estimate,
          spam_score,
          contact_email: contacts.emails[0] ?? null,
          contact_page: contacts.contact_page,
          social_twitter: contacts.twitter,
          social_linkedin: contacts.linkedin,
          estimated_price,
          priority_score: 0,
          category: "",
          action: "",
          notes:
            "DA, traffic, and spam scores are modeled estimates (no Moz/Ahrefs key). Verify before budget.",
        };
        return row;
      }),
    );
    opportunities.push(...batch);
  }

  return {
    opportunities,
    queriesRun,
    discovered: sightings.length,
  };
}
