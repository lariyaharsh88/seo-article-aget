import type { Metadata } from "next";
import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListPagination } from "@/components/ListPagination";
import { LIST_PAGE_SIZE, parseListPageParam } from "@/lib/list-pagination";
import { prisma } from "@/lib/prisma";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildCollectionPageSchema } from "@/lib/schema-org";

type Props = { searchParams: { page?: string | string[] } };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const page = parseListPageParam(searchParams?.page);
  const title =
    page > 1 ? `Generated Articles (page ${page})` : "Generated Articles";
  const path = page > 1 ? `/article/generated?page=${page}` : "/article/generated";
  const siteOrigin = await getRequestSiteOrigin();
  return buildPageMetadata({
    title,
    description: "Browse all AI-generated articles published by RankFlowHQ.",
    path,
    siteOrigin,
  });
}

export const dynamic = "force-dynamic";

export default async function GeneratedArticleIndexPage({ searchParams }: Props) {
  const requestedPage = parseListPageParam(searchParams?.page);
  const skip = (requestedPage - 1) * LIST_PAGE_SIZE;
  const siteOrigin = await getRequestSiteOrigin();

  let items: {
    id: string;
    slug: string;
    title: string;
    updatedAt: Date;
  }[] = [];
  let total = 0;
  let loadFailed = false;

  try {
    const [count, rows] = await Promise.all([
      prisma.sharedArticle.count({ where: { siteDomain: SiteDomain.main } }),
      prisma.sharedArticle.findMany({
        where: { siteDomain: SiteDomain.main },
        select: { id: true, slug: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        skip,
        take: LIST_PAGE_SIZE,
      }),
    ]);
    total = count;
    items = rows;
  } catch (e) {
    console.error("[article/generated] list error:", e);
    loadFailed = true;
  }

  const totalPages = total === 0 ? 0 : Math.ceil(total / LIST_PAGE_SIZE);
  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);

  if (!loadFailed && total > 0 && requestedPage > totalPages) {
    redirect(
      totalPages <= 1 ? "/article/generated" : `/article/generated?page=${totalPages}`,
    );
  }
  if (!loadFailed && total === 0 && requestedPage > 1) {
    redirect("/article/generated");
  }

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/article/generated",
          headline: "Generated Articles",
          description: "Listing of AI-generated articles on RankFlowHQ.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "Articles", path: "/article" },
            { name: "Generated", path: "/article/generated" },
          ],
          base: siteOrigin,
        })}
      />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/article" className="text-text-muted hover:text-accent">
            ← All articles
          </Link>
        </p>
        <header className="mb-8 mt-4 border-b border-border pb-6">
          <h1 className="font-display text-3xl text-text-primary sm:text-4xl">
            Generated Articles
          </h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            AI-generated publish-ready articles created in RankFlowHQ.
          </p>
        </header>

        {loadFailed ? (
          <p
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
            role="alert"
          >
            Could not load generated articles right now. Please refresh in a moment.
          </p>
        ) : items.length === 0 ? (
          <p className="font-serif text-sm text-text-muted">
            No generated articles found yet.
          </p>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/article/${encodeURIComponent(item.slug)}`}
                    className="group block rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/40"
                  >
                    <span className="font-display text-xl text-text-primary group-hover:text-accent">
                      {item.title}
                    </span>
                    <span className="mt-2 block font-mono text-[11px] text-text-muted">
                      Updated{" "}
                      {item.updatedAt.toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {totalPages > 0 ? (
              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/article/generated"
              />
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
