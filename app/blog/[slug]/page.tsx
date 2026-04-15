import type { BlogPost } from "@prisma/client";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import {
  ArticleLeadCapture,
  ArticleLeadCtaStrip,
} from "@/components/ArticleLeadCapture";
import { ContentInterlinks } from "@/components/ContentInterlinks";
import { JsonLd } from "@/components/JsonLd";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import {
  findPublishedBlogPostBySlug,
  listPublishedBlogPostsExceptSlug,
} from "@/lib/blog-post-query";
import { addHeadingIdsToHtml, extractTocFromMarkdown } from "@/lib/blog-toc";
import { markdownToArticleBodyHtml } from "@/lib/markdown-to-html";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildPageMetadata } from "@/lib/seo-page";
import { buildBlogPostingSchema } from "@/lib/schema-org";
import { SITE_NAME } from "@/lib/seo-site";
import { permanentRedirectIfWrongSiteDomain } from "@/lib/site-domain-redirect";

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
      await permanentRedirectIfWrongSiteDomain(
        post.siteDomain,
        `/blogs/${params.slug}`,
      );
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
  const siteOrigin = await getRequestSiteOrigin();
  return buildPageMetadata({
    title,
    description,
    path: `/blog/${params.slug}`,
    article,
    siteOrigin,
  });
}

export default async function BlogPostPage({ params }: Props) {
  noStore();
  let post: BlogPost | null = null;
  try {
    post = await findPublishedBlogPostBySlug(params.slug);
  } catch (err) {
    console.error("[blog/[slug]] database error:", err);
    throw err instanceof Error ? err : new Error("Database error");
  }

  if (!post) notFound();

  await permanentRedirectIfWrongSiteDomain(
    post.siteDomain,
    `/blogs/${params.slug}`,
  );

  const siteOrigin = await getRequestSiteOrigin();
  let peerPosts: Awaited<ReturnType<typeof listPublishedBlogPostsExceptSlug>> = [];
  try {
    peerPosts = await listPublishedBlogPostsExceptSlug(
      post.slug,
      6,
      post.siteDomain,
    );
  } catch (e) {
    console.error("[blog/[slug]] peer posts:", e);
  }
  const relatedBlogLinks = peerPosts.slice(0, 2);
  const fallbackBlogLinks = [
    { href: "/blog", label: "Explore all blog posts" },
    { href: "/blogs", label: "Browse legacy blog archive" },
  ] as const;

  let html: string;
  const toc = extractTocFromMarkdown(post.content);
  try {
    html = addHeadingIdsToHtml(markdownToArticleBodyHtml(post.content), toc);
  } catch (parseErr) {
    console.error("[blog/[slug]] markdown parse error:", parseErr);
    html =
      '<p class="text-text-muted">This article could not be rendered. Try again later.</p>';
  }

  return (
    <>
      <JsonLd data={buildBlogPostingSchema(post, { base: siteOrigin })} />
      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8 sm:py-10 md:px-6">
        <p className="font-mono text-xs">
          <Link
            href="/blog"
            className="text-text-muted transition-colors hover:text-accent"
          >
            ← All posts
          </Link>
        </p>
        <article className="mt-6 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            {toc.length > 0 ? (
              <nav
                aria-label="Table of contents"
                className="rounded-xl border border-border bg-surface/40 p-4"
              >
                <h2 className="font-mono text-xs uppercase tracking-wide text-accent">
                  Table of contents
                </h2>
                <ul className="mt-3 space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block font-serif text-sm text-text-secondary hover:text-accent ${
                          item.level === 3 ? "pl-4 text-xs" : ""
                        }`}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </aside>
          <div className="min-w-0">
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
            {post.excerpt ? (
              <p className="mt-4 font-serif text-base text-text-secondary sm:text-lg">
                {post.excerpt}
              </p>
            ) : null}
            <ArticleLeadCtaStrip className="mt-4" />
            <div
              className="blog-prose mt-10 overflow-x-auto font-serif text-text-primary"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <section className="mt-10 rounded-2xl border border-accent/30 bg-accent/10 p-6">
              <h2 className="font-display text-2xl text-text-primary">
                Turn this keyword into a ranked article → Try RankFlowHQ
              </h2>
              <p className="mt-2 font-serif text-sm text-text-secondary">
                Turn your topic, keywords, and SERP context into a complete SEO
                draft with metadata and structured sections in one workflow.
              </p>
              <Link
                href="/seo-agent"
                className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background transition-opacity hover:opacity-90"
              >
                Try RankFlowHQ
              </Link>
            </section>
            <section className="mt-8 rounded-2xl border border-border bg-surface/50 p-6">
              <h2 className="font-display text-2xl text-text-primary">
                Explore more AI SEO resources
              </h2>
              <ul className="mt-3 space-y-2 font-serif text-sm text-text-secondary">
                <li>
                  <Link href="/ai-seo-tools" className="text-accent hover:underline">
                    AI SEO tools overview
                  </Link>
                </li>
                <li>
                  <Link href="/seo-agent" className="text-accent hover:underline">
                    SEO Article Generator tool
                  </Link>
                </li>
                {relatedBlogLinks.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/blog/${encodeURIComponent(item.slug)}`}
                      className="text-accent hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
                {relatedBlogLinks.length < 2
                  ? fallbackBlogLinks
                      .slice(0, 2 - relatedBlogLinks.length)
                      .map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} className="text-accent hover:underline">
                            {item.label}
                          </Link>
                        </li>
                      ))
                  : null}
              </ul>
            </section>
            <ArticleLeadCapture
              source="blog"
              articleSlug={post.slug}
              articleTitle={post.title}
            />
          </div>
        </article>
        <ContentInterlinks
          headingId="more-blog-posts"
          heading="More posts"
          items={peerPosts.map((p) => ({
            href: `/blog/${encodeURIComponent(p.slug)}`,
            title: p.title,
            description: p.excerpt?.trim() || null,
          }))}
          seeAllHref="/blog"
          seeAllLabel="All posts"
        />
      </main>
    </>
  );
}
