import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { FREE_TOOLS, type FreeTool } from "@/lib/free-tools/registry";
import { buildCollectionPageSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Free SEO Tools — No Sign-up",
  description:
    "12 free SEO tools: meta title & description generator, SERP preview, on-page SEO checker, content outline generator, headline generator, readability checker, FAQ schema generator, word counter and more.",
  path: "/free-tools",
  keywords: ["free seo tools", "seo tools online", "free seo checker", "meta tag generator", "serp preview"],
});

const CATEGORIES: Array<{ id: FreeTool["category"]; label: string }> = [
  { id: "On-page", label: "Titles & search snippets" },
  { id: "Writing", label: "Writing & content" },
  { id: "Technical", label: "Technical SEO" },
  { id: "Research", label: "Keyword research" },
];

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
        <h1 className="font-display text-4xl text-text-primary md:text-5xl">Free SEO tools</h1>
        <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">
          Quick, free tools for titles, content and technical SEO. No sign-up, and most run right in your browser.
        </p>

        {CATEGORIES.map((cat) => {
          const tools = FREE_TOOLS.filter((t) => t.category === cat.id);
          if (!tools.length) return null;
          return (
            <section key={cat.id} className="mt-10">
              <h2 className="font-display text-xl text-text-primary">{cat.label}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/free-tools/${tool.slug}`}
                    className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
                  >
                    <h3 className="font-display text-lg text-text-primary transition-colors group-hover:text-accent">{tool.title}</h3>
                    <p className="mt-1.5 font-serif text-sm text-text-secondary">{tool.blurb}</p>
                    <span className="mt-3 inline-block font-mono text-xs text-accent">Open tool →</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-12 rounded-2xl border border-accent/40 bg-accent/10 p-6">
          <h2 className="font-display text-xl text-text-primary">Need the whole article?</h2>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            RankFlowHQ turns one keyword into a researched, SEO-ready article with sources, title and meta description.
          </p>
          <Link href="/seo-agent" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-background hover:opacity-90">
            Write an article — free →
          </Link>
        </section>
      </main>
    </>
  );
}
