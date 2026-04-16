import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const DESC =
  "Paste any article URL and run the full RankFlowHQ SEO pipeline: keyword extraction, research, outline, optimized draft, audit, and optional visual HTML.";

const schema = buildToolWebApplicationSchema({
  path: "/repurpose-url",
  name: "Repurpose from URL",
  headline: "Repurpose from URL",
  description: DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "Repurpose Article from URL — Full SEO Pipeline",
  description: DESC,
  path: "/repurpose-url",
  keywords: [
    "URL to article",
    "repurpose content",
    "SEO pipeline",
    "article rewrite",
    "RankFlowHQ",
  ],
});

export default function RepurposeUrlLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={schema} />
      {children}
    </>
  );
}
