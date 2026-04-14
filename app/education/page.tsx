import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Education Hub",
  description:
    "Education tools hub for trends, news aggregation, and archived education coverage.",
  path: "/education",
  keywords: ["education tools", "education trends", "education news"],
});

export default function EducationHubPage() {
  const stack = [
    "Sitemaps",
    "Realtime Scan",
    "News Aggregator",
    "Repurpose",
    "SEO Publish",
  ] as const;

  const tools = [
    {
      href: "/education-news",
      title: "Education News Aggregator",
      tag: "RSS + Sitemap",
      description:
        "Track education headlines from established education domains and sync them for publishing workflows.",
    },
    {
      href: "/education-trends",
      title: "Education Google Trends",
      tag: "Google Trends",
      description:
        "Explore top and rising education searches with geo presets and trend-window controls.",
    },
    {
      href: "/news",
      title: "Education News Articles",
      tag: "Indexable News",
      description:
        "Browse all repurposed education news pages under /news with crawlable, indexable URLs.",
    },
  ] as const;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Education Hub",
    description:
      "Education tools and education news publishing surface on education.rankflowhq.com.",
    url: "/education",
  } as Record<string, unknown>;

  return (
    <>
      <JsonLd data={schema} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <section className="rounded-2xl border border-border bg-surface/70 px-6 py-10 shadow-sm md:px-10 md:py-12">
          <h1 className="max-w-4xl font-display text-4xl leading-tight text-text-primary md:text-5xl">
            Education Growth Stack for News and Trends
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-base text-text-secondary md:text-lg">
            Monitor education trends, aggregate education news, and publish SEO-ready education stories from one workflow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/education-news"
              className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              Open News Aggregator
            </Link>
            <Link
              href="/news"
              className="rounded-lg border border-border px-5 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              Browse News Pages
            </Link>
          </div>
          <div className="mt-8 rounded-xl border border-border/80 bg-background/60 p-4 md:p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Workflow
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {stack.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-secondary">
                    {step}
                  </span>
                  {index < stack.length - 1 ? (
                    <span className="font-mono text-xs text-text-muted">→</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-xl border border-border bg-surface/60 p-5 transition-colors hover:border-accent/50"
            >
              <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                {tool.tag}
              </span>
              <h2 className="mt-2 font-display text-xl text-text-primary">{tool.title}</h2>
              <p className="mt-2 font-serif text-sm text-text-secondary">{tool.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}

