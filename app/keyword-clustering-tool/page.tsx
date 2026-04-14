import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { KeywordClusteringToolClient } from "@/components/KeywordClusteringToolClient";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "AI Keyword Clustering Tool by RankFlowHQ: group similar keywords instantly, copy clusters, and export CSV for SEO content planning.";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Keyword Clustering Tool — Free SEO Keyword Grouping",
  description: DESC,
  path: "/keyword-clustering-tool",
  keywords: [
    "AI keyword clustering tool",
    "keyword grouping tool",
    "cluster keywords for SEO",
    "free keyword cluster generator",
  ],
});

const appSchema = buildToolWebApplicationSchema({
  path: "/keyword-clustering-tool",
  name: "AI Keyword Clustering Tool",
  headline: "AI Keyword Clustering Tool",
  description: DESC,
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does this keyword clustering tool group terms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It uses similarity scoring across word and character patterns to group related keywords into practical SEO clusters.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export keyword clusters to CSV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. After clustering, use the Download CSV button to export cluster and keyword rows.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to sign up to use this tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The tool is available without login.",
      },
    },
  ],
} as Record<string, unknown>;

export default function KeywordClusteringToolPage() {
  return (
    <>
      <JsonLd data={appSchema} />
      <JsonLd data={faqSchema} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/" className="text-text-muted transition-colors hover:text-accent">
            ← Home
          </Link>
        </p>

        <header className="mb-8 mt-4 space-y-3">
          <h1 className="font-display text-4xl text-text-primary md:text-5xl">
            AI Keyword Clustering Tool
          </h1>
          <p className="max-w-3xl font-serif text-lg text-text-secondary">
            Group similar keywords in seconds to build cleaner topic clusters, better content maps, and stronger internal linking plans.
          </p>
        </header>

        <KeywordClusteringToolClient />

        <section className="mt-10 space-y-4 rounded-2xl border border-border bg-background/60 p-5 md:p-6">
          <h2 className="font-display text-3xl text-text-primary">How to use clusters in SEO</h2>
          <p className="font-serif text-sm text-text-secondary">
            Treat each cluster as one intent group. Build one primary page for each major cluster, then map subtopics as sections or supporting pages.
            This approach reduces cannibalization and improves topical coverage.
          </p>
          <h3 className="font-display text-2xl text-text-primary">Need full article generation too?</h3>
          <p className="font-serif text-sm text-text-secondary">
            Move from clustered keywords to complete long-form drafts in the RankFlowHQ article pipeline.
          </p>
          <Link
            href="/seo-agent"
            className="inline-block rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
          >
            Try RankFlowHQ
          </Link>
        </section>
      </main>
    </>
  );
}
