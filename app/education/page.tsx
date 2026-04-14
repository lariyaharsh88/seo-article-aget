import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Education Hub",
  description:
    "Education tools hub for trends, news aggregation, and archived education coverage.",
  path: "/education",
  keywords: ["education tools", "education trends", "education news"],
});

export default function EducationHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-text-primary md:text-5xl">
        Education Hub
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        Use these education-focused tools and archived news pages on the education subdomain.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/education-news"
          className="rounded-xl border border-border bg-surface/60 p-5 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          Education News Aggregator
        </Link>
        <Link
          href="/education-trends"
          className="rounded-xl border border-border bg-surface/60 p-5 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          Education Trends Tool
        </Link>
        <Link
          href="/news"
          className="rounded-xl border border-border bg-surface/60 p-5 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          Archived News (/news)
        </Link>
      </div>
    </main>
  );
}

