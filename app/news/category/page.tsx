import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildCollectionPageSchema } from "@/lib/schema-org";
import { listNewsClusters } from "@/lib/education-news/topic-clusters";
import { buildPageMetadata } from "@/lib/seo-page";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";

export async function generateMetadata(): Promise<Metadata> {
  const siteOrigin = await getRequestSiteOrigin();
  return buildPageMetadata({
    title: "Education News Categories",
    description:
      "Explore education news by topical clusters: SSC, RRB, UPSC, and board result updates.",
    path: "/news/category",
    siteOrigin,
    keywords: [
      "ssc news",
      "rrb updates",
      "upsc notifications",
      "board result updates",
    ],
  });
}

export const dynamic = "force-dynamic";

export default async function NewsCategoryIndexPage() {
  const siteOrigin = await getRequestSiteOrigin();
  const clusters = listNewsClusters();

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/news/category",
          headline: "Education News Categories",
          description:
            "Topical education news clusters for SSC, RRB, UPSC, and Board Results.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
            { name: "Categories", path: "/news/category" },
          ],
          base: siteOrigin,
        })}
      />
      <main className="mx-auto min-w-0 max-w-4xl px-4 py-8 sm:py-10 md:px-6">
        <nav className="font-mono text-xs text-text-muted">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/news" className="hover:text-accent">
            News
          </Link>{" "}
          / <span className="text-text-secondary">Categories</span>
        </nav>
        <header className="mt-5 rounded-2xl border border-border bg-surface/55 px-5 py-6">
          <h1 className="font-display text-3xl text-text-primary sm:text-4xl">
            Education News Categories
          </h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            Explore authoritative category hubs and navigate topic-wise updates faster.
          </p>
        </header>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {clusters.map((cluster) => (
            <li key={cluster.id}>
              <Link
                href={cluster.path}
                className="group block rounded-xl border border-border bg-surface/50 p-5 transition-colors hover:border-accent/40"
              >
                <h2 className="font-display text-2xl text-text-primary group-hover:text-accent">
                  {cluster.label}
                </h2>
                <p className="mt-2 font-serif text-sm text-text-secondary">
                  {cluster.description}
                </p>
                <span className="mt-3 inline-block font-mono text-xs text-accent">
                  Open cluster →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
