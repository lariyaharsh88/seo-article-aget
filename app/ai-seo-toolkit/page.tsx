import type { Metadata } from "next";
import { AiSeoToolkitClient } from "@/components/ai-seo-toolkit/AiSeoToolkitClient";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata: Metadata = buildPageMetadata({
  title: "AI SEO Toolkit",
  description:
    "AI visibility tracking, prompt mining, and AEO content optimization — local SQLite MVP powered by OpenRouter.",
  path: "/ai-seo-toolkit",
});

export default function AiSeoToolkitPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <AiSeoToolkitClient />
    </main>
  );
}
