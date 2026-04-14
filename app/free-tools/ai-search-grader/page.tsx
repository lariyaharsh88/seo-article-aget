import type { Metadata } from "next";
import Link from "next/link";
import { AiSearchGraderClient } from "@/components/AiSearchGraderClient";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "Free AI Search Grader by RankFlowHQ. Score content for AI answer engines, ChatGPT snippet readiness, and GEO optimization.";

export const metadata: Metadata = buildPageMetadata({
  title: "Free AI Search Grader",
  description: DESC,
  path: "/free-tools/ai-search-grader",
  keywords: ["ai search grader", "geo score tool", "chatgpt seo grader"],
});

const schema = buildToolWebApplicationSchema({
  path: "/free-tools/ai-search-grader",
  name: "Free AI Search Grader",
  headline: "Free AI Search Grader",
  description: DESC,
});

export default function AiSearchGraderPage() {
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
          <h1 className="font-display text-4xl text-text-primary">Free AI Search Grader</h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">No login required.</p>
        </header>
        <AiSearchGraderClient />
      </main>
    </>
  );
}

