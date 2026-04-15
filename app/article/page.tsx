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
import { ALLOWED_BLOG_SLUGS } from "@/lib/static-blog-posts";

type Props = { searchParams: { page?: string | string[] } };

type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const page = parseListPageParam(searchParams?.page);
  const title = page > 1 ? `Articles (page ${page})` : "Articles";
  const path = page > 1 ? `/article?page=${page}` : "/article";
  const siteOrigin = await getRequestSiteOrigin();
  return buildPageMetadata({
    title,
    description:
      "All generated and published RankFlowHQ articles on the main domain.",
    path,
    siteOrigin,
  });
}

export const dynamic = "force-dynamic";

export default async function ArticleIndexPage({ searchParams }: Props) {
  const requestedPage = parseListPageParam(searchParams?.page);
  const skip = (requestedPage - 1) * LIST_PAGE_SIZE;
  const siteOrigin = await getRequestSiteOrigin();

  let items: ArticleListItem[] = [];
  let total = 0;
  let loadFailed = false;

  try {
    const [sharedCount, sharedRows, blogCount, blogRows] = await Promise.all([
      prisma.sharedArticle.count({ where: { siteDomain: SiteDomain.main } }),
      prisma.sharedArticle.findMany({
        where: { siteDomain: SiteDomain.main },
        select: { id: true, slug: true, title: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.blogPost.count({
        where: {
          siteDomain: SiteDomain.main,
          published: true,
          slug: { notIn: [...ALLOWED_BLOG_SLUGS] },
        },
      }),
      prisma.blogPost.findMany({
        where: {
          siteDomain: SiteDomain.main,
          published: true,
          slug: { notIn: [...ALLOWED_BLOG_SLUGS] },
        },
        select: { id: true, slug: true, title: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    total = sharedCount + blogCount;
    items = [...sharedRows, ...blogRows]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(skip, skip + LIST_PAGE_SIZE);
  } catch (e) {
    console.error("[article] list error:", e);
    loadFailed = true;
  }

  const totalPages = total === 0 ? 0 : Math.ceil(total / LIST_PAGE_SIZE);
  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);

  if (!loadFailed && total > 0 && requestedPage > totalPages) {
    redirect(totalPages <= 1 ? "/article" : `/article?page=${totalPages}`);
  }
  if (!loadFailed && total === 0 && requestedPage > 1) {
    redirect("/article");
  }

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/article",
          headline: "Articles",
          description:
            "All generated and published RankFlowHQ articles on the main domain.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "Articles", path: "/article" },
          ],
          base: siteOrigin,
        })}
      />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <header className="mb-8 border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Main Domain
          </p>
          <h1 className="mt-2 font-display text-3xl text-text-primary sm:text-4xl">
            Articles
          </h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            Browse all previously generated and published long-form articles.
          </p>
          <p className="mt-3 font-mono text-xs">
            <Link
              href="/article/generated"
              className="text-accent underline-offset-2 hover:underline"
            >
              View generated-only listing →
            </Link>
          </p>
        </header>

        {loadFailed ? (
          <p
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
            role="alert"
          >
            Could not load articles right now. Please refresh in a moment.
          </p>
        ) : items.length === 0 ? (
          <p className="font-serif text-sm text-text-muted">
            No articles found yet.
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
                basePath="/article"
              />
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
