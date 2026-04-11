import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { listPublishedBlogPosts } from "@/lib/blog-post-query";
import { buildPageMetadata } from "@/lib/seo-page";

export const metadata = buildPageMetadata({
  title: "Blog",
  description: "Articles and updates from RankFlowHQ.",
  path: "/blogs",
});

export const dynamic = "force-dynamic";

export default async function BlogsIndexPage() {
  noStore();
  let posts: Awaited<ReturnType<typeof listPublishedBlogPosts>> = [];
  let listError = false;
  try {
    posts = await listPublishedBlogPosts();
  } catch (err) {
    console.error("[blogs] listPublishedBlogPosts:", err);
    listError = true;
  }

  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
      {listError ? (
        <div
          role="alert"
          className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-serif text-sm text-amber-100"
        >
          Could not load articles right now (database unreachable). Refresh the
          page in a few seconds.
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
            <p className="text-sm text-text-secondary">
              Only{" "}
              <span className="font-mono text-text-muted">published</span> rows
              appear here. Set{" "}
              <span className="font-mono text-text-muted">published</span> to
              true in the database or use Blog CMS so the post is saved as
              published.
            </p>
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
                  <Link href={`/blogs/${post.slug}`} prefetch={false}>
                    {post.title}
                  </Link>
                </h2>
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
    </main>
  );
}
