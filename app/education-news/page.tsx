import type { Metadata } from "next";
import { EducationNewsDashboard } from "@/components/education-news/NewsDashboard";
import { JsonLd } from "@/components/JsonLd";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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

  return (
    <>
      <JsonLd data={educationNewsSchema} />
      <EducationNewsDashboard initialArticles={articles} initialSources={sources} />
      <ToolExplainerSection markdown={explainerMd} />
    </>
  );
}
