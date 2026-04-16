import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildToolWebApplicationSchema } from "@/lib/schema-org";

const OFF_PAGE_DESC =
  "Off-page SEO prospector: discover guest-post and link targets, estimate authority, extract contacts, and prioritize outreach with smart ranking.";

const offPageSchema = buildToolWebApplicationSchema({
  path: "/off-page-seo",
  name: "Off-page SEO — backlink outreach",
  headline: "Backlink prospecting & outreach planner",
  description: OFF_PAGE_DESC,
});

export const metadata: Metadata = buildPageMetadata({
  title: "Off-Page SEO — Backlink Prospecting & Outreach",
  description: OFF_PAGE_DESC,
  path: "/off-page-seo",
  keywords: [
    "off-page SEO",
    "backlink outreach",
    "link building",
    "guest post prospects",
    "domain outreach",
  ],
});

export default function OffPageSeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={offPageSchema} />
      {children}
    </>
  );
}
