import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";

function readWordCount(markdown: string): number {
  return markdown
    .replace(/[#>*`_[\]\(\)\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function extractTitleFromMarkdown(markdown: string, fallback: string): string {
  const lines = markdown.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("# ")) return line.replace(/^#\s+/, "").trim().slice(0, 180);
  }
  return fallback.slice(0, 180);
}

export async function GET(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.userGeneratedArticle.findMany({
      where: { supabaseUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        topic: true,
        primaryKeyword: true,
        sourceUrl: true,
        wordCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        dashboardLink: `/dashboard/articles/${encodeURIComponent(r.id)}`,
      })),
    });
  } catch (e) {
    console.error("[user-articles] GET failed:", e);
    return NextResponse.json(
      {
        error:
          "Could not load dashboard history. Run prisma migrate deploy to create UserGeneratedArticle table.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    markdown?: string;
    topic?: string;
    primaryKeyword?: string;
    sourceUrl?: string;
    title?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const markdown = body.markdown?.trim() || "";
  const topic = body.topic?.trim() || "";
  if (!markdown || !topic) {
    return NextResponse.json(
      { error: "Missing markdown/topic" },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.userGeneratedArticle.create({
      data: {
        supabaseUserId: user.id,
        title: extractTitleFromMarkdown(markdown, body.title?.trim() || topic),
        topic,
        primaryKeyword: body.primaryKeyword?.trim() || null,
        sourceUrl: body.sourceUrl?.trim() || null,
        markdown,
        wordCount: readWordCount(markdown),
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      dashboardLink: `/dashboard/articles/${encodeURIComponent(row.id)}`,
    });
  } catch (e) {
    console.error("[user-articles] POST failed:", e);
    return NextResponse.json(
      {
        error:
          "Could not save article history. Run prisma migrate deploy to create UserGeneratedArticle table.",
      },
      { status: 500 },
    );
  }
}
