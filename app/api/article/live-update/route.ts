import { NextResponse } from "next/server";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";
import { appendLiveUpdateToMarkdown } from "@/lib/article-live-updates";
import { prisma } from "@/lib/prisma";

type Body = {
  slug?: string;
  note?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const note = body.note?.trim();
  if (!slug || !note) {
    return NextResponse.json(
      { error: "slug and note are required." },
      { status: 400 },
    );
  }

  const row = await prisma.sharedArticle.findUnique({
    where: { slug },
  });
  if (!row) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const updatedMarkdown = appendLiveUpdateToMarkdown(row.markdown, note);
  const updatedHtml = markdownToArticleHtml(updatedMarkdown);
  const htmlWithWatermark = `${updatedHtml}\n<p style="margin-top:20px;color:#94a3b8;font-size:12px">Generated with RankFlowHQ</p>`;

  const saved = await prisma.sharedArticle.update({
    where: { slug },
    data: {
      markdown: updatedMarkdown,
      html: htmlWithWatermark,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: saved.slug,
    updatedAt: saved.updatedAt.toISOString(),
    url: `/article/${saved.slug}`,
  });
}
