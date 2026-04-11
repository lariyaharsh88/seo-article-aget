import { NextResponse } from "next/server";
import { resolveGeminiKey, resolveSerperKey } from "@/lib/api-keys";
import { enrichSightings } from "@/lib/off-page-seo/enrich";
import {
  applyGeminiPrioritization,
  applyRulePrioritization,
} from "@/lib/off-page-seo/prioritize";

/** Vercel / long-running: increase on Pro if timeouts occur. */
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const serperKey = resolveSerperKey(request);
    const geminiKey = resolveGeminiKey(request);
    if (!serperKey) {
      return NextResponse.json(
        { error: "Missing Serper API key (header or SERPER_API_KEY)." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      domain?: string;
      country?: string;
      niche?: string;
    };
    const domain = typeof body.domain === "string" ? body.domain.trim() : "";
    const country =
      typeof body.country === "string" && body.country.trim()
        ? body.country.trim()
        : "India";
    const niche =
      typeof body.niche === "string" && body.niche.trim()
        ? body.niche.trim()
        : "General";

    if (!domain) {
      return NextResponse.json({ error: "domain is required." }, { status: 400 });
    }

    const { opportunities, queriesRun, discovered } = await enrichSightings(
      domain,
      country,
      niche,
      serperKey,
    );

    let final = opportunities;
    if (geminiKey && final.length > 0) {
      final = await applyGeminiPrioritization(final, niche, geminiKey);
    } else {
      final = applyRulePrioritization(final);
    }
    final.sort((a, b) => b.priority_score - a.priority_score);

    return NextResponse.json({
      opportunities: final,
      meta: {
        input_domain: domain,
        country,
        niche,
        serper_queries_run: queriesRun,
        domains_discovered: discovered,
        domains_enriched: final.length,
        note:
          "Heuristic DA/traffic and INR bands are estimates without Moz/Ahrefs. Contacts are best-effort from public pages; verify deliverability. Gemini refines priority when GEMINI_API_KEY is set.",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Off-page SEO run failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
