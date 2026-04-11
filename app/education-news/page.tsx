import type { Metadata } from "next";
import { EducationNewsDashboard } from "@/components/education-news/NewsDashboard";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";
import { buildPageMetadata } from "@/lib/seo-page";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const metadata: Metadata = buildPageMetadata({
  title: "Education news",
  description:
    "Education articles from Shiksha, CollegeDunia, Careers360, Jagran Josh, and Testbook — updated from sitemaps (today in IST).",
  path: "/education-news",
});

export default async function EducationNewsPage() {
  const articles = await fetchAllSitemaps();
  const sources = getUniqueSources(articles);
  const explainerMd = await getToolExplainerMarkdown("education-news");

  return (
    <>
      <EducationNewsDashboard initialArticles={articles} initialSources={sources} />
      <ToolExplainerSection markdown={explainerMd} />
    </>
  );
}
