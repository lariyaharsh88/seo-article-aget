import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /archive/* returns 410 (middleware); keep it crawlable so Google sees the 410 and drops it.
        disallow: ["/api/"],
      },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/blogs/sitemap.xml`,
      `${base}/article/sitemap.xml`,
    ],
    host: base.replace(/^https?:\/\//, ""),
  };
}
