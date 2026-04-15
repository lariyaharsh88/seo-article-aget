import type { Metadata } from "next";
import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildHomePageSchema } from "@/lib/schema-org";
export const metadata: Metadata = buildPageMetadata({
  title: "AI SEO Automation Platform",
  description:
    "Build SEO articles that rank on Google and ChatGPT using AI automation.",
  path: "/",
  keywords: [
    "SEO tools",
    "AI article writer",
    "SERP research",
    "backlink outreach",
    "chatgpt seo",
    "content SEO",
  ],
});

type HomeLinkItem = {
  title: string;
  href: string;
  updatedAt: Date;
};

export default async function HomePage() {
  const pipelineSteps = [
    "Keyword",
    "Research",
    "SERP",
    "Outline",
    "Article",
    "SEO Audit",
    "Enrichment",
  ] as const;
  let recentPosts: HomeLinkItem[] = [];
  let trending: HomeLinkItem[] = [];
  try {
    const [newsRows, blogRows, articleRows] = await Promise.all([
      prisma.educationNewsArticle.findMany({
        where: {
          repurposeStatus: "ready",
          repurposedSlug: { not: null },
          siteDomain: SiteDomain.education,
        },
        select: { title: true, repurposedSlug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.blogPost.findMany({
        where: {
          published: true,
          siteDomain: SiteDomain.main,
        },
        select: { title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.sharedArticle.findMany({
        where: { siteDomain: SiteDomain.main },
        select: { title: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

    const merged: HomeLinkItem[] = [
      ...newsRows
        .filter((r) => Boolean(r.repurposedSlug?.trim()))
        .map((r) => ({
          title: r.title,
          href: `/news/${encodeURIComponent((r.repurposedSlug as string).trim())}`,
          updatedAt: r.updatedAt,
        })),
      ...blogRows.map((r) => ({
        title: r.title,
        href: `/blog/${encodeURIComponent(r.slug)}`,
        updatedAt: r.updatedAt,
      })),
      ...articleRows.map((r) => ({
        title: r.title,
        href: `/article/${encodeURIComponent(r.slug)}`,
        updatedAt: r.updatedAt,
      })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    recentPosts = merged.slice(0, 8);

    // Trending heuristic: freshest in last 72h, weighted by recency.
    const windowMs = 72 * 60 * 60 * 1000;
    const now = Date.now();
    trending = merged
      .filter((x) => now - x.updatedAt.getTime() <= windowMs)
      .slice(0, 6);
  } catch (e) {
    console.error("[home] recent/trending query failed:", e);
  }

  return (
    <>
      <JsonLd data={buildHomePageSchema()} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <section className="rounded-2xl border border-border bg-surface/70 px-6 py-10 shadow-sm md:px-10 md:py-12">
          <h1 className="max-w-4xl font-display text-4xl leading-tight text-text-primary md:text-5xl">
            Build SEO Articles That Rank on Google &amp; ChatGPT Automatically
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-base text-text-secondary md:text-lg">
            From keyword research to fully optimized content with SERP insights, citations, and AI enrichment.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/seo-agent"
              className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              Generate Article
            </Link>
            <Link
              href="/pages"
              className="rounded-lg border border-border px-5 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              Try Free Tools
            </Link>
          </div>
          <div className="mt-8 rounded-xl border border-border/80 bg-background/60 p-4 md:p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Pipeline
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pipelineSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-secondary">
                    {step}
                  </span>
                  {index < pipelineSteps.length - 1 ? (
                    <span className="font-mono text-xs text-text-muted">→</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="tools-grid" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/keyword-clustering-tool", label: "Keyword Clustering" },
            { href: "/ai-seo-toolkit", label: "AI SEO Toolkit" },
            { href: "/off-page-seo", label: "Off-page SEO" },
            { href: "/repurpose-url", label: "Repurpose URL" },
            { href: "/free-tools/keyword-clustering", label: "Free Keyword Clustering" },
            { href: "/free-tools/keyword-extractor", label: "Keyword Extractor" },
            { href: "/free-tools/ai-search-grader", label: "AI Search Grader" },
            { href: "/free-tools/llms-txt-generator", label: "LLMs.txt Generator" },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-xl border border-border bg-surface/50 px-4 py-3 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              {tool.label}
            </Link>
          ))}
        </section>
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/55 p-5">
            <h2 className="font-display text-2xl text-text-primary">
              Recent posts
            </h2>
            <p className="mt-1 font-serif text-sm text-text-secondary">
              Fresh internal links to newly published stories and articles.
            </p>
            <ul className="mt-4 space-y-2">
              {recentPosts.length > 0 ? (
                recentPosts.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="font-serif text-sm text-accent hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="font-serif text-sm text-text-muted">Recent items will appear here.</li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface/55 p-5">
            <h2 className="font-display text-2xl text-text-primary">
              Trending now
            </h2>
            <p className="mt-1 font-serif text-sm text-text-secondary">
              High-freshness picks to accelerate crawl discovery.
            </p>
            <ul className="mt-4 space-y-2">
              {trending.length > 0 ? (
                trending.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="font-serif text-sm text-accent hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="font-serif text-sm text-text-muted">Trending items will appear here.</li>
              )}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
