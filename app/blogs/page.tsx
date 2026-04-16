import type { Metadata } from "next";
import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListPagination } from "@/components/ListPagination";
import { getCachedPublishedBlogPostsPage } from "@/lib/cached-blog-posts";
import { prisma } from "@/lib/prisma";
import { LIST_PAGE_SIZE, parseListPageParam } from "@/lib/list-pagination";
import { buildPageMetadata } from "@/lib/seo-page";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { buildBlogsIndexSchema } from "@/lib/schema-org";
import { ALLOWED_BLOG_SLUGS } from "@/lib/static-blog-posts";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";

type Props = { searchParams: { page?: string | string[] } };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const page = parseListPageParam(searchParams?.page);
  const title = page > 1 ? `Blog (page ${page})` : "Blog";
  const path = page > 1 ? `/blogs?page=${page}` : "/blogs";
  const siteOrigin = await getRequestSiteOrigin();
  return buildPageMetadata({
    title,
    description: "Articles and updates from RankFlowHQ.",
    path,
    siteOrigin,
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Hobby plan max is 10s; Pro/Enterprise can use 60 — avoids cold Prisma + DB timeout. */
export const maxDuration = 60;

export default async function BlogsIndexPage({ searchParams }: Props) {
  const siteOrigin = await getRequestSiteOrigin();
  const markdown = await getToolExplainerMarkdown("blogs");
  const requestedPage = parseListPageParam(searchParams?.page);
  let corePosts: Awaited<
    ReturnType<typeof getCachedPublishedBlogPostsPage>
  >["items"] = [];
  let generatedPosts: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    createdAt: Date;
  }[] = [];
  let generatedTotal = 0;
  let listError = false;
  try {
    const coreResult = await getCachedPublishedBlogPostsPage(
      1,
      100,
      SiteDomain.main,
    );
    corePosts = coreResult.items.slice(0, 5);

    const skip = (requestedPage - 1) * LIST_PAGE_SIZE;
    const [count, rows] = await Promise.all([
      prisma.blogPost.count({
        where: {
          published: true,
          siteDomain: SiteDomain.main,
          slug: { notIn: [...ALLOWED_BLOG_SLUGS] },
        },
      }),
      prisma.blogPost.findMany({
        where: {
          published: true,
          siteDomain: SiteDomain.main,
          slug: { notIn: [...ALLOWED_BLOG_SLUGS] },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: LIST_PAGE_SIZE,
      }),
    ]);
    generatedTotal = count;
    generatedPosts = rows;
  } catch (err) {
    console.error("[blogs] listPublishedBlogPostsPage:", err);
    listError = true;
  }

  const totalPages =
    generatedTotal === 0 ? 0 : Math.ceil(generatedTotal / LIST_PAGE_SIZE);
  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(Math.max(1, requestedPage), totalPages);

  if (!listError && generatedTotal > 0 && requestedPage > totalPages) {
    redirect(totalPages <= 1 ? "/blogs" : `/blogs?page=${totalPages}`);
  }
  if (!listError && generatedTotal === 0 && requestedPage > 1) {
    redirect("/blogs");
  }

  return (
    <>
      <JsonLd data={buildBlogsIndexSchema({ base: siteOrigin })} />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        {listError ? (
          <div
            role="alert"
            className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
          >
            Could not load articles right now — the database did not respond in
            time (often a short-lived network or pooler blip). Try refreshing. If
            this persists for hours, check the host logs and that the database is
            up (including Supabase project not paused on free tier).
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
        {!listError && corePosts.length > 0 ? (
          <>
            <section>
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Main Articles (Top 5)
              </h2>
              <ul className="mt-4 space-y-6">
                {corePosts.map((post) => (
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
                      <h3 className="mt-2 font-display text-2xl text-text-primary group-hover:text-accent">
                        <Link href={`/blogs/${post.slug}`} prefetch={false}>
                          {post.title}
                        </Link>
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 font-serif text-sm text-text-secondary line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <Link
                        href={`/blogs/${post.slug}`}
                        prefetch={false}
                        className="mt-3 inline-block font-mono text-xs text-accent"
                      >
                        Read more →
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 border-t border-border pt-8">
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Generated Articles
              </h2>
              <p className="mt-2 font-serif text-sm text-text-secondary">
                Blog posts generated by your workflow, listed after the 5 core articles.
              </p>
            </section>
          </>
        ) : null}

        <ul className="mt-4 space-y-6">
          {!listError && generatedPosts.length === 0 ? (
            <li className="space-y-2 font-serif text-text-muted">
              <p>No generated blog posts yet.</p>
            </li>
          ) : listError ? null : (
            generatedPosts.map((post) => (
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
                  <h3 className="mt-2 font-display text-2xl text-text-primary group-hover:text-accent">
                    <Link href={`/blogs/${post.slug}`} prefetch={false}>
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 font-serif text-sm text-text-secondary line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <Link
                    href={`/blogs/${post.slug}`}
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
            basePath="/blogs"
          />
        ) : null}
      </main>
      <ToolExplainerSection markdown={markdown} />
    </>
  );
}
