import type { Metadata } from "next";
import {
  SITE_LOGO_DIMENSIONS,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

/** Shared Open Graph / Twitter for internal pages. */
export function buildPageMetadata(opts: {
  /** `<title>` segment before the root `template` suffix (e.g. ` · RankFlowHQ`). */
  title: string;
  /** Meta description; aim for ~150–160 characters, primary keyword early. */
  description: string;
  path: string;
  /** When set (e.g. education subdomain), used for absolute OG/Twitter URLs instead of `getSiteUrl()`. */
  siteOrigin?: string;
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
  const base = (opts.siteOrigin ?? getSiteUrl()).replace(/\/$/, "");
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = `${base}${path}`;
  const isArticle = Boolean(opts.article);
  const customHero = opts.ogImage?.trim();
  const defaultHero = `${base}${SITE_LOGO_PATH}`;
  const heroUrl = customHero || defaultHero;
  const ogImages = [
    {
      url: heroUrl,
      width: customHero ? 1200 : SITE_LOGO_DIMENSIONS.width,
      height: customHero ? 630 : SITE_LOGO_DIMENSIONS.height,
      alt: opts.title,
    },
  ];

  return {
    title: opts.title,
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    /** Absolute URL so education.rankflowhq.com pages are not canonicalized to apex via `metadataBase`. */
    alternates: { canonical: url },
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
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [heroUrl],
    },
  };
}
