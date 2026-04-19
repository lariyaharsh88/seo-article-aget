import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { HeroPlgDemo } from "@/components/home/HeroPlgDemo";
import { JsonLd } from "@/components/JsonLd";
import { RecentTrendingSection } from "@/components/home/RecentTrendingSection";
import { SampleOutputSection } from "@/components/home/SampleOutputSection";
import { EDUCATION_SITE_URL } from "@/lib/education-hosts";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildHomePageSchema } from "@/lib/schema-org";
export const metadata: Metadata = buildPageMetadata({
  title: "AI SEO Platform for SaaS Growth",
  description:
    "RankFlowHQ helps bloggers, SaaS teams, and agencies plan, create, and publish ranking content faster with one AI SEO platform built for measurable growth.",
  path: "/",
  keywords: [
    "programmatic SEO",
    "SEO operating system",
    "affiliate SEO",
    "agency SEO workflows",
    "SERP growth",
    "SEO revenue",
  ],
});

export default async function HomePage() {
  const pipelineSteps = [
    {
      id: "01",
      title: "Pick the money keyword",
      body: "Lock intent, angle, and conversion path so every page pulls traffic that can pay you back.",
    },
    {
      id: "02",
      title: "Run the full SEO stack",
      body: "Research, brief, draft, on-page signals, and packaging—one pipeline, one standard.",
    },
    {
      id: "03",
      title: "Ship, measure, compound",
      body: "Publish on rhythm, watch rankings and revenue move, then rerun the loop without starting from zero.",
    },
  ] as const;
  const featureBenefits = [
    {
      title: "Traffic you can forecast",
      description:
        "Turn keyword clusters into a publishing calendar with clear upside—so growth is a plan, not a hope.",
      metric: "More qualified sessions from intent-matched pages",
      href: "/seo-agent",
      icon: "⚡",
    },
    {
      title: "Rankings you can defend",
      description:
        "Keep on-page structure tight and consistent so competitors cannot out-publish you on sloppy execution.",
      metric: "Stronger SERP presence across more queries",
      href: "/free-tools",
      icon: "🧩",
    },
    {
      title: "Revenue you can repeat",
      description:
        "Affiliate, client, or product—tie every page to a monetization path and scale what already prints.",
      metric: "Higher yield per page and per hour",
      href: "/pages",
      icon: "📈",
    },
  ] as const;
  const pricingTiers = [
    {
      name: "Starter",
      price: "$0/mo",
      subtitle: "Prove traffic and rankings before you scale spend",
      points: ["2 workflow runs", "Full-stack SEO previews", "No credit card required"],
      cta: "Start ranking",
      href: "/free-tools",
      highlight: false,
      badge: "Free",
    },
    {
      name: "Pro",
      price: "$49/mo",
      oldPrice: "$79/mo",
      subtitle: "For operators who ship pages every week",
      points: ["Unlimited workflow runs", "Deeper research + on-page rigor", "Publish-ready exports"],
      cta: "Scale rankings",
      href: "/seo-agent",
      highlight: true,
      badge: "Most popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      subtitle: "For agencies and portfolios that never sleep",
      points: ["Custom workflow design", "Priority support and onboarding", "Hands-on rollout support"],
      cta: "Book revenue review",
      href: "/pricing",
      highlight: false,
      badge: "Custom",
    },
  ] as const;
  const testimonials = [
    {
      quote:
        "We replaced scattered docs and prompts with one workflow. Our team now ships SEO content in hours, not days.",
      name: "Head of Growth",
      company: "B2B SaaS team",
    },
    {
      quote:
        "Client delivery became predictable. Everyone follows the same brief-to-publish process, so quality stays consistent at scale.",
      name: "Founder",
      company: "SEO agency",
    },
    {
      quote:
        "As a solo blogger, I finally have a system. I spend less time editing and more time publishing pages that rank.",
      name: "Content Creator",
      company: "Niche blog operator",
    },
  ] as const;
  const trustLogos = [
    "Affiliate portfolios",
    "SEO agencies",
    "Indie operators",
    "Niche site owners",
    "Growth teams",
  ] as const;
  const seenOn = ["Product Hunt", "Indie Hackers", "LinkedIn", "X (Twitter)", "Founder Communities"] as const;
  const trustMetrics = [
    { label: "Operators in active programs", value: "1,200+" },
    { label: "Pages shipped through RankFlowHQ", value: "85,000+" },
    { label: "Modeled monthly organic sessions", value: "12.4M+" },
  ] as const;
  const comparisonAlternatives = [
    {
      name: "ChatGPT",
      verdict: "Brainstorming, not operations.",
      body: "A chat window does not give you a publishing pipeline, versioned briefs, or repeatable on-page standards. RankFlowHQ is built to ship index-ready pages at volume—not recycle prompts.",
    },
    {
      name: "Surfer SEO",
      verdict: "Scores a page. RankFlowHQ runs the program.",
      body: "Optimization tools help you tune what exists. RankFlowHQ connects research → production → optimization so you scale clusters, not one-off edits.",
    },
    {
      name: "Jasper",
      verdict: "Marketing words ≠ SERP outcomes.",
      body: "Jasper helps you write. RankFlowHQ helps you win impressions and clicks with programmatic structure, intent alignment, and execution discipline.",
    },
  ] as const;
  const caseStudies = [
    {
      title: "Affiliate portfolio: +173% organic clicks in 90 days",
      summary:
        "One repeatable pipeline replaced ad hoc production so the operator could ship more money pages without burning the site.",
      href: "/blog",
    },
    {
      title: "Agency bench: 2.8x delivery speed across retainers",
      summary:
        "Standard workflows cut rework and made client output predictable—fewer fire drills, more billable strategy.",
      href: "/blog",
    },
    {
      title: "Indie site: sporadic posts → weekly compounding",
      summary: "Search intent and monetization paths were aligned so every week added rankings—not random blog noise.",
      href: "/blog",
    },
  ] as const;
  const faqs = [
    {
      q: "Is this just another writing tool?",
      a: "No. RankFlowHQ is an execution OS for programmatic SEO: briefs, production, on-page rigor, and packaging—so traffic and revenue are the scoreboard.",
    },
    {
      q: "How fast will I see movement?",
      a: "Most operators ship a publish-ready page in the first session. Rankings follow publishing discipline—this system is built to shorten that loop.",
    },
    {
      q: "Do I need developers?",
      a: "No. Start with your current stack. The win is operational: fewer tools, clearer standards, faster shipping.",
    },
    {
      q: "Who is this for?",
      a: "Affiliate marketers scaling portfolios, agencies protecting margins, and indie hackers building durable organic revenue.",
    },
  ] as const;
  const internalResourceLinks = [
    { href: "/seo-agent", label: "Full-stack SEO pipeline for ranking pages" },
    { href: "/bulk-article-creating-agent", label: "Bulk article agent — save drafts to your account" },
    { href: "/free-tools/keyword-clustering", label: "Keyword clustering for topic and SERP planning" },
    { href: "/free-tools/ai-search-grader", label: "Search visibility grader" },
    { href: "/blog", label: "SEO playbooks and execution notes (main blog)" },
    { href: `${EDUCATION_SITE_URL}/education`, label: "Education hub — news, trends, education blog" },
  ] as const;
  const audiencePaths = [
    {
      label: "Bloggers",
      href: "/seo-agent?try=1",
      description: "Publish high-quality content faster without juggling multiple tools.",
    },
    {
      label: "SaaS teams",
      href: "/pricing",
      description: "Turn product expertise into pipeline-generating SEO pages on a repeatable cadence.",
    },
    {
      label: "Agencies",
      href: "/pages",
      description: "Standardize SEO production across clients while improving turnaround and margins.",
    },
  ] as const;
  const platformBlocks = [
    {
      title: "Execution engine",
      body: "Keyword to shipped page—one guided path with standards you can reuse.",
      href: "/seo-agent",
    },
    {
      title: "Demand intelligence",
      body: "See what the SERP rewards before you commit weeks of production.",
      href: "/free-tools",
    },
    {
      title: "On-page control",
      body: "Metadata, structure, and checks that protect rankings when volume spikes.",
      href: "/seo-agent",
    },
    {
      title: "Reporting and handoff",
      body: "Exports and dashboards that make client and portfolio reviews painless.",
      href: "/dashboard",
    },
  ] as const;
  const outcomeProof = [
    { quote: "Cut our publishing cycle from five days to under 48 hours.", role: "Growth manager" },
    { quote: "QA rework dropped ~60% once every page followed one standard workflow.", role: "Agency delivery lead" },
  ] as const;
  return (
    <>
      <JsonLd data={buildHomePageSchema()} />
      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:px-6 md:py-14 md:pb-14">
        {/* 1. Hero (pain + solution) */}
        <section className="reveal-on-scroll section-variant-a relative overflow-hidden rounded-3xl border border-border/70 p-5 md:p-10">
          <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-64 w-64 rounded-full bg-purple/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
                AI SEO Platform for Teams
              </span>
              <h1 className="text-balance mt-4 max-w-4xl font-display text-[clamp(1.85rem,7.6vw,4.4rem)] leading-[1.05] text-text-primary">
                Grow organic pipeline with one AI SEO workflow.
              </h1>
              <p className="mt-4 max-w-2xl font-serif text-[0.98rem] leading-relaxed text-text-secondary md:mt-5 md:text-[1.12rem]">
                Plan, write, optimize, and publish in a single platform. RankFlowHQ helps bloggers, SaaS teams,
                and agencies turn search intent into consistent traffic, qualified leads, and compounding growth.
              </p>
              <p className="mt-3 font-serif text-sm text-text-secondary">
                Replace scattered docs, prompt tabs, and plugins with a modern SaaS workflow built for conversion.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  href="/seo-agent?try=1"
                  data-track-cta
                  data-cta-label="hero_primary_start_ranking"
                  className="btn-premium pulse-subtle inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/seo-agent"
                  data-track-cta
                  data-cta-label="hero_secondary_watch_demo"
                  className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/90 bg-surface/60 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary"
                >
                  Watch product demo
                </Link>
              </div>
              <p className="mt-3 font-mono text-[11px] text-text-muted">
                No credit card required. Go from idea to publish-ready draft in minutes.
              </p>
            </div>
            <HeroPlgDemo />
          </div>
        </section>

        <section className="reveal-on-scroll mt-5 rounded-2xl border border-border/80 bg-surface/45 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Not another chat. Not another score.</p>
            <p className="font-mono text-[10px] text-text-muted">Built to beat generic tools</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {comparisonAlternatives.map((row) => (
              <div key={row.name} className="rounded-xl border border-border/70 bg-background/35 px-3 py-3">
                <p className="font-mono text-xs text-accent">{row.name}</p>
                <p className="mt-1 font-display text-sm text-text-primary">{row.verdict}</p>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{row.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll mt-6 rounded-2xl border border-border/80 bg-surface/45 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Use cases</p>
            <p className="font-mono text-[10px] text-text-muted">Built for modern content growth teams.</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {audiencePaths.map((path) => (
              <Link
                key={path.label}
                href={path.href}
                className="rounded-xl border border-border/70 bg-background/35 p-3 transition-all hover:-translate-y-0.5 hover:border-accent/60"
              >
                <p className="font-mono text-xs text-accent">{path.label}</p>
                <p className="mt-1 font-serif text-sm text-text-secondary">{path.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll mt-10 rounded-2xl border border-border/80 bg-surface/45 p-5 md:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Product demo</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            See the workflow before you commit
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            Preview how RankFlowHQ moves from keyword input to structured output, so your team can evaluate
            quality, speed, and fit before rollout.
          </p>
          <div className="mt-5">
            <SampleOutputSection />
          </div>
        </section>

        {/* 2. Social proof (logos / stats) */}
        <section className="reveal-on-scroll section-variant-b mt-7 rounded-2xl border border-border/70 px-4 py-5 md:px-6" style={{ "--reveal-delay": "70ms" } as CSSProperties}>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Trusted by growth-focused teams
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
                <p className="mt-1 font-display text-xl text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-background/35 px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Ecosystem presence</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {seenOn.map((logo) => (
                <div
                  key={logo}
                  className="rounded-md border border-border/60 bg-surface/40 px-2 py-1.5 text-center font-mono text-[11px] text-text-secondary"
                >
                  {logo}
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-text-muted">
              Internal product usage snapshot (rolling 90-day view).
            </p>
          </div>
        </section>

        <section className="reveal-on-scroll mt-10 rounded-2xl border border-border/70 bg-surface/40 p-5 md:p-6" style={{ "--reveal-delay": "90ms" } as CSSProperties}>
          <h2 className="font-display text-2xl text-text-primary sm:text-3xl">
            Resources that move traffic, not vanity metrics
          </h2>
          <p className="mt-2 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            Keyword planning, on-page structure, and visibility checks—tied to pages that earn clicks and revenue.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {internalResourceLinks.map((item) => (
              <li key={item.href}>
                {item.href.startsWith("http") ? (
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 w-full items-center rounded-lg border border-border/70 bg-background/35 px-3 py-2 font-serif text-sm text-text-secondary hover:border-accent/60 hover:text-text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 w-full items-center rounded-lg border border-border/70 bg-background/35 px-3 py-2 font-serif text-sm text-text-secondary hover:border-accent/60 hover:text-text-primary"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Problem section */}
        <section className="reveal-on-scroll mt-14 md:mt-20" style={{ "--reveal-delay": "110ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">The problem</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Traffic leaks when SEO is a pile of tools
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Fragmented workflows burn time you could spend publishing money pages.",
              "Slow handoffs mean competitors index first on the same intent.",
              "Inconsistent execution tanks rankings when you try to scale output.",
            ].map((item) => (
              <article key={item} className="card-premium rounded-xl border border-border/70 bg-surface/40 p-4">
                <p className="font-serif text-sm leading-relaxed text-text-secondary">{item}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Solution section */}
        <section className="reveal-on-scroll mt-14 rounded-2xl border border-border/80 bg-surface/45 p-5 md:mt-20 md:p-8" style={{ "--reveal-delay": "125ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">The solution</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            One OS. Full stack. Repeatable revenue.
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            RankFlowHQ is programmatic SEO infrastructure: briefs, production, on-page discipline, and
            packaging in one place—so traffic and rankings compound instead of resetting every week.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/seo-agent" className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background">
              Start ranking
            </Link>
            <Link href="/pages" className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/90 bg-surface/60 px-5 py-3 font-mono text-sm text-text-secondary">
              See the stack
            </Link>
          </div>
        </section>

        <section className="reveal-on-scroll mt-14 rounded-2xl border border-border/80 bg-surface/45 p-5 md:mt-20 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Platform map</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Modules that connect into one revenue loop
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            Each surface does one job. Together they replace the brittle patchwork that kills scale.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {platformBlocks.map((block) => (
              <Link
                key={block.title}
                href={block.href}
                className="rounded-xl border border-border/70 bg-background/35 p-4 transition-all hover:border-accent/60"
              >
                <h3 className="font-display text-xl text-text-primary">{block.title}</h3>
                <p className="mt-2 font-serif text-sm text-text-secondary">{block.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Features (benefits-driven) */}
        <section className="reveal-on-scroll mt-14 md:mt-20" style={{ "--reveal-delay": "140ms" } as CSSProperties}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Outcomes, not feature lists</p>
              <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
                Traffic, rankings, revenue—on purpose
              </h2>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featureBenefits.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="card-premium group rounded-2xl border border-border/80 bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-surface/80"
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

        {/* 6. Demo / How it works */}
        <section className="reveal-on-scroll section-variant-a mt-14 rounded-2xl border border-border/80 p-5 md:mt-20 md:p-8" style={{ "--reveal-delay": "140ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">How it works</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Three moves. No theater.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pipelineSteps.map((step) => (
              <div key={step.id} className="card-premium rounded-xl border border-border/70 bg-background/40 p-4">
                <span className="font-mono text-xs text-accent">{step.id}</span>
                <h3 className="mt-2 font-display text-xl text-text-primary">{step.title}</h3>
                <p className="mt-2 font-serif text-sm text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Suspense
          fallback={
            <section className="section-lazy mt-14 grid gap-4 md:gap-6 lg:grid-cols-2 md:mt-20">
              {[0, 1].map((idx) => (
                <div key={idx} className="rounded-2xl border border-border/80 bg-surface/50 p-6">
                  <div className="skeleton h-6 w-40 rounded-md" />
                  <div className="skeleton mt-3 h-4 w-5/6 rounded-md" />
                  <div className="mt-5 space-y-2">
                    <div className="skeleton h-4 w-full rounded-md" />
                    <div className="skeleton h-4 w-11/12 rounded-md" />
                    <div className="skeleton h-4 w-10/12 rounded-md" />
                  </div>
                </div>
              ))}
            </section>
          }
        >
          <RecentTrendingSection />
        </Suspense>

        {/* 7. Testimonials */}
        <section className="reveal-on-scroll mt-14 md:mt-20" style={{ "--reveal-delay": "190ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Social proof</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Customer proof from real workflows
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.quote} className="card-premium rounded-2xl border border-border/80 bg-surface/50 p-5">
                <p className="font-serif text-sm leading-relaxed text-text-secondary">“{item.quote}”</p>
                <p className="mt-4 font-mono text-xs text-text-primary">
                  {item.name} · <span className="text-text-muted">{item.company}</span>
                </p>
              </article>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {outcomeProof.map((item) => (
              <div key={item.quote} className="rounded-xl border border-border/70 bg-background/35 p-4">
                <p className="font-serif text-sm text-text-secondary">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-2 font-mono text-[11px] text-text-muted">{item.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll mt-14 rounded-2xl border border-border/80 bg-surface/45 p-5 md:mt-20 md:p-8" style={{ "--reveal-delay": "205ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Case studies</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Execution stories: traffic and revenue on the line
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {caseStudies.map((study) => (
              <article key={study.title} className="card-premium rounded-xl border border-border/70 bg-background/40 p-4">
                <h3 className="font-display text-xl text-text-primary">{study.title}</h3>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{study.summary}</p>
                <Link href={study.href} className="mt-3 inline-flex min-h-11 items-center font-mono text-xs text-accent hover:underline">
                  Read full breakdown →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* 8. Pricing */}
        <section className="reveal-on-scroll mt-14 md:mt-20" style={{ "--reveal-delay": "240ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Pricing</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Pay for outcomes, not shelfware
          </h2>
          <p className="mt-2 font-mono text-[11px] text-text-muted">
            Onboarding is intentionally light—your first ranking push should not wait on a calendar invite.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`card-premium rounded-2xl border p-5 ${
                  tier.highlight
                    ? "border-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                    : "border-border/80 bg-surface/50"
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{tier.name}</p>
                <span className="mt-2 inline-flex rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                  {tier.badge}
                </span>
                <p className="mt-2 font-display text-3xl leading-none text-text-primary">{tier.price}</p>
                {"oldPrice" in tier ? (
                  <p className="mt-1 font-mono text-[11px] text-text-muted">
                    <span className="line-through">{tier.oldPrice}</span> anchor price
                  </p>
                ) : null}
                <p className="mt-1 font-serif text-sm text-text-secondary">{tier.subtitle}</p>
                <ul className="mt-4 space-y-2 font-serif text-sm text-text-secondary">
                  {tier.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`btn-premium mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 sm:w-auto ${
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

        {/* 9. FAQ */}
        <section className="reveal-on-scroll section-variant-b mt-14 rounded-2xl border border-border/80 p-5 md:mt-20 md:p-8" style={{ "--reveal-delay": "255ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">FAQ</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Straight answers—no vendor poetry
          </h2>
          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="card-premium rounded-xl border border-border/70 bg-background/40 p-4">
                <summary className="cursor-pointer list-none font-display text-lg text-text-primary">
                  {item.q}
                </summary>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="reveal-on-scroll mt-14 rounded-2xl border border-border/80 bg-surface/45 p-5 md:mt-20 md:p-8" style={{ "--reveal-delay": "262ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Operator-led</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Built for people judged on rankings and revenue
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            RankFlowHQ exists because programmatic SEO breaks when execution is scattered. We optimize for
            shipping velocity, SERP defensibility, and monetization—not demo-day features.
          </p>
          <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-4">
            <p className="font-mono text-xs text-text-primary">Operator note</p>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              &ldquo;We are not here to help you write more words. We are here to help you win more of the SERP—
              and get paid for it.&rdquo;
            </p>
            <p className="mt-2 font-mono text-[11px] text-text-muted">— RankFlowHQ product team</p>
          </div>
        </section>

        {/* 10. Final CTA */}
        <section className="reveal-on-scroll section-variant-a mt-14 rounded-3xl border border-border/80 p-5 md:mt-20 md:p-10" style={{ "--reveal-delay": "270ms" } as CSSProperties}>
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">
            Stop donating rankings to operators with a tighter OS.
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">
            Run one pipeline from intent to shipped pages. Measure traffic and revenue. Repeat without rebuilding the
            process every Monday.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/seo-agent"
              className="btn-premium pulse-subtle inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/80 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-3 font-mono text-[11px] text-text-muted">
            Minutes to first shipped page. Weeks to compounding traffic—if you publish like you mean it.
          </p>
        </section>
      </main>
    </>
  );
}
