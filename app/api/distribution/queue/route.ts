import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";
import { buildSocialDistributionPack } from "@/lib/distribution/social-copy";

export const runtime = "nodejs";

interface PostBody {
  title?: string;
  canonicalUrl?: string;
  markdown?: string;
  primaryKeyword?: string;
  articleRef?: string;
  summary?: string;
  /** ISO date — when to run auto-post */
  scheduledAt?: string;
}

export async function GET(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.distributionBatch.findMany({
      where: { supabaseUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        canonicalUrl: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        resultJson: true,
        lastError: true,
      },
    });
    return NextResponse.json({
      items: items.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        scheduledAt: i.scheduledAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    console.error("[distribution/queue GET]", e);
    return NextResponse.json(
      { error: "Database unavailable. Run prisma migrate deploy." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSupabaseUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim();
  const canonicalUrl = body.canonicalUrl?.trim();
  const markdown = body.markdown?.trim() ?? "";
  if (!title || !canonicalUrl || !markdown) {
    return NextResponse.json(
      { error: "title, canonicalUrl, and markdown are required" },
      { status: 400 },
    );
  }

  const pack = buildSocialDistributionPack({
    title,
    canonicalUrl,
    markdown,
    primaryKeyword: body.primaryKeyword,
  });

  let scheduledAt: Date | null = null;
  if (body.scheduledAt) {
    const d = new Date(body.scheduledAt);
    if (!Number.isNaN(d.getTime())) scheduledAt = d;
  }

  try {
    const row = await prisma.distributionBatch.create({
      data: {
        supabaseUserId: user.id,
        articleRef: body.articleRef?.trim() || null,
        canonicalUrl,
        title,
        summary: body.summary?.trim() || null,
        packJson: pack as object,
        scheduledAt,
        status: "queued",
      },
      select: { id: true, status: true, scheduledAt: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      id: row.id,
      status: row.status,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      pack,
    });
  } catch (e) {
    console.error("[distribution/queue POST]", e);
    return NextResponse.json(
      { error: "Could not queue distribution. Run prisma migrate deploy." },
      { status: 500 },
    );
  }
}
