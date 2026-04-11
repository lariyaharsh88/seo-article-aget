import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo-page";
import { SITE_NAME } from "@/lib/seo-site";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  let title = "Blog post";
  let description = SITE_NAME;
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: params.slug, published: true },
      select: { title: true, excerpt: true },
    });
    if (post) {
      title = post.title;
      description = (post.excerpt?.slice(0, 160) || post.title) ?? SITE_NAME;
    }
  } catch {
    /* DB unavailable */
  }
  return buildPageMetadata({
    title,
    description,
    path: `/blogs/${params.slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost
    .findFirst({
      where: { slug: params.slug, published: true },
    })
    .catch(() => null);

  if (!post) {
    notFound();
  }

  marked.setOptions({ gfm: true });
  const html = await marked.parse(post.content);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
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
        <h1 className="mt-3 font-display text-4xl text-text-primary md:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 font-serif text-lg text-text-secondary">
            {post.excerpt}
          </p>
        )}
        <div
          className="blog-prose mt-10 font-serif text-text-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
