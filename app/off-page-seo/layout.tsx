import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const OFF_PAGE_DESC =
  "Prospect domains for guest posts and links: Serper-based discovery, heuristic DA and INR pricing, contact extraction, Gemini prioritization.";

const offPageSchema = buildToolWebApplicationSchema({
  path: "/off-page-seo",
  name: "Off-page SEO — Backlink outreach",
  headline: "Backlink prospecting & outreach planner",
  description: OFF_PAGE_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "Off-page SEO — Backlink outreach",
  description: OFF_PAGE_DESC,
  path: "/off-page-seo",
});

export default function OffPageSeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={offPageSchema} />
      {children}
    </>
  );
}
