import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { RecentTrendingSection } from "@/components/home/RecentTrendingSection";
import { SampleOutputSection } from "@/components/home/SampleOutputSection";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildHomePageSchema } from "@/lib/schema-org";

export const metadata: Metadata = buildPageMetadata({
  title: "AI SEO Article Writer — From Keyword to Ready-to-Publish Article",
  description:
    "Type a keyword. RankFlowHQ reads the top Google results and writes a researched, SEO-ready article with sources, title and meta description in a few minutes. Free to start.",
  path: "/",
  keywords: [
    "AI SEO article writer",
    "SEO article generator",
    "AI blog post writer",
    "SEO content tool",
    "keyword to article",
  ],
});

const FREE_ARTICLES = 5;

const steps = [
  {
    n: "1",
    title: "Enter a keyword",
    body: "The search phrase you want to rank for — for example “best CRM for small business”.",
  },
  {
    n: "2",
    title: "We research and write",
    body: "RankFlowHQ reads the pages already ranking on Google, finds the questions people ask, and writes a long-form draft with sources. About 2–4 minutes.",
  },
  {
    n: "3",
    title: "Copy or publish",
    body: "You get the article, an SEO title and a meta description. Copy it, download it, or keep it in your dashboard.",
  },
] as const;

const audiences = [
  {
    title: "Bloggers",
    body: "Publish well-researched posts without spending a day on each one.",
  },
  {
    title: "Small businesses & SaaS",
    body: "Write helpful pages about your product and industry that people find on Google.",
  },
  {
    title: "Agencies & freelancers",
    body: "Give every client the same research-first process and get first drafts faster.",
  },
] as const;

const plans = [
  {
    name: "Free",
    price: "$0",
    points: [`${FREE_ARTICLES} articles`, "Full research + SEO title and description", "No credit card"],
    cta: "Start free",
    href: "/seo-agent",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49/mo",
    points: ["Unlimited articles", "Deeper research", "Premium SEO exports"],
    cta: "See Pro",
    href: "/pricing",
    highlight: true,
  },
] as const;

const faqs = [
  {
    q: "What exactly do I get?",
    a: "A long-form article (usually 1,500–2,500 words) with headings, FAQs and the sources it used, plus an SEO title and meta description. You can edit it before you copy or download it.",
  },
  {
    q: "Is it just ChatGPT?",
    a: "No. Before writing, RankFlowHQ looks at what currently ranks on Google for your keyword and the questions people search for, then plans the article around that. A chat window doesn’t do that research for you.",
  },
  {
    q: "Should I edit the article before publishing?",
    a: "Yes — treat it as a strong first draft. Add your own experience, examples and opinions. That is what makes content rank and convert.",
  },
  {
    q: "Do I need an account?",
    a: `Yes, a free account (just your email). Your first ${FREE_ARTICLES} articles are free and your articles are saved to your dashboard.`,
  },
] as const;

const btnPrimary =
  "btn-premium inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 font-mono text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90";
const btnSecondary =
  "btn-premium inline-flex min-h-11 items-center justify-center rounded-xl border border-border/90 bg-surface/60 px-5 py-3 font-mono text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary";

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildHomePageSchema()} />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-28 md:px-6 md:py-14 md:pb-14">
        {/* Hero: what it is + the one action */}
        <section className="section-variant-a relative overflow-hidden rounded-3xl border border-border/70 p-5 md:p-10">
          <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <h1 className="text-balance font-display text-[clamp(1.85rem,7vw,3.8rem)] leading-[1.05] text-text-primary">
              Type a keyword. Get a researched, SEO-ready article.
            </h1>
            <p className="mt-4 max-w-2xl font-serif text-[1rem] leading-relaxed text-text-secondary md:text-[1.12rem]">
              RankFlowHQ reads what already ranks on Google, then writes a long-form article with sources, an SEO
              title and a meta description — in about 3 minutes.
            </p>
            <form action="/seo-agent" method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-keyword" className="sr-only">
                Keyword
              </label>
              <input
                id="hero-keyword"
                name="keyword"
                required
                maxLength={200}
                placeholder="e.g. best CRM for small business"
                className="min-h-11 w-full rounded-xl border border-border bg-background/70 px-4 font-mono text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:max-w-md"
              />
              <button type="submit" data-track-cta data-cta-label="hero_keyword_submit" className={btnPrimary}>
                Write my article
              </button>
            </form>
            <p className="mt-3 font-mono text-[11px] text-text-muted">
              Free account · first {FREE_ARTICLES} articles free · no credit card
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-14 md:mt-20">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-border/80 bg-surface/50 p-5">
                <p className="font-mono text-xs text-accent">Step {s.n}</p>
                <h3 className="mt-2 font-display text-xl text-text-primary">{s.title}</h3>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* What you get */}
        <section className="mt-14 rounded-2xl border border-border/80 bg-surface/45 p-5 md:mt-20 md:p-6">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">What you get</h2>
          <p className="mt-2 max-w-3xl font-serif text-sm text-text-secondary md:text-base">
            A real example: the keywords we found, the outline we planned from Google results, and the start of the
            finished article.
          </p>
          <div className="mt-6">
            <SampleOutputSection />
          </div>
        </section>

        {/* Who it's for */}
        <section className="mt-14 md:mt-20">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">Who it’s for</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border/80 bg-surface/50 p-5">
                <h3 className="font-display text-xl text-text-primary">{a.title}</h3>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{a.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif text-sm text-text-secondary">
            Also free: <Link href="/free-tools" className="text-accent hover:underline">keyword and SEO tools</Link>,{" "}
            <Link href="/repurpose-url" className="text-accent hover:underline">rewrite a URL into an article</Link>, and{" "}
            <Link href="/bulk-article-creating-agent" className="text-accent hover:underline">bulk articles</Link>.
          </p>
        </section>

        {/* Pricing */}
        <section className="mt-14 md:mt-20">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">Pricing</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-5 ${
                  p.highlight ? "border-accent/60 bg-accent/10" : "border-border/80 bg-surface/50"
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{p.name}</p>
                <p className="mt-2 font-display text-3xl text-text-primary">{p.price}</p>
                <ul className="mt-4 space-y-2 font-serif text-sm text-text-secondary">
                  {p.points.map((pt) => (
                    <li key={pt}>✓ {pt}</li>
                  ))}
                </ul>
                <Link href={p.href} className={`mt-5 ${p.highlight ? btnPrimary : btnSecondary}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-3 font-serif text-sm text-text-secondary">
            Agency or high volume? <Link href="/pricing" className="text-accent hover:underline">Talk to us</Link>.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-14 md:mt-20">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">Questions</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="rounded-xl border border-border/70 bg-background/40 p-4">
                <summary className="cursor-pointer font-display text-lg text-text-primary">{item.q}</summary>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Latest posts (internal links) */}
        <Suspense fallback={<div className="mt-14 h-40 rounded-2xl border border-border/80 bg-surface/50 md:mt-20" />}>
          <RecentTrendingSection />
        </Suspense>

        {/* Final CTA */}
        <section className="section-variant-a mt-14 rounded-3xl border border-border/80 p-5 md:mt-20 md:p-10">
          <h2 className="font-display text-3xl text-text-primary sm:text-4xl">Write your first article now</h2>
          <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">
            One keyword in, one researched draft out. Free for your first {FREE_ARTICLES} articles.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/seo-agent" className={btnPrimary}>
              Write an article
            </Link>
            <Link href="/pricing" className={btnSecondary}>
              See pricing
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
