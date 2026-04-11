import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "Off-page SEO — Backlink outreach",
  description:
    "Prospect domains for guest posts and links: Serper-based discovery, heuristic DA and INR pricing, contact extraction, Gemini prioritization.",
  path: "/off-page-seo",
});

export default function OffPageSeoLayout({ children }: { children: ReactNode }) {
  return children;
}
