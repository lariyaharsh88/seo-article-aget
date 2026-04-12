import type { BlogPost } from "@prisma/client";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { markdownToArticleBodyHtml } from "@/lib/markdown-to-html";
import { ContentInterlinks } from "@/components/ContentInterlinks";
import { JsonLd } from "@/components/JsonLd";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import {
  findPublishedBlogPostBySlug,
  listPublishedBlogPostsExceptSlug,
} from "@/lib/blog-post-query";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildBlogPostingSchema } from "@/lib/schema-org";
import { SITE_NAME } from "@/lib/seo-site";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  let title = "Blog post";
  let description = SITE_NAME;
  let article:
    | { publishedTime: string; modifiedTime: string }
    | undefined;
  try {
    const post = await findPublishedBlogPostBySlug(params.slug);
    if (post) {
      title = post.title;
      description = (post.excerpt?.slice(0, 160) || post.title) ?? SITE_NAME;
      article = {
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
      };
    }
  } catch {
    /* DB unavailable after retries */
  }
  return buildPageMetadata({
    title,
    description,
    path: `/blogs/${params.slug}`,
    article,
  });
}

export default async function BlogPostPage({ params }: Props) {
  noStore();
  let post: BlogPost | null = null;
  try {
    post = await findPublishedBlogPostBySlug(params.slug);
  } catch (err) {
    console.error("[blogs/[slug]] database error:", err);
    /** Real HTTP error via segment error.tsx — avoids Soft 404 (200 + error copy) in Search Console. */
    throw err instanceof Error ? err : new Error("Database error");
  }

  if (!post) {
    notFound();
  }

  let peerPosts: Awaited<ReturnType<typeof listPublishedBlogPostsExceptSlug>> = [];
  try {
    peerPosts = await listPublishedBlogPostsExceptSlug(post.slug, 6);
  } catch (e) {
    console.error("[blogs/[slug]] peer posts:", e);
  }

  let html: string;
  try {
    html = markdownToArticleBodyHtml(post.content);
  } catch (parseErr) {
    console.error("[blogs/[slug]] markdown parse error:", parseErr);
    html =
      '<p class="text-text-muted">This article could not be rendered. Try again later.</p>';
  }

  return (
    <>
      <JsonLd data={buildBlogPostingSchema(post)} />
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
        <p className="font-mono text-xs text-text-muted">
          <time dateTime={post.createdAt.toISOString()}>
            {post.createdAt.toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="mx-2 text-text-muted/60">·</span>
          <span className="text-text-secondary">
            By {post.authorName?.trim() || DEFAULT_ARTICLE_AUTHOR_NAME}
          </span>
        </p>
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
      <ContentInterlinks
        headingId="more-blog-posts"
        heading="More posts"
        items={peerPosts.map((p) => ({
          href: `/blogs/${encodeURIComponent(p.slug)}`,
          title: p.title,
          description: p.excerpt?.trim() || null,
        }))}
        seeAllHref="/blogs"
        seeAllLabel="All posts"
      />
    </main>
    </>
  );
}
