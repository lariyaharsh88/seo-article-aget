import type { EducationNewsArticle } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { JsonLd } from "@/components/JsonLd";
import {
  findReadyRepurposedNewsBySlug,
  normalizeNewsSlugParam,
} from "@/lib/education-news/repurposed-news-query";
import { buildRepurposedNewsArticleSchema } from "@/lib/schema-org";
import { SITE_NAME } from "@/lib/seo-site";
import { buildPageMetadata } from "@/lib/seo-page";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let title = "News article";
  let description = SITE_NAME;
  let article:
    | { publishedTime: string; modifiedTime: string }
    | undefined;
  const slug = normalizeNewsSlugParam(params.slug);
  try {
    const post = await findReadyRepurposedNewsBySlug(slug);
    if (post?.repurposedSlug?.trim()) {
      title = post.title;
      description = post.title.slice(0, 160);
      if (post.repurposedAt) {
        article = {
          publishedTime: post.repurposedAt.toISOString(),
          modifiedTime: post.updatedAt.toISOString(),
        };
      }
    }
  } catch {
    /* DB unavailable */
  }
  return buildPageMetadata({
    title,
    description,
    path: `/news/${params.slug}`,
    article,
  });
}

export default async function RepurposedNewsArticlePage({ params }: Props) {
  noStore();
  let post: EducationNewsArticle | null = null;
  try {
    post = await findReadyRepurposedNewsBySlug(params.slug);
  } catch (err) {
    console.error("[news/[slug]] database error:", err);
    throw err instanceof Error ? err : new Error("Database error");
  }

  if (!post?.repurposedSlug?.trim() || !post.repurposedMarkdown?.trim()) {
    notFound();
  }

  marked.setOptions({ gfm: true });
  let html: string;
  try {
    html = await marked.parse(post.repurposedMarkdown);
  } catch (parseErr) {
    console.error("[news/[slug]] markdown parse error:", parseErr);
    html =
      '<p class="text-text-muted">This article could not be rendered. Try again later.</p>';
  }

  return (
    <>
      <JsonLd data={buildRepurposedNewsArticleSchema(post)} />
      <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link
            href="/news"
            className="text-text-muted transition-colors hover:text-accent"
          >
            ← All news
          </Link>
        </p>
        <article className="mt-6">
          <p className="font-mono text-xs text-text-muted">
            <span className="text-text-secondary">{post.source}</span>
            {post.repurposedAt ? (
              <>
                {" · "}
                <time dateTime={post.repurposedAt.toISOString()}>
                  {post.repurposedAt.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            ) : null}
          </p>
          <h1 className="mt-3 font-display text-3xl text-text-primary sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 font-mono text-[11px] text-text-muted">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              View original source
            </a>
            {post.repurposedCanonicalUrl ? (
              <>
                {" · "}
                <a
                  href={post.repurposedCanonicalUrl}
                  className="text-text-muted underline-offset-2 hover:text-accent hover:underline"
                >
                  Permalink (canonical)
                </a>
              </>
            ) : null}
          </p>
          <div
            className="blog-prose mt-10 overflow-x-auto font-serif text-text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </main>
    </>
  );
}
