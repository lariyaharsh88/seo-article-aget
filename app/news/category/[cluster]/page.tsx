import type { Metadata } from "next";
import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListPagination } from "@/components/ListPagination";
import { LIST_PAGE_SIZE, parseListPageParam } from "@/lib/list-pagination";
import { prisma } from "@/lib/prisma";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildCollectionPageSchema } from "@/lib/schema-org";
import {
  getNewsClusterMeta,
  inferNewsClusterFromText,
  listNewsClusters,
  type NewsClusterId,
} from "@/lib/education-news/topic-clusters";

type Props = {
  params: { cluster: string };
  searchParams: { page?: string | string[] };
};

function asClusterId(raw: string): NewsClusterId | null {
  const t = raw.trim().toLowerCase();
  if (t === "ssc" || t === "rrb" || t === "upsc" || t === "board-results") {
    return t;
  }
  return null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const cluster = asClusterId(params.cluster);
  if (!cluster) return {};
  const meta = getNewsClusterMeta(cluster);
  const page = parseListPageParam(searchParams?.page);
  const siteOrigin = await getRequestSiteOrigin();
  const path =
    page > 1 ? `${meta.path}?page=${page}` : meta.path;
  return buildPageMetadata({
    title: page > 1 ? `${meta.label} News (page ${page})` : meta.heading,
    description: meta.description,
    path,
    siteOrigin,
    keywords: [meta.label, "exam updates", "admit card", "result updates"],
  });
}

export const dynamic = "force-dynamic";

export default async function NewsClusterPillarPage({ params, searchParams }: Props) {
  const cluster = asClusterId(params.cluster);
  if (!cluster) notFound();
  const meta = getNewsClusterMeta(cluster);
  const siteOrigin = await getRequestSiteOrigin();
  const requestedPage = parseListPageParam(searchParams?.page);
  const skip = (requestedPage - 1) * LIST_PAGE_SIZE;

  const rows = await prisma.educationNewsArticle.findMany({
    where: {
      siteDomain: SiteDomain.education,
      repurposeStatus: "ready",
      repurposedSlug: { not: null },
      repurposedAt: { not: null },
    },
    select: {
      id: true,
      title: true,
      source: true,
      url: true,
      lastmod: true,
      repurposedSlug: true,
      repurposedAt: true,
    },
    orderBy: { repurposedAt: "desc" },
    take: 2000,
  });

  const filtered = rows.filter(
    (r) =>
      Boolean(r.repurposedSlug?.trim()) &&
      inferNewsClusterFromText(r.title, r.source, r.url) === cluster,
  );

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / LIST_PAGE_SIZE);
  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);
  if (total > 0 && requestedPage > totalPages) {
    redirect(totalPages <= 1 ? meta.path : `${meta.path}?page=${totalPages}`);
  }
  if (total === 0 && requestedPage > 1) {
    redirect(meta.path);
  }

  const items = filtered.slice(skip, skip + LIST_PAGE_SIZE);

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: meta.path,
          headline: meta.heading,
          description: meta.description,
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
            { name: "Categories", path: "/news/category" },
            { name: meta.label, path: meta.path },
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
          /{" "}
          <Link href="/news/category" className="hover:text-accent">
            Categories
          </Link>{" "}
          / <span className="text-text-secondary">{meta.label}</span>
        </nav>

        <header className="mt-5 rounded-2xl border border-border bg-surface/55 px-5 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {meta.label} cluster
          </p>
          <h1 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            {meta.heading}
          </h1>
          <p className="mt-2 max-w-3xl font-serif text-sm text-text-secondary">
            {meta.description}
          </p>
        </header>

        {items.length === 0 ? (
          <p className="mt-8 font-serif text-sm text-text-muted">
            No articles found in this cluster yet.
          </p>
        ) : (
          <>
            <ul className="mt-8 grid gap-4">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/news/${encodeURIComponent(item.repurposedSlug as string)}`}
                    className="group block rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/40"
                  >
                    <span className="font-display text-xl text-text-primary group-hover:text-accent">
                      {item.title}
                    </span>
                    <span className="mt-2 block font-mono text-[11px] text-text-muted">
                      Source topic: {item.source}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {totalPages > 0 ? (
              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={meta.path}
              />
            ) : null}
          </>
        )}

        <section className="mt-10 rounded-xl border border-border bg-background/40 p-4">
          <h2 className="font-display text-2xl text-text-primary">All topical clusters</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {listNewsClusters().map((c) => (
              <li key={c.id}>
                <Link href={c.path} className="font-mono text-xs text-accent hover:underline">
                  {c.label} updates hub
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
