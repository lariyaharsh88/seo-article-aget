import type { Metadata } from "next";
import { EducationNewsDashboard } from "@/components/education-news/NewsDashboard";
import { JsonLd } from "@/components/JsonLd";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import {
  formatLastModTime,
  isToday,
} from "@/lib/education-news/fetchSitemaps";
import type { NewsArticle } from "@/lib/education-news/types";
import type { StoredEducationNewsListItem } from "@/lib/education-news/stored-types";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
/** Sitemap fetch + sync + repurpose run in `/api/education-news` (client refresh), not here. */
export const maxDuration = 60;

const ED_NEWS_DESC =
  "Education news scanner: today’s headlines from Shiksha, CollegeDunia, Careers360, Jagran Josh, and Testbook via sitemaps (IST)—quick discovery for editors and SEO teams.";

const educationNewsSchema = buildToolWebApplicationSchema({
  path: "/education-news",
  name: "Education news digest",
  headline: "Latest education news",
  description: ED_NEWS_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "Education News Digest — Today’s Headlines",
  description: ED_NEWS_DESC,
  path: "/education-news",
  keywords: [
    "education news",
    "India education headlines",
    "exam news",
    "university news",
    "education journalism",
  ],
});

export default async function EducationNewsPage() {
  const explainerMd = await getToolExplainerMarkdown("education-news");

  let storedRows: StoredEducationNewsListItem[] = [];
  let initialArticles: NewsArticle[] = [];
  let initialSources: string[] = [];

  try {
    const rows = await prisma.educationNewsArticle.findMany({
      orderBy: { updatedAt: "desc" },
      take: 120,
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

    const todayRows = rows.filter((r) => isToday(r.lastmod));
    const feedRows =
      todayRows.length > 0 ? todayRows : rows.slice(0, 50);

    initialArticles = feedRows.map((r) => ({
      url: r.url,
      lastmod: r.lastmod,
      source: r.source,
      title: r.title,
      lastModifiedTime: formatLastModTime(r.lastmod),
    }));
    initialSources = Array.from(
      new Set(initialArticles.map((a) => a.source)),
    ).sort();

    storedRows = rows.slice(0, 50).map((r) => ({
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
    console.error("[education-news] DB list:", e);
  }

  return (
    <>
      <JsonLd data={educationNewsSchema} />
      <EducationNewsDashboard
        initialArticles={initialArticles}
        initialSources={initialSources}
        initialStoredRows={storedRows}
      />
      <ToolExplainerSection markdown={explainerMd} />
    </>
  );
}
