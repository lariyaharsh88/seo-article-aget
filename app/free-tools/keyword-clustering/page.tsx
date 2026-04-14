import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { KeywordClusteringToolClient } from "@/components/KeywordClusteringToolClient";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "Free keyword clustering tool by RankFlowHQ. Paste keywords, group by intent, copy clusters, and download CSV with no login required.";

export const metadata: Metadata = buildPageMetadata({
  title: "Free Keyword Clustering Tool",
  description: DESC,
  path: "/free-tools/keyword-clustering",
  keywords: [
    "free keyword clustering tool",
    "keyword clustering",
    "seo keyword grouping tool",
    "keyword cluster generator",
  ],
});

const appSchema = buildToolWebApplicationSchema({
  path: "/free-tools/keyword-clustering",
  name: "Free Keyword Clustering Tool",
  headline: "Free Keyword Clustering Tool",
  description: DESC,
});

export default function FreeKeywordClusteringPage() {
  return (
    <>
      <JsonLd data={appSchema} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/" className="text-text-muted transition-colors hover:text-accent">
            ← Home
          </Link>
        </p>

        <header className="mb-8 mt-4 rounded-2xl border border-border bg-surface/60 p-5 md:p-6">
          <h1 className="font-display text-4xl text-text-primary md:text-5xl">
            Free Keyword Clustering Tool
          </h1>
          <p className="mt-3 max-w-3xl font-serif text-base text-text-secondary">
            Paste your keywords, cluster them by similarity and intent, then copy or
            export CSV for SEO planning.
          </p>
          <p className="mt-2 font-mono text-xs text-text-muted">No login required</p>
        </header>

        <KeywordClusteringToolClient />
      </main>
    </>
  );
}
