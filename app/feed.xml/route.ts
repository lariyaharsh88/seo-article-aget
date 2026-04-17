import { listStaticBlogPosts } from "@/lib/static-blog-posts";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const posts = await listStaticBlogPosts();
  const buildDate = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const link = `${base}/blog/${encodeURIComponent(p.slug)}`;
      const pub = p.createdAt.toUTCString();
      const desc = escapeXml(p.excerpt ?? p.title);
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RankFlowHQ Blog</title>
    <link>${base}/blog</link>
    <description>SEO tooling, content workflows, and growth notes.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
