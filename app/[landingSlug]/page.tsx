import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import {
  getSeoLandingConfig,
  getSeoLandingSlugs,
} from "@/lib/seo-landing-pages";
import { getSiteUrl } from "@/lib/site-url";

type Props = {
  params: { landingSlug: string };
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return getSeoLandingSlugs().map((landingSlug) => ({ landingSlug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const config = getSeoLandingConfig(params.landingSlug);
  if (!config) {
    return buildPageMetadata({
      title: "Not found",
      description: "Landing page not found.",
      path: `/${params.landingSlug}`,
    });
  }

  return buildPageMetadata({
    title: config.metaTitle,
    description: config.metaDescription,
    path: `/${config.slug}`,
    keywords: [
      config.keyword,
      ...config.longTailKeywords,
      "SEO content workflow",
      "AI SEO article pipeline",
    ],
  });
}

export default function SeoLandingPage({ params }: Props) {
  const config = getSeoLandingConfig(params.landingSlug);
  if (!config) notFound();

  const canonicalUrl = `${getSiteUrl().replace(/\/$/, "")}/${config.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: config.metaTitle,
        description: config.metaDescription,
      },
      {
        "@type": "HowTo",
        "@id": `${canonicalUrl}#howto`,
        name: `How ${config.keyword} workflow works`,
        description: `Step-by-step workflow for ${config.keyword}.`,
        step: config.howItWorks.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.description,
        })),
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}#software`,
        name: "RankFlowHQ",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "SEO Software",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: config.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  } as Record<string, unknown>;

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-2xl border border-border bg-surface/70 px-6 py-10 shadow-sm md:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            SEO landing page
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-text-primary md:text-5xl">
            {config.heroHeadline}
          </h1>
          <p className="mt-4 max-w-3xl font-serif text-lg text-text-secondary">
            {config.heroSubheading}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={config.tool.href}
              className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              Try RankFlowHQ
            </Link>
            <Link
              href="#tool-demo"
              className="rounded-lg border border-border px-5 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              View Demo
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-3xl text-text-primary">
            What is {config.keyword}?
          </h2>
          <div className="mt-4 space-y-4">
            {config.whatIs.map((paragraph) => (
              <p key={paragraph} className="font-serif text-base text-text-secondary">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-3xl text-text-primary">How it works</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {config.howItWorks.map((step, index) => (
              <article
                key={step.title}
                className="rounded-xl border border-border bg-background/70 p-4"
              >
                <p className="font-mono text-xs text-accent">Step {index + 1}</p>
                <h3 className="mt-1 font-display text-xl text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 font-serif text-sm text-text-secondary">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-3xl text-text-primary">Benefits</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {config.benefits.map((benefit) => (
              <li
                key={benefit}
                className="rounded-lg border border-border bg-background/60 px-4 py-3 font-serif text-sm text-text-secondary"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        <section id="tool-demo" className="mt-10">
          <h2 className="font-display text-3xl text-text-primary">Embedded tool/demo</h2>
          <p className="mt-3 max-w-3xl font-serif text-sm text-text-secondary">
            {config.tool.description}
          </p>
          {config.tool.embedUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <iframe
                title={config.tool.title}
                src={config.tool.embedUrl}
                loading="lazy"
                className="h-[520px] w-full bg-background"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-border bg-surface/60 p-5">
              <h3 className="font-display text-2xl text-text-primary">
                {config.tool.title}
              </h3>
              <Link
                href={config.tool.href}
                className="mt-3 inline-block rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/20"
              >
                {config.tool.ctaLabel}
              </Link>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-3xl text-text-primary">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {config.faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-xl border border-border bg-background/70 p-4"
              >
                <h3 className="font-display text-xl text-text-primary">
                  {faq.question}
                </h3>
                <p className="mt-2 font-serif text-sm text-text-secondary">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-3xl text-text-primary">Related pages</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {config.internalLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-border bg-background/70 p-4 transition-colors hover:border-accent/50"
                >
                  <h3 className="font-display text-lg text-text-primary">{item.label}</h3>
                  {item.description ? (
                    <p className="mt-2 font-serif text-sm text-text-secondary">
                      {item.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-accent/30 bg-accent/10 p-6">
          <h2 className="font-display text-3xl text-text-primary">{config.cta.headline}</h2>
          <p className="mt-2 max-w-3xl font-serif text-sm text-text-secondary">
            {config.cta.text}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={config.cta.primaryHref}
              className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              {config.cta.primaryLabel}
            </Link>
            <Link
              href={config.cta.secondaryHref}
              className="rounded-lg border border-border px-5 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              {config.cta.secondaryLabel}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
