import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildCollectionPageSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Free SEO Tools",
  description:
    "Use RankFlowHQ free SEO tools: keyword clustering, keyword extraction, AI search grader, and LLMs.txt generator.",
  path: "/free-tools",
});

const freeTools = [
  {
    href: "/free-tools/keyword-clustering",
    title: "Free Keyword Clustering",
    blurb: "Group similar keywords by topic and intent in seconds.",
  },
  {
    href: "/free-tools/keyword-extractor",
    title: "Keyword Extractor",
    blurb: "Extract useful terms from text for SEO planning.",
  },
  {
    href: "/free-tools/ai-search-grader",
    title: "AI Search Grader",
    blurb: "Check and score how your page performs for AI search.",
  },
  {
    href: "/free-tools/llms-txt-generator",
    title: "LLMs.txt Generator",
    blurb: "Generate an LLMs.txt file for your website quickly.",
  },
] as const;

export default function FreeToolsPage() {
  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/free-tools",
          headline: "Free SEO Tools",
          description: "Directory of free RankFlowHQ SEO tools.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "Free Tools", path: "/free-tools" },
          ],
        })}
      />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-text-primary md:text-5xl">
          Free SEO Tools
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-sm text-text-secondary">
          Use these free tools to speed up keyword research and content
          optimisation workflows.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {freeTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl border border-border bg-surface/55 p-5 transition-colors hover:border-accent/45"
            >
              <h2 className="font-display text-2xl text-text-primary transition-colors group-hover:text-accent">
                {tool.title}
              </h2>
              <p className="mt-2 font-serif text-sm text-text-secondary">
                {tool.blurb}
              </p>
              <span className="mt-4 inline-block font-mono text-xs text-accent">
                Open tool →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
