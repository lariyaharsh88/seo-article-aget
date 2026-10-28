import { NextResponse } from "next/server";
import { guardUsage } from "@/lib/usage-guard";
import { resolveSerperKey } from "@/lib/api-keys";
import { fetchSerpPages } from "@/lib/serp-pages";
import { extractTermsFromPages, type CoverageTerm } from "@/lib/term-coverage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface TermCoverageResponse {
  keyword: string;
  competitors: { url: string; title: string; wordCount: number }[];
  terms: CoverageTerm[];
  avgWordCount: number;
  medianWordCount: number;
  headingsSample: string[];
}

const TTL = 30 * 60 * 1000;
const cache = new Map<string, { at: number; data: TermCoverageResponse }>();

export async function POST(request: Request) {
  const guard = await guardUsage(request, "step");
  if (!guard.ok) return guard.response;

  let body: { keyword?: unknown; country?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  if (!keyword) return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  const country =
    typeof body.country === "string" && /^[a-z]{2}$/i.test(body.country)
      ? body.country.toLowerCase()
      : undefined;

  const apiKey = resolveSerperKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Serper API key is missing. Add one in settings to analyze top-ranking pages." },
      { status: 401 },
    );
  }

  const key = `${keyword.toLowerCase()}|${country ?? ""}`;
  const now = Date.now();
  cache.forEach((v, k) => {
    if (now - v.at > TTL) cache.delete(k);
  });
  const hit = cache.get(key);
  if (hit) return NextResponse.json(hit.data);

  try {
    const pages = await fetchSerpPages(keyword, apiKey, country);
    if (pages.length < 2) {
      return NextResponse.json(
        { error: "Could not fetch enough competitor pages to analyze." },
        { status: 502 },
      );
    }
    const extracted = extractTermsFromPages(pages, keyword);
    const data: TermCoverageResponse = {
      keyword,
      competitors: pages.map((p) => ({ url: p.url, title: p.title, wordCount: p.wordCount })),
      ...extracted,
    };
    cache.set(key, { at: now, data });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Term coverage analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
