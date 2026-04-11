import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

/** Shared Open Graph / Twitter for internal pages. */
export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const base = getSiteUrl();
  const path = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = `${base}${path}`;
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
      type: "website",
    },
    twitter: {
      card: "summary",
      title: opts.title,
      description: opts.description,
    },
  };
}
