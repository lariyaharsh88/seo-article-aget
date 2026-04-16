import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "Choose the RankFlowHQ plan that helps you publish faster and grow qualified SEO traffic.",
  path: "/pricing",
});

export default function PricingPage() {
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

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            name: "Starter",
            price: "Free",
            subtitle: "For trying the workflow and getting quick wins",
            points: ["Core free tools", "No credit card required", "Immediate access"],
            cta: "Get SEO Traffic Now",
            href: "/free-tools",
            highlight: false,
          },
          {
            name: "Growth",
            price: "Most Popular",
            subtitle: "For teams scaling consistent organic traffic",
            points: [
              "End-to-end SEO Agent workflow",
              "Research + generation + optimization",
              "Publish-ready output flow",
            ],
            cta: "Start Growing Traffic",
            href: "/seo-agent",
            highlight: true,
          },
          {
            name: "Enterprise",
            price: "Custom",
            subtitle: "For high-volume SEO and content operations",
            points: ["Custom workflow setup", "Priority support", "Advanced implementation guidance"],
            cta: "Book Growth Consultation",
            href: "/seo-agent",
            highlight: false,
          },
        ].map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border p-5 ${
              plan.highlight
                ? "border-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                : "border-border/80 bg-surface/50"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{plan.name}</p>
            <p className="mt-2 font-display text-3xl text-text-primary">{plan.price}</p>
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
    </main>
  );
}
