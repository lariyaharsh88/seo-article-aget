import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/blog-slug";
import { buildDistributionPack } from "@/lib/distribution-pack";
import { notifyGoogleSitemaps } from "@/lib/google-indexing";
import { notifyIndexNowUrlsIfConfigured } from "@/lib/indexnow-submit";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

type Body = {
  title?: string;
  markdown?: string;
};

export const runtime = "nodejs";

function makeBaseSlug(title: string): string {
  const s = slugify(title || "generated-article");
  return s || "generated-article";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const markdown = typeof body.markdown === "string" ? body.markdown.trim() : "";
  if (markdown.length < 40) {
    return NextResponse.json(
      { error: "Article is too short to share." },
      { status: 400 },
    );
  }
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 180)
      : "Generated article";
  const html = markdownToArticleHtml(markdown);
  const htmlWithWatermark = `${html}\n<p style="margin-top:20px;color:#94a3b8;font-size:12px">Generated with RankFlowHQ</p>`;

  const base = makeBaseSlug(title);
  for (let i = 0; i < 8; i++) {
    const slug = i === 0 ? base : `${base}-${randomSuffix()}`;
    try {
      await prisma.sharedArticle.create({
        data: {
          slug,
          title,
          markdown: `${markdown}\n\nGenerated with RankFlowHQ`,
          html: htmlWithWatermark,
          siteDomain: "main",
        },
      });
      const absoluteUrl = `${getSiteUrl().replace(/\/$/, "")}/article/${slug}`;
      revalidatePath("/article");
      revalidatePath(`/article/${slug}`);
      revalidatePath("/article/sitemap.xml");
      revalidatePath("/sitemap.xml");
      void notifyGoogleSitemaps({
        siteOrigin: getSiteUrl(),
        sitemapPaths: ["/sitemap.xml", "/article/sitemap.xml"],
      });
      void notifyIndexNowUrlsIfConfigured({
        urls: [absoluteUrl],
        includeNewsSitemap: false,
      });
      return NextResponse.json({
        slug,
        url: `/article/${slug}`,
        siteDomain: "main",
        distribution: buildDistributionPack({
          title,
          url: `/article/${slug}`,
          excerpt: markdown.slice(0, 240),
          campaign: "article_share",
        }),
      });
    } catch {
      continue;
    }
  }
  return NextResponse.json(
    { error: "Could not create share link. Try again." },
    { status: 500 },
  );
}
