import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const SEO_AGENT_DESC =
  "Run the full pipeline: SERP + Tavily research, Gemini outline and draft, citations, SEO meta pack, and data infographics.";

const seoAgentSchema = buildToolWebApplicationSchema({
  path: "/seo-agent",
  name: "SEO article pipeline",
  headline: "SEO article pipeline",
  description: SEO_AGENT_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "SEO article pipeline",
  description: SEO_AGENT_DESC,
  path: "/seo-agent",
});

export default function SeoAgentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={seoAgentSchema} />
      {children}
    </>
  );
}
