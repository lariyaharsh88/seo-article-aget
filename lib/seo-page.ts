import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

/** Shared Open Graph / Twitter for internal pages. */
export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  /** When set, Open Graph uses `type: article` with published/modified times (blog posts). */
  article?: {
    publishedTime: string;
    modifiedTime: string;
  };
}): Metadata {
  const base = getSiteUrl();
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = `${base}${path}`;
  const isArticle = Boolean(opts.article);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: isArticle ? "article" : "website",
      ...(isArticle && opts.article
        ? {
            publishedTime: opts.article.publishedTime,
            modifiedTime: opts.article.modifiedTime,
          }
        : {}),
    },
    twitter: {
      card: "summary",
      title: opts.title,
      description: opts.description,
    },
  };
}
