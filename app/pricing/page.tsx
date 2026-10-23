import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo-page";

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  forWho: string;
  points: string[];
  cta: string;
  href: string;
  highlight: boolean;
};

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "Start free with 5 articles. Upgrade to Pro for unlimited SEO articles, or Scale for teams. No credit card needed to start.",
  path: "/pricing",
});

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "",
    forWho: "Try it out",
    points: ["5 articles", "Full research, sources, SEO title and description", "All free SEO tools"],
    cta: "Start free",
    href: "/seo-agent",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    forWho: "Bloggers and freelancers publishing every week",
    points: ["Unlimited articles", "Deeper research and images, charts and tables", "Premium exports"],
    cta: "Get Pro",
    href: "/seo-agent",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$99",
    period: "/month",
    forWho: "Small teams and agencies",
    points: ["Everything in Pro", "Shared team workspace", "Priority generation and support"],
    cta: "Get Scale",
    href: "/seo-agent",
    highlight: false,
  },
];

const faqs = [
  {
    q: "What counts as one article?",
    a: "One finished run of the article generator: research, draft, SEO title and description for one keyword. Editing or copying it afterwards is free.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign in with your email and your first 5 articles are free.",
  },

] as const;

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="font-display text-4xl text-text-primary md:text-5xl">Pricing</h1>
      <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">
        Start free with 5 articles. Upgrade when you publish regularly.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-5 ${
              plan.highlight ? "border-accent/60 bg-accent/10" : "border-border/80 bg-surface/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{plan.name}</p>
              {plan.highlight ? (
                <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-semibold text-background">
                  Most popular
                </span>
              ) : null}
            </div>
            <p className="mt-3 font-display text-4xl text-text-primary">
              {plan.price}
              <span className="text-base text-text-muted">{plan.period}</span>
            </p>
            <p className="mt-1 font-serif text-sm text-text-secondary">{plan.forWho}</p>
            <ul className="mt-4 flex-1 space-y-2 font-serif text-sm text-text-secondary">
              {plan.points.map((point) => (
                <li key={point}>✓ {point}</li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 font-mono text-sm font-semibold transition-opacity ${
                plan.highlight
                  ? "bg-accent text-background hover:opacity-90"
                  : "border border-border text-text-secondary hover:border-accent/70 hover:text-text-primary"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>


      <section className="mt-14">
        <h2 className="font-display text-2xl text-text-primary md:text-3xl">Questions</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-xl border border-border/70 bg-background/40 p-4">
              <summary className="cursor-pointer font-display text-lg text-text-primary">{item.q}</summary>
              <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
