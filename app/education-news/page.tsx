import type { Metadata } from "next";
import { EducationNewsDashboard } from "@/components/education-news/NewsDashboard";
import { JsonLd } from "@/components/JsonLd";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";
import { runAutoRepurposeAfterSync } from "@/lib/education-news/auto-repurpose-after-sync";
import { syncEducationNewsArticles } from "@/lib/education-news/sync-stored";
import type { StoredEducationNewsListItem } from "@/lib/education-news/stored-types";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
/** Auto-repurpose after sync can run several Gemini calls; allow headroom on Vercel. */
export const maxDuration = 300;

const ED_NEWS_DESC =
  "Education articles from Shiksha, CollegeDunia, Careers360, Jagran Josh, and Testbook — updated from sitemaps (today in IST).";

const educationNewsSchema = buildToolWebApplicationSchema({
  path: "/education-news",
  name: "Education news",
  headline: "Latest education news",
  description: ED_NEWS_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "Education news",
  description: ED_NEWS_DESC,
  path: "/education-news",
});

export default async function EducationNewsPage() {
  const articles = await fetchAllSitemaps();
  const sources = getUniqueSources(articles);
  const explainerMd = await getToolExplainerMarkdown("education-news");

  let storedRows: StoredEducationNewsListItem[] = [];
  try {
    const { newPendingIds } = await syncEducationNewsArticles(articles);
    await runAutoRepurposeAfterSync(newPendingIds);
    const rows = await prisma.educationNewsArticle.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        url: true,
        title: true,
        source: true,
        lastmod: true,
        repurposeStatus: true,
        repurposedAt: true,
        repurposedMarkdown: true,
        repurposedSlug: true,
        repurposedCanonicalUrl: true,
        updatedAt: true,
      },
    });
    storedRows = rows.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      source: r.source,
      lastmod: r.lastmod,
      updatedAt: r.updatedAt.toISOString(),
      repurposeStatus: r.repurposeStatus,
      repurposedAt: r.repurposedAt?.toISOString() ?? null,
      repurposedExcerpt: r.repurposedMarkdown
        ? r.repurposedMarkdown.slice(0, 200).trim()
        : null,
      repurposedPath: r.repurposedSlug?.trim()
        ? `/news/${r.repurposedSlug.trim()}`
        : null,
      repurposedCanonicalUrl: r.repurposedCanonicalUrl?.trim() || null,
    }));
  } catch (e) {
    console.error("[education-news] DB sync / list:", e);
  }

  return (
    <>
      <JsonLd data={educationNewsSchema} />
      <EducationNewsDashboard
        initialArticles={articles}
        initialSources={sources}
        initialStoredRows={storedRows}
      />
      <ToolExplainerSection markdown={explainerMd} />
    </>
  );
}
