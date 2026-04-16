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
            SEO Growth Articles
          </h1>
          <p className="mt-3 max-w-xl font-serif text-text-secondary">
            Actionable guides on SEO content strategy, keyword planning, ranking workflows,
            and AI-assisted optimization.
          </p>
        </header>
        <section className="mb-8 rounded-xl border border-border bg-surface/40 p-4 sm:p-5">
          <h2 className="font-display text-2xl text-text-primary">Popular SEO topics</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/seo-agent", label: "AI SEO article generation workflow" },
              { href: "/free-tools/keyword-clustering", label: "Keyword clustering and topic maps" },
              { href: "/free-tools/ai-search-grader", label: "AI search visibility and SEO quality checks" },
              { href: "/pages", label: "Complete SEO tool stack and templates" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 w-full items-center rounded-lg border border-border/70 bg-background/30 px-3 py-2 font-serif text-sm text-text-secondary hover:border-accent/60 hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
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
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                    SEO guide
                  </p>
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
        <section className="mt-10 rounded-xl border border-border bg-surface/40 p-5">
          <h2 className="font-display text-2xl text-text-primary">
            Keep exploring SEO content optimization
          </h2>
          <p className="mt-2 font-serif text-sm leading-relaxed text-text-secondary">
            Continue to related resources to deepen topical authority and improve retention through
            stronger internal linking paths.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/blogs" className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent/70 hover:text-text-primary">
              Browse full blog archive
            </Link>
            <Link href="/article" className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent/70 hover:text-text-primary">
              Read generated SEO articles
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
