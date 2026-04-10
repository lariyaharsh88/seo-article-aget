import type { Metadata } from "next";
import { EducationNewsDashboard } from "@/components/education-news/NewsDashboard";
import {
  fetchAllSitemaps,
  getUniqueSources,
} from "@/lib/education-news/fetchSitemaps";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Education news",
  description:
    "Education articles from Shiksha, CollegeDunia, Careers360, Jagran Josh, and Testbook (today in IST).",
};

export default async function EducationNewsPage() {
  const articles = await fetchAllSitemaps();
  const sources = getUniqueSources(articles);

  return <EducationNewsDashboard initialArticles={articles} initialSources={sources} />;
}
