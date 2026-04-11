import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List saved education-news rows (light payload). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (id) {
    const row = await prisma.educationNewsArticle.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        title: true,
        source: true,
        lastmod: true,
        repurposeStatus: true,
        repurposedAt: true,
        repurposedMarkdown: true,
        repurposedSlug: true,
        repurposedCanonicalUrl: true,
        errorMessage: true,
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const slug = row.repurposedSlug?.trim();
    return NextResponse.json({
      ...row,
      repurposedPath: slug ? `/news/${slug}` : null,
    });
  }

  const rows = await prisma.educationNewsArticle.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      url: true,
      title: true,
      source: true,
      lastmod: true,
      repurposeStatus: true,
      repurposedAt: true,
      repurposedMarkdown: true,
      repurposedSlug: true,
      repurposedCanonicalUrl: true,
      updatedAt: true,
    },
  });

  const list = rows.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    source: r.source,
    lastmod: r.lastmod,
    updatedAt: r.updatedAt.toISOString(),
    repurposeStatus: r.repurposeStatus,
    repurposedAt: r.repurposedAt?.toISOString() ?? null,
    repurposedExcerpt: r.repurposedMarkdown
      ? r.repurposedMarkdown.slice(0, 200).trim()
      : null,
    repurposedPath: r.repurposedSlug?.trim()
      ? `/news/${r.repurposedSlug.trim()}`
      : null,
    repurposedCanonicalUrl: r.repurposedCanonicalUrl?.trim() || null,
  }));

  return NextResponse.json({ items: list });
}
