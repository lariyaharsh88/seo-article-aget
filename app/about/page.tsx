import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildStaticWebPageSchema } from "@/lib/schema-org";
import { SITE_NAME } from "@/lib/seo-site";

const ABOUT_DESC =
  "What is RankFlowHQ? SEO and content software for SERP research, AI-assisted drafts, outreach planning, and India-focused education trends—built for marketers and publishers.";

export const metadata: Metadata = buildPageMetadata({
  title: "About RankFlowHQ — SEO & Content Tools",
  description: ABOUT_DESC,
  path: "/about",
  keywords: [
    "RankFlowHQ",
    "SEO software",
    "content marketing tools",
    "about RankFlowHQ",
  ],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildStaticWebPageSchema({
          path: "/about",
          name: `About ${SITE_NAME} — SEO & content tools`,
          description: ABOUT_DESC,
          pageType: "AboutPage",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ],
        })}
      />
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        About
      </p>
      <h1 className="mt-3 font-display text-3xl text-text-primary md:text-4xl">
        About {SITE_NAME}
      </h1>
      <div className="mt-8 space-y-5 font-serif text-base leading-relaxed text-text-secondary">
        <p>
          <strong className="text-text-primary">{SITE_NAME}</strong> brings together
          practical SEO workflows in one place: from keyword and SERP-informed article
          drafting to backlink prospecting, plus education trends and news digests for
          research.
        </p>
        <p>
          The tools are built for marketers, editors, and growth teams who need fast,
          structured output — always with human review before anything goes live.
        </p>
        <p>
          APIs (such as Google Gemini, Tavily, Serper, and others) power different
          features; availability and limits depend on your own keys and provider terms.
        </p>
        <p className="font-mono text-sm text-text-muted">
          Questions about policies? See our{" "}
          <Link href="/privacy" className="text-accent underline-offset-2 hover:underline">
            Privacy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-accent underline-offset-2 hover:underline">
            Terms
          </Link>
          .
        </p>
      </div>
    </main>
    </>
  );
}
