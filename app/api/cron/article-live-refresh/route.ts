import { SiteDomain } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  appendLiveUpdateToMarkdown,
  buildAutoRefreshNote,
} from "@/lib/article-live-updates";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return request.headers.get("x-vercel-cron") === "1";
  const url = new URL(request.url);
  const q = url.searchParams.get("secret")?.trim();
  const header = request.headers.get("x-cron-secret")?.trim();
  return q === secret || header === secret || request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const minHours = 3;
  const dueBefore = new Date(now.getTime() - minHours * 60 * 60 * 1000);

  const rows = await prisma.sharedArticle.findMany({
    where: {
      siteDomain: SiteDomain.main,
      updatedAt: { lte: dueBefore },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      markdown: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });

  let updated = 0;
  for (const row of rows) {
    const note = buildAutoRefreshNote(row.title, now);
    const markdown = appendLiveUpdateToMarkdown(row.markdown, note, now);
    const html = markdownToArticleHtml(markdown);
    const htmlWithWatermark = `${html}\n<p style="margin-top:20px;color:#94a3b8;font-size:12px">Generated with RankFlowHQ</p>`;

    await prisma.sharedArticle.update({
      where: { id: row.id },
      data: {
        markdown,
        html: htmlWithWatermark,
      },
    });
    updated += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: rows.length,
    updated,
    timestamp: now.toISOString(),
  });
}
