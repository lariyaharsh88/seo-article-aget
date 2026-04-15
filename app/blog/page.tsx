import type { Metadata } from "next";
import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListPagination } from "@/components/ListPagination";
import { getCachedPublishedBlogPostsPage } from "@/lib/cached-blog-posts";
import { LIST_PAGE_SIZE, parseListPageParam } from "@/lib/list-pagination";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildCollectionPageSchema } from "@/lib/schema-org";

type Props = { searchParams: { page?: string | string[] } };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const page = parseListPageParam(searchParams?.page);
  const title = page > 1 ? `Blog (page ${page})` : "Blog";
  const path = page > 1 ? `/blog?page=${page}` : "/blog";
  return buildPageMetadata({
    title,
    description: "Articles and updates from RankFlowHQ.",
    path,
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export default async function BlogIndexPage({ searchParams }: Props) {
  const requestedPage = parseListPageParam(searchParams?.page);
  let posts: Awaited<
    ReturnType<typeof getCachedPublishedBlogPostsPage>
  >["items"] = [];
  let total = 0;
  let listError = false;
  try {
    const result = await getCachedPublishedBlogPostsPage(
      requestedPage,
      LIST_PAGE_SIZE,
      SiteDomain.main,
    );
    posts = result.items;
    total = result.total;
  } catch (err) {
    console.error("[blog] listPublishedBlogPostsPage:", err);
    listError = true;
  }

  const totalPages = total === 0 ? 0 : Math.ceil(total / LIST_PAGE_SIZE);
  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);

  if (!listError && total > 0 && requestedPage > totalPages) {
    redirect(totalPages <= 1 ? "/blog" : `/blog?page=${totalPages}`);
  }
  if (!listError && total === 0 && requestedPage > 1) {
    redirect("/blog");
  }

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          path: "/blog",
          headline: "Blog",
          description: "Articles and updates from RankFlowHQ.",
          breadcrumb: [
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ],
        })}
      />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        {listError ? (
          <div
            role="alert"
            className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
          >
            Could not load articles right now. Please refresh in a moment.
          </div>
        ) : null}
        <header className="mb-10 border-b border-border pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Blog
          </p>
          <h1 className="font-display text-3xl text-text-primary sm:text-4xl md:text-5xl">
            Articles
          </h1>
          <p className="mt-3 max-w-xl font-serif text-text-secondary">
            Notes on SEO tooling, content workflows, and product updates.
          </p>
        </header>
        <ul className="space-y-6">
          {!listError && posts.length === 0 ? (
            <li className="space-y-2 font-serif text-text-muted">
              <p>No published posts yet.</p>
            </li>
          ) : listError ? null : (
            posts.map((post) => (
              <li key={post.id}>
                <article className="group rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/40 sm:p-6">
                  <time
                    className="font-mono text-xs text-text-muted"
                    dateTime={post.createdAt.toISOString()}
                  >
                    {post.createdAt.toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <h2 className="mt-2 font-display text-2xl text-text-primary group-hover:text-accent">
                    <Link href={`/blog/${post.slug}`} prefetch={false}>
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-2 font-serif text-sm text-text-secondary line-clamp-3">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <Link
                    href={`/blog/${post.slug}`}
                    prefetch={false}
                    className="mt-3 inline-block font-mono text-xs text-accent"
                  >
                    Read more →
                  </Link>
                </article>
              </li>
            ))
          )}
        </ul>
        {!listError && totalPages > 0 ? (
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/blog"
          />
        ) : null}
      </main>
    </>
  );
}
