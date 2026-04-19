import type { Metadata } from "next";
import { BulkArticleCreatingAgentClient } from "@/components/bulk-agent/BulkArticleCreatingAgentClient";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Bulk article creating agent",
    description:
      "Run the SEO article pipeline on multiple topics; save drafts to your automated articles (dashboard history), with optional CSV upload.",
    path: "/bulk-article-creating-agent",
    keywords: ["bulk SEO articles", "automated articles", "RankFlowHQ"],
  }),
  robots: { index: true, follow: true },
};

export default function BulkArticleCreatingAgentPage() {
  return <BulkArticleCreatingAgentClient />;
}
