import type { MetadataRoute } from "next";
import { getNewsSitemap } from "@/lib/education-news/news-sitemap";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getNewsSitemap();
}
