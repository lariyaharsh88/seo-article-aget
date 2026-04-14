import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/blog-slug";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";

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
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${randomSuffix()}`;
      await prisma.$executeRaw`
        INSERT INTO "SharedArticle" ("id", "slug", "title", "markdown", "html", "createdAt", "updatedAt")
        VALUES (${id}, ${slug}, ${title}, ${`${markdown}\n\nGenerated with RankFlowHQ`}, ${htmlWithWatermark}, NOW(), NOW())
      `;
      return NextResponse.json({ slug, url: `/article/${slug}` });
    } catch {
      continue;
    }
  }
  return NextResponse.json(
    { error: "Could not create share link. Try again." },
    { status: 500 },
  );
}
