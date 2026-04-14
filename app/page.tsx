import type { Metadata } from "next";
import Link from "next/link";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { JsonLd } from "@/components/JsonLd";
import { SampleOutputSection } from "@/components/home/SampleOutputSection";
import { buildPageMetadata } from "@/lib/seo-page";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { buildHomePageSchema } from "@/lib/schema-org";
export const metadata: Metadata = buildPageMetadata({
  title: "SEO Tools for Content, SERP Research & Outreach",
  description:
    "RankFlowHQ: SERP research, AI SEO articles, backlink outreach, education Google Trends, and news digests—research keywords, draft content, and plan links in one toolkit.",
  path: "/",
  keywords: [
    "SEO tools",
    "AI article writer",
    "SERP research",
    "backlink outreach",
    "education trends",
    "content SEO",
  ],
});

const tools = [
  {
    href: "/blogs",
    title: "Blog",
    tag: "Articles",
    description:
      "Product updates and SEO tooling notes. New posts are published from the admin CMS.",
  },
  {
    href: "/news",
    title: "News",
    tag: "Education · SEO",
    description:
      "Repurposed education news—exam updates, boards, and higher ed stories published as SEO-friendly articles on RankFlowHQ.",
  },
  {
    href: "/seo-agent",
    title: "SEO article pipeline",
    tag: "Gemini · Tavily · Serper",
    description:
      "From topic and SERP signals to a researched, cited long-form draft: keywords, outline, streaming article, SEO package, and SVG infographics from your data.",
  },
  {
    href: "/repurpose-url",
    title: "Repurpose from URL",
    tag: "Same pipeline · URL in",
    description:
      "Paste any public article URL and run the full pipeline—title from the page, Tavily research, outline, new draft, SEO audit, and optional visual HTML.",
  },
  {
    href: "/ai-seo-toolkit",
    title: "AI SEO Toolkit",
    tag: "SQLite · OpenRouter",
    description:
      "MVP: AI visibility tracking (brand in LLM answers), prompt mining (Google suggest + AI questions), and AEO content optimizer with local scoring.",
  },
  {
    href: "/off-page-seo",
    title: "Off-page SEO & outreach",
    tag: "Serper · Gemini · Contacts",
    description:
      "Backlink prospecting from SERP discovery: estimated DA, INR price bands, public emails, and a prioritized outreach table — export CSV.",
  },
  {
    href: "/education-trends",
    title: "Education Google Trends",
    tag: "Trends · India seeds",
    description:
      "Explore education-related Top and Rising queries, interest-over-time charts, and geo presets using Google Trends signals.",
  },
  {
    href: "/education-news",
    title: "Education news digest",
    tag: "RSS · Multi-source",
    description:
      "Latest headlines from major education publishers (Shiksha, Careers360, Jagran Josh, and more) pulled from public sitemaps.",
  },
] as const;

export default function HomePage() {
  const pipelineSteps = [
    "Keyword",
    "Research",
    "SERP",
    "Outline",
    "Article",
    "SEO Audit",
    "Enrichment",
  ] as const;

  return (
    <>
      <JsonLd data={buildHomePageSchema()} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <header className="mb-8 rounded-2xl border border-border bg-surface/70 px-6 py-10 shadow-sm md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            RankFlowHQ
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-text-primary md:text-5xl">
            Build SEO Articles That Rank on Google &amp; ChatGPT Automatically
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-lg text-text-secondary">
            From keyword research to fully optimized articles with SERP insights,
            citations, and AI enrichment — all in one pipeline.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/seo-agent"
              className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              Generate Article
            </Link>
            <Link
              href="#tools-grid"
              className="rounded-lg border border-border px-5 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              Try Free Tools
            </Link>
          </div>
          <p className="mt-3 font-mono text-xs text-text-muted">
            No signup required • Free tier available
          </p>
        </header>

        <section className="mb-12 rounded-2xl border border-border bg-background/60 p-5 md:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Pipeline
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
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
        </section>

        {ADSENSE_SLOTS.homeTop ? (
          <div className="mb-10 space-y-2">
            <p className="text-center font-mono text-[10px] uppercase tracking-wider text-text-muted">
              Advertisement
            </p>
            <AdSenseSlot
              slot={ADSENSE_SLOTS.homeTop}
              className="flex justify-center"
              minHeight={100}
            />
          </div>
        ) : null}

        <SampleOutputSection />

        <ul id="tools-grid" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface/80 p-6 shadow-sm transition-all duration-200 hover:border-accent hover:bg-surface"
              >
                <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                  {tool.tag}
                </span>
                <h2 className="mt-2 font-display text-xl text-text-primary transition-colors group-hover:text-accent">
                  {tool.title}
                </h2>
                <p className="mt-3 flex-1 font-serif text-sm leading-relaxed text-text-secondary">
                  {tool.description}
                </p>
                <span className="mt-4 font-mono text-xs text-accent">
                  Open tool →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
