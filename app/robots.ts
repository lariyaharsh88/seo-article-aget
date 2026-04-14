import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/archive/"],
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
