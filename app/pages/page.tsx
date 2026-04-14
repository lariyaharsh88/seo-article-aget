import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildCollectionPageSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "All Pages",
  description:
    "Browse all RankFlowHQ page types: tools, free tools, blogs, landing pages, and public article pages.",
  path: "/pages",
});

const groups = [
  {
    heading: "Core Tools",
    items: [
      { href: "/seo-agent", label: "SEO Article Pipeline" },
      { href: "/ai-seo-toolkit", label: "AI SEO Toolkit" },
      { href: "/repurpose-url", label: "Repurpose URL" },
      { href: "/off-page-seo", label: "Off-page SEO" },
      { href: "/keyword-clustering-tool", label: "Keyword Clustering Tool" },
    ],
  },
  {
    heading: "Free Tools",
    items: [
      { href: "/free-tools/keyword-clustering", label: "Free Keyword Clustering" },
      { href: "/free-tools/llms-txt-generator", label: "LLMs.txt Generator" },
      { href: "/free-tools/ai-search-grader", label: "AI Search Grader" },
      { href: "/free-tools/keyword-extractor", label: "Keyword Extractor" },
    ],
  },
  {
    heading: "Blog & Content",
    items: [
      { href: "/blog", label: "Blog Index" },
      { href: "/blogs", label: "Legacy Blog Index" },
      { href: "/blog/ai-seo/ai-seo-tools-guide", label: "Programmatic SEO Example" },
      { href: "/seo-agent", label: "Public Articles (generated via /article/[slug])" },
    ],
  },
  {
    heading: "SEO Landing Pages",
    items: [
      { href: "/ai-seo-tools", label: "AI SEO Tools" },
      { href: "/automate-blog-writing-ai", label: "Automate Blog Writing AI" },
      { href: "/generative-engine-optimization", label: "Generative Engine Optimization" },
      { href: "/ai-content-automation", label: "AI Content Automation" },
    ],
  },
] as const;

export default function PagesDirectory() {
  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/pages",
          headline: "All Pages",
          description: "Directory of all major RankFlowHQ page types and tools.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "All Pages", path: "/pages" },
          ],
        })}
      />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl text-text-primary md:text-5xl">All Pages</h1>
        <p className="mt-3 font-serif text-sm text-text-secondary">
          Browse all page types in one place, similar to the old homepage listing.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <section key={group.heading} className="rounded-xl border border-border bg-surface/60 p-5">
              <h2 className="font-display text-2xl text-text-primary">{group.heading}</h2>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-mono text-xs text-text-secondary transition-colors hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

