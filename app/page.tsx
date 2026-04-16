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
    { id: "01", title: "Brief your topic", body: "Add keyword, audience, and source context in seconds." },
    { id: "02", title: "Generate with AI workflow", body: "Research, outline, article, and SEO package are built in one run." },
    { id: "03", title: "Publish and scale", body: "Ship optimized pages faster with reusable internal-link ready structure." },
  ] as const;
  const featureCards = [
    {
      title: "AI SEO Agent",
      description: "From SERP data to rankable draft with metadata and citation-aware structure.",
      metric: "One guided flow from brief to publish package",
      href: "/seo-agent",
      icon: "⚡",
    },
    {
      title: "Free SEO Tools",
      description: "Keyword clustering, graders, and extraction tools for fast tactical wins.",
      metric: "Instant utility tools for day-one improvements",
      href: "/free-tools",
      icon: "🧩",
    },
    {
      title: "Repurpose Engine",
      description: "Turn existing URLs into fresh, optimized articles without starting from zero.",
      metric: "Reuse existing content with cleaner SEO structure",
      href: "/repurpose-url",
      icon: "🔁",
    },
    {
      title: "Off-page Workflows",
      description: "Prospecting and outreach support to complement on-page growth programs.",
      metric: "Supporting workflows for compounding visibility",
      href: "/off-page-seo",
      icon: "🌐",
    },
    {
      title: "AI Search Visibility",
      description: "Improve discoverability across Google, ChatGPT, and answer-engine surfaces.",
      metric: "Coverage across search and answer interfaces",
      href: "/free-tools/ai-search-grader",
      icon: "📈",
    },
    {
      title: "Content System",
      description: "Create consistent outputs with a clean editor, scorecard, and reusable briefs.",
      metric: "Repeatable output quality without manual chaos",
      href: "/pages",
      icon: "📝",
    },
  ] as const;
  const pricingTiers = [
    {
      name: "Starter",
      price: "Free",
      subtitle: "For creators getting started",
      points: ["Core free tools", "Workflow previews", "Public resources library"],
      cta: "Start Free",
      href: "/free-tools",
      highlight: false,
    },
    {
      name: "Growth",
      price: "Scale",
      subtitle: "For teams scaling output",
      points: ["SEO Agent workflow", "Pipeline + enrichment", "Production-ready outputs"],
      cta: "Start Free",
      href: "/seo-agent",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      subtitle: "For high-volume operations",
      points: ["Custom process design", "Priority support", "Advanced implementation guidance"],
      cta: "Talk to Sales",
      href: "/pricing",
      highlight: false,
    },
  ] as const;
  const testimonials = [
    {
      quote:
        "RankFlowHQ turned our content ops from scattered tasks into a repeatable growth engine.",
      name: "Growth Lead",
      company: "B2B SaaS Team",
    },
    {
      quote:
        "The workflow clarity is excellent. We ship better articles faster, with cleaner SEO fundamentals.",
      name: "Content Manager",
      company: "Marketing Agency",
    },
    {
      quote:
        "Great balance of automation and control. It feels like a serious production tool, not a toy.",
      name: "Founder",
      company: "D2C Brand",
    },
  ] as const;
  const trustLogos = ["Product Team", "Growth Studio", "SEO Ops", "Content Lab", "AI Search Desk"] as const;
  const trustMetrics = [
    { label: "Unified workflow", value: "Research → Draft → SEO pack" },
    { label: "Team-ready process", value: "Consistent outputs across writers" },
    { label: "Fast launch path", value: "Start with free tools, scale with agent" },
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
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="premium-noise relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-surface/80 to-surface/40 p-6 shadow-[0_18px_80px_rgba(2,6,23,0.45)] backdrop-blur-sm md:p-10">
          <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-purple/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                AI SEO Platform
              </span>
              <h1 className="text-balance mt-4 max-w-4xl font-display text-[clamp(2rem,6vw,4.2rem)] leading-[1.05] text-text-primary">
                Publish ranking-ready SEO content in a single, trusted workflow.
              </h1>
              <p className="mt-4 max-w-2xl font-serif text-base leading-relaxed text-text-secondary md:text-lg">
                RankFlowHQ combines keyword research, SERP intelligence, generation, and optimization
                so teams can ship faster with higher consistency and lower editorial overhead.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/seo-agent"
                  className="rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                >
                  Start Free
                </Link>
                <Link
                  href="/pages"
                  className="rounded-xl border border-border/90 bg-surface/60 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary"
                >
                  Explore Product
                </Link>
              </div>
              <p className="mt-3 font-mono text-[11px] text-text-muted">
                Trusted workflow design for operators who care about quality, speed, and control.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/60 p-4 shadow-inner shadow-black/20">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                Workflow preview
              </p>
              <div className="mt-4 grid gap-2">
                {[
                  "Keyword intent clustering",
                  "Source-backed research context",
                  "SERP outline + draft generation",
                  "Metadata and SEO score package",
                  "Publish-ready enriched HTML",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-border/70 bg-surface/60 px-3 py-2 font-serif text-sm text-text-secondary"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-border/70 bg-surface/30 px-4 py-4 md:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Trusted by performance-focused teams
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {trustLogos.map((logo) => (
              <div
                key={logo}
                className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-center font-mono text-[11px] text-text-secondary"
              >
                {logo}
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {trustMetrics.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{item.label}</p>
                <p className="mt-1 font-serif text-xs text-text-secondary">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Features</p>
              <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
                Everything you need for modern SEO execution
              </h2>
            </div>
            <Link href="/pages" className="hidden font-mono text-xs text-accent hover:underline sm:block">
              Explore all tools →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-2xl border border-border/80 bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-surface/80"
              >
                <p className="text-2xl">{card.icon}</p>
                <h3 className="mt-3 font-display text-xl text-text-primary group-hover:text-accent">
                  {card.title}
                </h3>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">
                  {card.description}
                </p>
                <p className="mt-3 font-mono text-[11px] text-text-muted">{card.metric}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-border/80 bg-surface/40 p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">How it works</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            A simple 3-step growth workflow
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pipelineSteps.map((step) => (
              <div key={step.id} className="rounded-xl border border-border/70 bg-background/40 p-4">
                <span className="font-mono text-xs text-accent">{step.id}</span>
                <h3 className="mt-2 font-display text-xl text-text-primary">{step.title}</h3>
                <p className="mt-2 font-serif text-sm text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-surface/50 p-6">
            <h2 className="font-display text-2xl text-text-primary">Recent posts</h2>
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
                <li className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 font-serif text-sm text-text-muted">
                  No recent posts yet.
                  <Link href="/seo-agent" className="ml-1 font-mono text-xs text-accent hover:underline">
                    Start your first workflow →
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/80 bg-surface/50 p-6">
            <h2 className="font-display text-2xl text-text-primary">Trending now</h2>
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
                <li className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 font-serif text-sm text-text-muted">
                  No trending signals yet.
                  <Link href="/free-tools" className="ml-1 font-mono text-xs text-accent hover:underline">
                    Use free tools to publish faster →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Social proof</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Trusted by growth-focused teams
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.quote} className="rounded-2xl border border-border/80 bg-surface/50 p-5">
                <p className="font-serif text-sm leading-relaxed text-text-secondary">“{item.quote}”</p>
                <p className="mt-4 font-mono text-xs text-text-primary">
                  {item.name} · <span className="text-text-muted">{item.company}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-border/80 bg-surface/40 p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Why teams switch</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Less tool-hopping. More publish-ready output.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Clear process",
                body: "Every run follows a dependable structure, reducing quality variance across contributors.",
              },
              {
                title: "Faster handoff",
                body: "Outputs are organized for quick review so strategy, content, and SEO can move together.",
              },
              {
                title: "Trustable execution",
                body: "Built for teams that need speed without sacrificing editorial control and clarity.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-border/70 bg-background/40 p-4">
                <h3 className="font-display text-xl text-text-primary">{item.title}</h3>
                <p className="mt-2 font-serif text-sm text-text-secondary">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Pricing</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Choose the right growth setup
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-5 ${
                  tier.highlight
                    ? "border-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                    : "border-border/80 bg-surface/50"
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{tier.name}</p>
                <p className="mt-2 font-display text-3xl leading-none text-text-primary">{tier.price}</p>
                <p className="mt-1 font-serif text-sm text-text-secondary">{tier.subtitle}</p>
                <ul className="mt-4 space-y-2 font-serif text-sm text-text-secondary">
                  {tier.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-5 inline-flex rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    tier.highlight
                      ? "bg-accent text-background hover:opacity-90"
                      : "border border-border text-text-secondary hover:border-accent/70 hover:text-text-primary"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-border/80 bg-gradient-to-r from-surface/80 to-surface/40 p-6 md:p-10">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">
            Ready to scale SEO with a premium AI workflow?
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">
            Start with the SEO Agent, then expand across tools, templates, and growth workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/seo-agent"
              className="rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              Start Free
            </Link>
            <Link
              href="/pages"
              className="rounded-xl border border-border/80 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary"
            >
              See How It Works
            </Link>
          </div>
          <p className="mt-3 font-mono text-[11px] text-text-muted">
            Minimal setup. Immediate workflow clarity.
          </p>
        </section>
      </main>
    </>
  );
}
