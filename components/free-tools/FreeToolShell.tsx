import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { FREE_TOOLS, getFreeTool } from "@/lib/free-tools/registry";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";

export type ToolFaq = { q: string; a: string };

export function freeToolMetadata(slug: string, description: string, keywords: string[]): Metadata {
  const tool = getFreeTool(slug);
  return buildPageMetadata({
    title: `Free ${tool.title}`,
    description,
    path: `/free-tools/${slug}`,
    keywords,
  });
}

/**
 * Shared layout for free SEO tools: H1 + intro, the interactive tool, how-to steps, FAQ (also emitted as
 * FAQPage schema), a CTA into the article writer and related tools. The copy is what lets each tool rank.
 */
export function FreeToolShell(props: {
  slug: string;
  description: string;
  intro: string;
  steps: string[];
  faqs: ToolFaq[];
  ctaText?: string;
  children: ReactNode;
}) {
  const tool = getFreeTool(props.slug);
  const path = `/free-tools/${props.slug}`;
  const related = FREE_TOOLS.filter((t) => t.slug !== props.slug && t.category === tool.category)
    .concat(FREE_TOOLS.filter((t) => t.slug !== props.slug && t.category !== tool.category))
    .slice(0, 3);

  return (
    <>
      <JsonLd
        data={buildToolWebApplicationSchema({
          path,
          name: tool.title,
          headline: `Free ${tool.title}`,
          description: props.description,
        })}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: props.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
          <Link href="/free-tools" className="hover:text-accent">
            Free SEO tools
          </Link>{" "}
          / <span className="text-text-secondary">{tool.title}</span>
        </nav>
        <h1 className="mt-3 font-display text-3xl text-text-primary md:text-4xl">Free {tool.title}</h1>
        <p className="mt-3 max-w-2xl font-serif text-base text-text-secondary">{props.intro}</p>
        <p className="mt-1 text-sm text-text-muted">Free · no sign-up needed</p>

        <div className="mt-6">{props.children}</div>

        <section className="mt-10 rounded-2xl border border-accent/40 bg-accent/10 p-5 md:p-6">
          <h2 className="font-display text-xl text-text-primary">Want the whole article written?</h2>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            {props.ctaText ??
              "RankFlowHQ reads the top Google results for your keyword and writes a researched, SEO-ready article with sources, title and meta description."}
          </p>
          <Link
            href="/seo-agent"
            data-track-cta
            data-cta-label={`free_tool_${props.slug}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-background hover:opacity-90"
          >
            Write the full article — free →
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-text-primary">How to use it</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 font-serif text-sm text-text-secondary">
            {props.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-text-primary">Questions</h2>
          <div className="mt-4 space-y-3">
            {props.faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-border/70 bg-surface/50 p-4">
                <summary className="cursor-pointer font-display text-base text-text-primary">{f.q}</summary>
                <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-text-primary">More free SEO tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/free-tools/${t.slug}`}
                className="rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/50"
              >
                <p className="font-display text-base text-text-primary">{t.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{t.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
