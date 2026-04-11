import { NextResponse } from "next/server";
import { marked } from "marked";
import { resolveGeminiKey } from "@/lib/api-keys";
import { classifySection } from "@/lib/seo-enrichment/classify-section";
import { extractH1AndSections } from "@/lib/seo-enrichment/extract-sections";
import { extractNumericSeries } from "@/lib/seo-enrichment/extract-numeric-series";
import {
  geminiComparisonTableHtml,
  geminiImagePrompt,
} from "@/lib/seo-enrichment/llm-helpers";
import { mockSectionImageUrl } from "@/lib/seo-enrichment/mock-image-url";
import { buildPollinationsImageUrl } from "@/lib/seo-enrichment/pollinations-url";
import { buildBarChartUrl } from "@/lib/seo-enrichment/quickchart-url";
import type { EnrichedSectionLog, VisualKind } from "@/lib/seo-enrichment/types";

export const maxDuration = 120;

const MAX_SECTIONS = 10;

export async function POST(request: Request) {
  const geminiKey = resolveGeminiKey(request);

  let body: { markdown?: string; keyword?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const markdown = body.markdown?.trim();
  if (!markdown || markdown.length < 80) {
    return NextResponse.json(
      { error: "markdown is required (min ~80 chars)." },
      { status: 400 },
    );
  }

  const keyword = body.keyword?.trim() || "SEO article";

  marked.setOptions({ gfm: true });

  const { h1, intro, sections } = extractH1AndSections(markdown);
  const slice = sections.slice(0, MAX_SECTIONS);
  const logs: EnrichedSectionLog[] = [];

  const parts: string[] = [];
  parts.push(`<article class="seo-enriched prose prose-invert max-w-none">`);

  if (h1) {
    parts.push(`<h1>${escapeHtml(h1)}</h1>`);
  }
  if (intro) {
    parts.push(
      `<div class="seo-enriched-intro">${await marked.parse(intro)}</div>`,
    );
  }

  for (let i = 0; i < slice.length; i++) {
    const sec = slice[i];
    let kind: VisualKind = classifySection(sec.body, sec.title);
    const sectionId = `section-${i + 1}`;

    parts.push(
      `<section id="${sectionId}" class="seo-enriched-section mt-10">`,
    );
    parts.push(`<h2>${escapeHtml(sec.title)}</h2>`);

    let chartUrl: string | null = null;
    let tableHtml: string | null = null;

    if (kind === "chart") {
      const series = extractNumericSeries(sec.body);
      if (series) {
        chartUrl = buildBarChartUrl(
          series.labels,
          series.values,
          sec.title,
        );
        logs.push({
          title: sec.title,
          kind: "chart",
          detail: `QuickChart (${series.values.length} values)`,
        });
      } else {
        kind = "illustration";
      }
    }

    if (kind === "table" && geminiKey) {
      try {
        tableHtml = await geminiComparisonTableHtml(sec.body, sec.title, geminiKey);
        logs.push({ title: sec.title, kind: "table", detail: "HTML table" });
      } catch (e) {
        logs.push({
          title: sec.title,
          kind: "table",
          detail: `Skipped: ${e instanceof Error ? e.message : "error"}`,
        });
      }
    } else if (kind === "table" && !geminiKey) {
      logs.push({
        title: sec.title,
        kind: "table",
        detail: "Skipped (no Gemini key)",
      });
    }

    /** Hero image under every H2 — Gemini prompt + Pollinations (free URL, no OpenAI). */
    let heroUrl: string;
    if (geminiKey) {
      try {
        const prompt = await geminiImagePrompt(
          sec.title,
          sec.body,
          keyword,
          geminiKey,
        );
        heroUrl = buildPollinationsImageUrl(prompt);
        logs.push({
          title: sec.title,
          kind: "illustration",
          detail: "Pollinations image (Gemini prompt)",
        });
      } catch (e) {
        heroUrl = mockSectionImageUrl(sec.title, i);
        logs.push({
          title: sec.title,
          kind: "illustration",
          detail: `Placeholder: ${e instanceof Error ? e.message : "error"}`,
        });
      }
    } else {
      heroUrl = mockSectionImageUrl(sec.title, i);
      if (!logs.some((l) => l.title === sec.title && l.kind === "illustration")) {
        logs.push({
          title: sec.title,
          kind: "illustration",
          detail: "Placeholder image (set GEMINI_API_KEY for AI prompts)",
        });
      }
    }

    parts.push(
      `<figure class="my-4"><img class="h-auto w-full max-w-3xl rounded-lg border border-border" src="${escapeAttr(heroUrl)}" alt="${escapeAttr(sec.title)}" width="1024" height="576" loading="lazy" decoding="async" /></figure>`,
    );

    if (tableHtml) {
      parts.push(
        `<div class="seo-enriched-table my-4 overflow-x-auto">${tableHtml}</div>`,
      );
    }

    const bodyHtml = await marked.parse(sec.body);
    parts.push(`<div class="seo-enriched-body mt-4">${bodyHtml}</div>`);

    if (chartUrl) {
      parts.push(
        `<figure class="my-6"><img class="h-auto w-full max-w-3xl rounded-lg border border-border" src="${escapeAttr(chartUrl)}" alt="Chart: ${escapeAttr(sec.title)}" loading="lazy" decoding="async" /></figure>`,
      );
    }

    parts.push(`</section>`);
  }

  parts.push(`</article>`);

  const html = parts.join("\n");

  return NextResponse.json({
    html,
    sections: slice.length,
    logs,
    hasGemini: Boolean(geminiKey),
    /** Section heroes use Pollinations when Gemini is configured (no paid image API). */
    heroImageSource: geminiKey ? "pollinations" : "placeholder",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
