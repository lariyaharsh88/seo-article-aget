import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { listReadyRepurposedNews } from "@/lib/education-news/repurposed-news-query";
import { buildNewsIndexSchema } from "@/lib/schema-org";
import { buildPageMetadata } from "@/lib/seo-page";

export const dynamic = "force-dynamic";

const DESC =
  "Repurposed education news on RankFlowHQ—SEO-friendly articles on exams, boards, and higher ed. Browse the index and open full stories under /news.";

export const metadata: Metadata = buildPageMetadata({
  title: "Education News Articles — Repurposed SEO Stories",
  description: DESC,
  path: "/news",
  keywords: [
    "education news articles",
    "repurposed news SEO",
    "exam updates",
    "India education news",
  ],
});

export default async function NewsIndexPage() {
  let items: Awaited<ReturnType<typeof listReadyRepurposedNews>> = [];
  try {
    items = await listReadyRepurposedNews();
  } catch (e) {
    console.error("[news] list error:", e);
  }

  const schema = buildNewsIndexSchema({
    description: DESC,
    items: items.map((it) => ({ title: it.title, slug: it.slug })),
  });

  return (
    <>
      <JsonLd data={schema} />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link
            href="/"
            className="text-text-muted transition-colors hover:text-accent"
          >
            ← Home
          </Link>
        </p>
        <h1 className="mt-6 font-display text-3xl text-text-primary sm:text-4xl">
          News
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-sm text-text-secondary sm:text-base">
          Articles repurposed from education publishers, published on this site with
          stable URLs under <span className="font-mono text-accent">/news/</span>.
        </p>

        {items.length === 0 ? (
          <p className="mt-10 font-serif text-sm text-text-muted">
            No published repurposed articles yet. Run{" "}
            <Link href="/education-news" className="text-accent underline">
              Repurpose
            </Link>{" "}
            from the education news dashboard.
          </p>
        ) : (
          <ul className="mt-10 space-y-4 border-t border-border pt-8">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border/80 pb-4 last:border-0">
                <Link
                  href={`/news/${encodeURIComponent(item.slug)}`}
                  className="group block"
                >
                  <span className="font-display text-lg text-text-primary group-hover:text-accent">
                    {item.title}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-text-muted">
                    {item.source} ·{" "}
                    {item.repurposedAt.toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
