import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { KeywordExtractorClient } from "@/components/KeywordExtractorClient";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "Free keyword extractor by RankFlowHQ. Extract high-signal terms from text for SEO briefs and clustering workflows.";

export const metadata: Metadata = buildPageMetadata({
  title: "Free Keyword Extractor",
  description: DESC,
  path: "/free-tools/keyword-extractor",
  keywords: ["keyword extractor", "free seo keyword extractor", "text to keywords"],
});

const schema = buildToolWebApplicationSchema({
  path: "/free-tools/keyword-extractor",
  name: "Free Keyword Extractor",
  headline: "Free Keyword Extractor",
  description: DESC,
});

export default function KeywordExtractorPage() {
  return (
    <>
      <JsonLd data={schema} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/" className="text-text-muted hover:text-accent">
            ← Home
          </Link>
        </p>
        <header className="mb-6 mt-3 rounded-2xl border border-border bg-surface/60 p-5">
          <h1 className="font-display text-4xl text-text-primary">Free Keyword Extractor</h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">No login required.</p>
        </header>
        <KeywordExtractorClient />
      </main>
    </>
  );
}

