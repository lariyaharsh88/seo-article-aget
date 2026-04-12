import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

/** Shared Open Graph / Twitter for internal pages. */
export function buildPageMetadata(opts: {
  /** `<title>` segment before the root `template` suffix (e.g. ` · RankFlowHQ`). */
  title: string;
  /** Meta description; aim for ~150–160 characters, primary keyword early. */
  description: string;
  path: string;
  /** Optional `<meta name="keywords">` (lightweight signal; keep focused). */
  keywords?: string[];
  /** When set, Open Graph uses `type: article` with published/modified times (blog posts). */
  article?: {
    publishedTime: string;
    modifiedTime: string;
  };
  /** Absolute or same-origin hero image (e.g. news CDN) for OG / Twitter large card. */
  ogImage?: string | null;
}): Metadata {
  const base = getSiteUrl();
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = `${base}${path}`;
  const isArticle = Boolean(opts.article);
  const hero = opts.ogImage?.trim();
  const ogImages = hero
    ? [{ url: hero, width: 1200, height: 630, alt: opts.title }]
    : undefined;

  return {
    title: opts.title,
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
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
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title: opts.title,
      description: opts.description,
      ...(ogImages ? { images: [hero!] } : {}),
    },
  };
}
