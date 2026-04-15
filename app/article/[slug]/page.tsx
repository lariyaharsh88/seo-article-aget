import type { Metadata } from "next";
import { SiteDomain } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PublicArticleShareBar } from "@/components/PublicArticleShareBar";
import { isAllowedBlogSlug } from "@/lib/static-blog-posts";
import { markdownToArticleBodyHtml } from "@/lib/markdown-to-html";
import { prisma } from "@/lib/prisma";
import { getRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildPageMetadata } from "@/lib/seo-page";
import { permanentRedirectIfWrongSiteDomain } from "@/lib/site-domain-redirect";

type Props = {
  params: { slug: string };
};

function buildDescription(markdown: string, fallbackTitle: string): string {
  const stripped = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (stripped || fallbackTitle).slice(0, 160);
}

type PublicArticlePayload = {
  slug: string;
  title: string;
  markdown: string;
  html: string;
  createdAt: Date;
  updatedAt: Date;
  provenance: "shared-article" | "blog-post";
};

async function findPublicArticleBySlug(
  slug: string,
): Promise<PublicArticlePayload | null> {
  const shared = await prisma.sharedArticle.findUnique({
    where: { slug },
  });
  if (shared) {
    return {
      slug: shared.slug,
      title: shared.title,
      markdown: shared.markdown,
      html: shared.html,
      createdAt: shared.createdAt,
      updatedAt: shared.updatedAt,
      provenance: "shared-article",
    };
  }

  if (isAllowedBlogSlug(slug)) return null;
  const blog = await prisma.blogPost.findFirst({
    where: {
      slug,
      published: true,
      siteDomain: SiteDomain.main,
    },
    select: {
      slug: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!blog) return null;

  return {
    slug: blog.slug,
    title: blog.title,
    markdown: blog.content,
    html: markdownToArticleBodyHtml(blog.content),
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    provenance: "blog-post",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await findPublicArticleBySlug(params.slug);
  if (!row) {
    return buildPageMetadata({
      title: "Article not found",
      description: "Article not found.",
      path: `/article/${params.slug}`,
    });
  }
  await permanentRedirectIfWrongSiteDomain(
    SiteDomain.main,
    `/article/${params.slug}`,
  );
  const siteOrigin = await getRequestSiteOrigin();
  const description = buildDescription(row.markdown, row.title);
  return buildPageMetadata({
    title: row.title,
    description,
    path: `/article/${row.slug}`,
    article: {
      publishedTime: row.createdAt.toISOString(),
      modifiedTime: row.updatedAt.toISOString(),
    },
    keywords: [
      "AI generated article",
      "SEO article",
      "programmatic SEO content",
      row.title,
    ],
    siteOrigin,
  });
}

export default async function PublicArticlePage({ params }: Props) {
  const row = await findPublicArticleBySlug(params.slug);
  if (!row) notFound();

  await permanentRedirectIfWrongSiteDomain(
    SiteDomain.main,
    `/article/${params.slug}`,
  );

  const siteOrigin = await getRequestSiteOrigin();
  const description = buildDescription(row.markdown, row.title);
  const canonicalUrl = `${siteOrigin}/article/${row.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: row.title,
    description,
    datePublished: row.createdAt.toISOString(),
    dateModified: row.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "RankFlowHQ" },
    publisher: { "@type": "Organization", name: "RankFlowHQ" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  } as Record<string, unknown>;

  return (
    <>
      <JsonLd data={schema} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <p className="font-mono text-xs">
          <Link href="/seo-agent" className="text-text-muted hover:text-accent">
            ← Create your own article
          </Link>
        </p>
        <article className="mt-6 rounded-xl border border-border bg-surface/60 p-5 md:p-6">
          <p className="font-mono text-[11px] text-text-muted">
            Published{" "}
            <time dateTime={row.createdAt.toISOString()}>
              {row.createdAt.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </p>
          <h1 className="font-display text-3xl text-text-primary">{row.title}</h1>
          <PublicArticleShareBar title={row.title} url={canonicalUrl} />
          <div
            className="blog-prose mt-8 overflow-x-auto font-serif text-text-primary"
            dangerouslySetInnerHTML={{ __html: row.html }}
          />
          <p className="mt-8 border-t border-border pt-4 font-mono text-xs text-text-muted">
            {row.provenance === "shared-article"
              ? "Generated with RankFlowHQ"
              : "Published on RankFlowHQ"}
          </p>
        </article>
      </main>
    </>
  );
}
