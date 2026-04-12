import { prisma } from "@/lib/prisma";
import { toAbsoluteHttpsImageUrl } from "@/lib/images-cdn";
import { SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

const NEWS_NS = "http://www.google.com/schemas/sitemap-news/0.9";
const IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1";
const URLSET_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** `2026-04-11T17:50:25+00:00` (no ms, UTC offset). */
function formatSitemapDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function plainTextKeywords(markdown: string | null, title: string): string {
  const raw = (markdown ?? "").replace(/```[\s\S]*?```/g, " ");
  const stripped = raw
    .replace(/[#>*_[\]()~`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const combined = stripped ? `${title}. ${stripped}` : title;
  return combined.slice(0, 500).trim() || title;
}

/**
 * Google News sitemap XML (`/news/sitemap.xml`): `news:` + optional `image:` (hero) when URL is valid.
 * Image `<image:loc>` values are always **absolute https://** (fixes GSC “Invalid URL” for scheme-less hosts).
 * `changefreq` daily, `priority` 1 per URL.
 *
 * @see https://developers.google.com/search/docs/advanced/sitemaps/news-sitemap
 * @see https://developers.google.com/search/docs/advanced/sitemaps/image-sitemaps
 */
export async function buildGoogleNewsSitemapXml(): Promise<string> {
  const base = getSiteUrl().replace(/\/$/, "");
  const publicationName =
    process.env.NEWS_SITEMAP_PUBLICATION_NAME?.trim() || `${SITE_NAME} News`;
  const languageRaw =
    process.env.NEWS_SITEMAP_LANGUAGE?.trim().replace(/[^a-zA-Z-]/g, "") || "";
  const language = languageRaw.length > 0 ? languageRaw : "en";
  const genres =
    process.env.NEWS_SITEMAP_GENRES?.trim() || "PressRelease, Blog";

  let rows: {
    repurposedSlug: string;
    title: string;
    repurposedMarkdown: string | null;
    repurposedImageUrl: string | null;
    repurposedAt: Date;
    updatedAt: Date;
  }[] = [];
  try {
    const found = await prisma.educationNewsArticle.findMany({
      where: {
        repurposeStatus: "ready",
        repurposedSlug: { not: null },
        repurposedMarkdown: { not: null },
        repurposedAt: { not: null },
      },
      select: {
        repurposedSlug: true,
        title: true,
        repurposedMarkdown: true,
        repurposedImageUrl: true,
        repurposedAt: true,
        updatedAt: true,
      },
      orderBy: { repurposedAt: "desc" },
    });
    rows = found.filter(
      (
        r,
      ): r is typeof r & {
        repurposedSlug: string;
        repurposedAt: Date;
      } =>
        Boolean(r.repurposedSlug?.trim()) && r.repurposedAt != null,
    );
  } catch {
    rows = [];
  }

  const urlEntries = rows.map((r) => {
    const slug = r.repurposedSlug.trim();
    const loc = `${base}/news/${encodeURIComponent(slug)}`;
    const lastmod = formatSitemapDate(r.updatedAt);
    const pubDate = formatSitemapDate(r.repurposedAt);
    const title = escapeXml(r.title);
    const keywords = escapeXml(
      plainTextKeywords(r.repurposedMarkdown, r.title),
    );
    const pubName = escapeXml(publicationName);
    const imageHttps = toAbsoluteHttpsImageUrl(r.repurposedImageUrl);
    const imageBlock =
      imageHttps != null
        ? `
    <image:image>
      <image:loc>${escapeXml(imageHttps)}</image:loc>
    </image:image>`
        : "";

    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
    <news:news>
      <news:publication>
        <news:name>${pubName}</news:name>
        <news:language>${escapeXml(language)}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:genres>${escapeXml(genres)}</news:genres>
      <news:title>${title}</news:title>
      <news:keywords>${keywords}</news:keywords>
    </news:news>${imageBlock}
  </url>`;
  });

  const body = urlEntries.join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${URLSET_NS}"
        xmlns:news="${NEWS_NS}"
        xmlns:image="${IMAGE_NS}">
${body}
</urlset>`;
}
