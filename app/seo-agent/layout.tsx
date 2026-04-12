import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const SEO_AGENT_DESC =
  "SEO article pipeline: topic → researched long-form draft. Serper + Tavily signals, Gemini outline and body, citations, meta title and description, and SVG infographics.";

const seoAgentSchema = buildToolWebApplicationSchema({
  path: "/seo-agent",
  name: "SEO article pipeline",
  headline: "SEO article pipeline",
  description: SEO_AGENT_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "SEO Article Generator — SERP Research to Published Draft",
  description: SEO_AGENT_DESC,
  path: "/seo-agent",
  keywords: [
    "SEO article generator",
    "AI long-form content",
    "SERP research",
    "Tavily",
    "Gemini writing",
    "SEO meta tags",
  ],
});

export default function SeoAgentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={seoAgentSchema} />
      {children}
    </>
  );
}
