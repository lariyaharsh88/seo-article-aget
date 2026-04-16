import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo-page";

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  oldPrice?: string;
  subtitle: string;
  points: string[];
  cta: string;
  href: string;
  highlight: boolean;
  badge: string;
};

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "Choose the RankFlowHQ plan that helps you publish faster and grow qualified SEO traffic.",
  path: "/pricing",
});

export default function PricingPage() {
  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      subtitle: "For evaluating workflow fit",
      points: ["2 workflow runs", "Core free tools", "Community support"],
      cta: "Start Free",
      href: "/seo-agent?try=1",
      highlight: false,
      badge: "Free",
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      oldPrice: "$79",
      subtitle: "Best for solo operators and small teams",
      points: ["Unlimited workflow runs", "Premium SEO exports", "Advanced enrichment"],
      cta: "Upgrade to Pro",
      href: "/seo-agent",
      highlight: false,
      badge: "Most chosen",
    },
    {
      name: "Scale",
      price: "$99",
      period: "/month",
      oldPrice: "$149",
      subtitle: "For teams that want predictable growth velocity",
      points: ["Everything in Pro", "Collaboration workspace", "Priority queue + support"],
      cta: "Start Scale Plan",
      href: "/seo-agent",
      highlight: true,
      badge: "Best value",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      subtitle: "For high-volume SEO programs",
      points: ["Custom onboarding", "Security + governance controls", "Dedicated success support"],
      cta: "Book Growth Consultation",
      href: "/seo-agent",
      highlight: false,
      badge: "Custom",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Pricing</p>
      <h1 className="mt-2 font-display text-4xl text-text-primary md:text-5xl">
        Simple plans focused on traffic outcomes
      </h1>
      <p className="mt-3 max-w-2xl font-serif text-text-secondary">
        Start free, validate results, then scale with the workflow your team needs to ship SEO content faster.
      </p>
      <p className="mt-2 font-mono text-[11px] text-text-muted">
        Limited onboarding support is available this month.
      </p>

      <section className="mt-5 rounded-xl border border-border/80 bg-surface/40 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Pro highlights</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            "Unlimited runs for scaling teams",
            "Premium exports and branded deliverables",
            "Priority support with faster output cycles",
          ].map((item) => (
            <p key={item} className="rounded-lg border border-border/70 bg-background/35 px-3 py-2 font-serif text-sm text-text-secondary">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border p-5 ${
              plan.highlight
                ? "border-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                : "border-border/80 bg-surface/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{plan.name}</p>
              <span className="rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                {plan.badge}
              </span>
            </div>
            <p className="mt-2 flex items-end gap-2 font-display text-3xl text-text-primary">
              <span>{plan.price}</span>
              {plan.period ? <span className="pb-0.5 font-mono text-xs text-text-muted">{plan.period}</span> : null}
            </p>
            {plan.oldPrice ? (
              <p className="mt-1 font-mono text-xs text-text-muted">
                <span className="line-through">{plan.oldPrice}</span> anchor price
              </p>
            ) : null}
            <p className="mt-1 font-serif text-sm text-text-secondary">{plan.subtitle}</p>
            <ul className="mt-4 space-y-2 font-serif text-sm text-text-secondary">
              {plan.points.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-5 inline-flex rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                plan.highlight
                  ? "bg-accent text-background hover:opacity-90"
                  : "border border-border text-text-secondary hover:border-accent/70 hover:text-text-primary"
              }`}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-xl border border-border/80 bg-background/40 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Locked in free</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            "Unlimited workflow runs",
            "Team collaboration workspace",
            "Priority output queue",
            "Premium conversion templates",
          ].map((item) => (
            <p key={item} className="rounded-lg border border-border/70 bg-surface/40 px-3 py-2 font-serif text-sm text-text-secondary blur-[0.7px]">
              {item}
            </p>
          ))}
        </div>
        <div className="mt-3">
          <Link href="/seo-agent" className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90">
            Unlock all Pro features
          </Link>
        </div>
      </section>
    </main>
  );
}
