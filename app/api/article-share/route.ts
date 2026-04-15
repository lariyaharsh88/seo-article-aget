import { NextResponse } from "next/server";
import { slugify } from "@/lib/blog-slug";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";
import { prisma } from "@/lib/prisma";
import { inferSiteDomainFromText } from "@/lib/site-domain-infer";
import { parseSiteDomainInput } from "@/lib/site-domain-parse";

type Body = {
  title?: string;
  markdown?: string;
  /** Optional: `main` (AI/SEO) or `education` (education/exams). If omitted, inferred from text. */
  siteDomain?: string;
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

  const explicitDomain = parseSiteDomainInput(body.siteDomain);
  const siteDomain =
    explicitDomain ?? inferSiteDomainFromText(title, markdown);
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
          siteDomain,
        },
      });
      return NextResponse.json({
        slug,
        url: `/article/${slug}`,
        siteDomain,
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
