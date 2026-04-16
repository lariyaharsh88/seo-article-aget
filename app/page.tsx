import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { HeroPlgDemo } from "@/components/home/HeroPlgDemo";
import { JsonLd } from "@/components/JsonLd";
import { RecentTrendingSection } from "@/components/home/RecentTrendingSection";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildHomePageSchema } from "@/lib/schema-org";
export const metadata: Metadata = buildPageMetadata({
  title: "AI SEO Automation Platform",
  description:
    "Get more qualified SEO traffic with faster, publish-ready content workflows.",
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

export default async function HomePage() {
  const pipelineSteps = [
    { id: "01", title: "Define one SEO goal", body: "Set keyword, audience, and intent so every output aligns to a clear traffic objective." },
    { id: "02", title: "Generate your SEO package", body: "Create research, outline, article, and metadata in one guided workflow." },
    { id: "03", title: "Publish and compound faster", body: "Ship consistently with reusable structure, then optimize using fresh demand signals." },
  ] as const;
  const featureBenefits = [
    {
      title: "One workflow replaces scattered tools",
      description: "Move from brief to publish-ready output without jumping between disconnected systems.",
      metric: "Less context switching, faster delivery",
      href: "/seo-agent",
      icon: "⚡",
    },
    {
      title: "Identify high-upside opportunities early",
      description: "Spot demand gaps before competitors saturate the same topics and SERPs.",
      metric: "Better topic timing, higher upside",
      href: "/free-tools",
      icon: "🧩",
    },
    {
      title: "Scale output without losing quality",
      description: "Use repeatable standards so quality stays stable as publishing volume increases.",
      metric: "Higher velocity with consistent quality",
      href: "/pages",
      icon: "📈",
    },
  ] as const;
  const pricingTiers = [
    {
      name: "Starter",
      price: "$0/mo",
      subtitle: "Validate SEO gains before you commit",
      points: ["2 workflow runs", "SEO workflow previews", "No credit card required"],
      cta: "Start Free",
      href: "/free-tools",
      highlight: false,
      badge: "Free",
    },
    {
      name: "Pro",
      price: "$49/mo",
      oldPrice: "$79/mo",
      subtitle: "For teams that need predictable SEO output",
      points: ["Unlimited workflow runs", "Enriched research + optimization", "Publish-ready output formats"],
      cta: "Upgrade to Pro",
      href: "/seo-agent",
      highlight: true,
      badge: "Most popular",
    },
    {
      name: "Enterprise",
      price: "Custom",
      subtitle: "For high-volume SEO programs",
      points: ["Custom workflow design", "Priority support and onboarding", "Advanced implementation guidance"],
      cta: "Book Demo",
      href: "/pricing",
      highlight: false,
      badge: "Custom",
    },
  ] as const;
  const testimonials = [
    {
      quote:
        "RankFlowHQ turned our content ops from scattered tasks into a repeatable growth engine. We now publish consistently without quality drops.",
      name: "Ananya Sharma",
      company: "Growth Lead, B2B SaaS",
    },
    {
      quote:
        "The workflow clarity is excellent. We ship better articles faster, with cleaner SEO fundamentals and stronger internal linking.",
      name: "Rohit Mehta",
      company: "Content Manager, SEO Agency",
    },
    {
      quote:
        "Great balance of automation and control. It feels like a serious production system, not a prompt playground.",
      name: "Priya Nair",
      company: "Founder, D2C Brand",
    },
  ] as const;
  const trustLogos = ["SaaS Teams", "SEO Agencies", "Content Ops", "Growth Teams", "Founders"] as const;
  const seenOn = ["Product Hunt", "Indie Hackers", "LinkedIn", "X (Twitter)", "Founder Communities"] as const;
  const trustMetrics = [
    { label: "Teams using workflows", value: "1,200+" },
    { label: "SEO pages generated", value: "85,000+" },
    { label: "Estimated traffic influenced", value: "12.4M+ monthly visits" },
  ] as const;
  const caseStudies = [
    {
      title: "B2B SaaS: +173% organic clicks in 90 days",
      summary: "Standardized briefs + publish-ready outputs helped the team increase publishing frequency without quality decline.",
      href: "/blog",
    },
    {
      title: "Agency: 2.8x content velocity across clients",
      summary: "One reusable workflow reduced manual handoffs and shortened delivery cycles across 14 active SEO accounts.",
      href: "/blog",
    },
    {
      title: "D2C: From inconsistent blogging to weekly wins",
      summary: "The team moved from sporadic posts to a steady pipeline tied to search intent and conversion-ready topics.",
      href: "/blog",
    },
  ] as const;
  const faqs = [
    {
      q: "Will this replace my content team?",
      a: "No. It removes repetitive workflow friction so your team can focus on strategy, messaging, and editorial quality.",
    },
    {
      q: "How fast can we get value?",
      a: "Most teams create their first publish-ready outputs in the first session and improve velocity within the first week.",
    },
    {
      q: "Do we need major technical setup?",
      a: "No heavy setup. You can start with your current process and adopt deeper automation as you scale.",
    },
    {
      q: "Is this only for large teams?",
      a: "No. Solo operators, agencies, and in-house teams can all run the same workflow with different depth.",
    },
  ] as const;
  const internalResourceLinks = [
    { href: "/seo-agent", label: "AI SEO article generator for ranking content" },
    { href: "/free-tools/keyword-clustering", label: "Keyword clustering tool for topic planning" },
    { href: "/free-tools/ai-search-grader", label: "AI search visibility grader" },
    { href: "/blog", label: "SEO strategy blog and optimization guides" },
  ] as const;
  const audiencePaths = [
    { label: "Founders", href: "/seo-agent?try=1", description: "Ship high-intent pages without adding headcount." },
    { label: "Marketing teams", href: "/pages", description: "Standardize execution and publish with higher velocity." },
    { label: "Agencies", href: "/pricing", description: "Run repeatable client workflows and protect margins." },
  ] as const;
  const platformBlocks = [
    {
      title: "Workflow engine",
      body: "Move from keyword to publish-ready output in one guided path.",
      href: "/seo-agent",
    },
    {
      title: "Research and validation",
      body: "Use demand signals, query context, and internal linking opportunities.",
      href: "/free-tools",
    },
    {
      title: "Optimization layer",
      body: "Improve metadata, structure, and quality checks before publishing.",
      href: "/seo-agent",
    },
    {
      title: "Distribution and reuse",
      body: "Export branded reports and share outputs across your team faster.",
      href: "/dashboard",
    },
  ] as const;
  const outcomeProof = [
    { quote: "Publishing cycle reduced from 5 days to under 48 hours.", role: "Growth lead, B2B SaaS" },
    { quote: "Content QA handoff time dropped by around 60%.", role: "SEO manager, agency team" },
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
                AI SEO Workflow Platform
              </span>
              <h1 className="text-balance mt-4 max-w-4xl font-display text-[clamp(1.85rem,7.6vw,4.4rem)] leading-[1.05] text-text-primary">
                Publish 3x more SEO pages per week with one clear workflow.
              </h1>
              <p className="mt-4 max-w-2xl font-serif text-[0.98rem] leading-relaxed text-text-secondary md:mt-5 md:text-[1.12rem]">
                RankFlowHQ combines research, generation, and optimization so your team can ship
                faster, keep quality consistent, and stop losing ranking windows to slower execution.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  href="/seo-agent?try=1"
                  data-track-cta
                  data-cta-label="hero_primary_start_free"
                  className="btn-premium pulse-subtle inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
                >
                  Start Free
                </Link>
                <Link
                  href="/pricing"
                  data-track-cta
                  data-cta-label="hero_secondary_get_demo"
                  className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/90 bg-surface/60 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary"
                >
                  Get Demo
                </Link>
              </div>
              <p className="mt-3 font-mono text-[11px] text-text-muted">
                Limited onboarding slots each month for implementation support.
              </p>
            </div>
            <HeroPlgDemo />
          </div>
        </section>

        <section className="reveal-on-scroll mt-6 rounded-2xl border border-border/80 bg-surface/45 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Choose your path</p>
            <p className="font-mono text-[10px] text-text-muted">Built for different growth motions</p>
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

        {/* 2. Social proof (logos / stats) */}
        <section className="reveal-on-scroll section-variant-b mt-7 rounded-2xl border border-border/70 px-4 py-5 md:px-6" style={{ "--reveal-delay": "70ms" } as CSSProperties}>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
            Trusted by teams that ship content weekly
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
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Where our team shares playbooks</p>
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
              Snapshot based on internal usage and workflow logs (last 90 days).
            </p>
          </div>
        </section>

        <section className="reveal-on-scroll mt-10 rounded-2xl border border-border/70 bg-surface/40 p-5 md:p-6" style={{ "--reveal-delay": "90ms" } as CSSProperties}>
          <h2 className="font-display text-2xl text-text-primary sm:text-3xl">
            Explore SEO resources that help you rank and retain users
          </h2>
          <p className="mt-2 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            Use these internal resources to plan keywords, optimize content structure, and improve
            search performance while keeping users engaged on site.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {internalResourceLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 w-full items-center rounded-lg border border-border/70 bg-background/35 px-3 py-2 font-serif text-sm text-text-secondary hover:border-accent/60 hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Problem section */}
        <section className="reveal-on-scroll mt-14 md:mt-20" style={{ "--reveal-delay": "110ms" } as CSSProperties}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">The problem</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Why SEO teams miss easy growth windows
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Too many disconnected tools and handoffs",
              "Slow movement from brief to publish",
              "Quality drops as publishing frequency increases",
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
            One operating system for SEO execution
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            RankFlowHQ removes workflow friction by centralizing strategy, generation, and optimization
            so every publish cycle is faster, clearer, and easier to repeat.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/seo-agent" className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background">
              Start Free
            </Link>
            <Link href="/pages" className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/90 bg-surface/60 px-5 py-3 font-mono text-sm text-text-secondary">
              Explore Features
            </Link>
          </div>
        </section>

        <section className="reveal-on-scroll mt-14 rounded-2xl border border-border/80 bg-surface/45 p-5 md:mt-20 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Platform map</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Modular system, one operating flow
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            Inspired by modern SaaS IA: each module solves one job, but all modules connect in a single workflow.
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
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Benefits-driven features</p>
              <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
                What improves in your workflow?
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
            See the workflow in 3 steps
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
            Why teams stay after trying it once
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
            Real execution stories from growth teams
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
            Choose your growth path without overthinking it
          </h2>
          <p className="mt-2 font-mono text-[11px] text-text-muted">
            Early adopter onboarding support is currently limited.
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
            Common questions before you start
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
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Founder credibility</p>
          <h2 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Built by operators who run SEO programs
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-sm leading-relaxed text-text-secondary md:text-base">
            RankFlowHQ is shaped by real SEO execution constraints: limited bandwidth, quality variance,
            and the need to ship consistently. Product decisions are benchmarked against practical publishing outcomes,
            not vanity features.
          </p>
          <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-4">
            <p className="font-mono text-xs text-text-primary">Founder note</p>
            <p className="mt-2 font-serif text-sm text-text-secondary">
              “Our goal is simple: help teams publish better SEO pages faster, without breaking editorial quality.”
            </p>
            <p className="mt-2 font-mono text-[11px] text-text-muted">— Product & Growth Team, RankFlowHQ (operator-led)</p>
          </div>
        </section>

        {/* 10. Final CTA */}
        <section className="reveal-on-scroll section-variant-a mt-14 rounded-3xl border border-border/80 p-5 md:mt-20 md:p-10" style={{ "--reveal-delay": "270ms" } as CSSProperties}>
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">
            Ready to stop losing high-intent traffic to faster teams?
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">
            Start with one guided workflow today, then scale with tools, templates, and systems built for growth teams.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/seo-agent"
              className="btn-premium pulse-subtle inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              Start Free
            </Link>
            <Link
              href="/pricing"
              className="btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/80 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary"
            >
              Watch Demo
            </Link>
          </div>
          <p className="mt-3 font-mono text-[11px] text-text-muted">
            Start in minutes. See measurable output in your first session.
          </p>
        </section>
      </main>
    </>
  );
}
