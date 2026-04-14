import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "RankFlowHQ pricing placeholder. Contact us for plans tailored to AI SEO automation workflows.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-text-primary">Pricing</h1>
      <p className="mt-3 font-serif text-text-secondary">
        Pricing plans are coming soon. For early access, use the free tools and
        contact the team.
      </p>
      <Link
        href="/seo-agent"
        className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background"
      >
        Generate SEO Article
      </Link>
    </main>
  );
}
