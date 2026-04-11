import type { BlogPost } from "@prisma/client";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { findPublishedBlogPostBySlug } from "@/lib/blog-post-query";
import { buildPageMetadata } from "@/lib/seo-page";
import { SITE_NAME } from "@/lib/seo-site";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  let title = "Blog post";
  let description = SITE_NAME;
  try {
    const post = await findPublishedBlogPostBySlug(params.slug);
    if (post) {
      title = post.title;
      description = (post.excerpt?.slice(0, 160) || post.title) ?? SITE_NAME;
    }
  } catch {
    /* DB unavailable after retries */
  }
  return buildPageMetadata({
    title,
    description,
    path: `/blogs/${params.slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  noStore();
  let post: BlogPost | null = null;
  let dbError = false;
  try {
    post = await findPublishedBlogPostBySlug(params.slug);
  } catch (err) {
    console.error("[blogs/[slug]] database error:", err);
    dbError = true;
  }

  if (dbError) {
    return (
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link
            href="/blogs"
            className="text-text-muted transition-colors hover:text-accent"
          >
            ← All posts
          </Link>
        </p>
        <h1 className="mt-6 font-display text-2xl text-text-primary">
          Could not load this article
        </h1>
        <p className="mt-3 font-serif text-sm text-text-secondary">
          The database was unreachable or returned an error. Refresh the page or
          try again in a moment.
        </p>
      </main>
    );
  }

  if (!post) {
    notFound();
  }

  marked.setOptions({ gfm: true });
  let html: string;
  try {
    html = await marked.parse(post.content);
  } catch (parseErr) {
    console.error("[blogs/[slug]] markdown parse error:", parseErr);
    html =
      '<p class="text-text-muted">This article could not be rendered. Try again later.</p>';
  }

  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
      <p className="font-mono text-xs">
        <Link
          href="/blogs"
          className="text-text-muted transition-colors hover:text-accent"
        >
          ← All posts
        </Link>
      </p>
      <article className="mt-6">
        <time
          className="font-mono text-xs text-text-muted"
          dateTime={post.createdAt.toISOString()}
        >
          {post.createdAt.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <h1 className="mt-3 font-display text-3xl text-text-primary sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 font-serif text-base text-text-secondary sm:text-lg">
            {post.excerpt}
          </p>
        )}
        <div
          className="blog-prose mt-10 overflow-x-auto font-serif text-text-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
