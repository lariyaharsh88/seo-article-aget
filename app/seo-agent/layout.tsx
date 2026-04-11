import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "SEO article pipeline",
  description:
    "Run the full pipeline: SERP + Tavily research, Gemini outline and draft, citations, SEO meta pack, and data infographics.",
  path: "/seo-agent",
});

export default function SeoAgentLayout({ children }: { children: ReactNode }) {
  return children;
}
