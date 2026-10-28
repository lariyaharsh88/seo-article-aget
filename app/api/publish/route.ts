import { NextResponse } from "next/server";
import { markdownToArticleHtml } from "@/lib/markdown-to-html";
import { prisma } from "@/lib/prisma";
import { getAdapter, PublishError } from "@/lib/publish";
import { rowToConn } from "@/lib/publish/connection";
import { getSupabaseUserFromRequest } from "@/lib/supabase-server";
import { guardUsage } from "@/lib/usage-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

function str(v: unknown, max: number): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

/** Remove a leading "# Title" H1 — CMSs render the title separately. */
function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^\s*#\s+[^\n]*\n+/, "");
}

export async function POST(request: Request) {
  const guard = await guardUsage(request, "step");
  if (!guard.ok) return guard.response;

  const user = await getSupabaseUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const connectionId = str(body.connectionId, 100);
  const markdown = typeof body.markdown === "string" ? body.markdown : "";
  const title = str(body.title, 300);
  const status = body.status === "publish" ? "publish" : "draft";
  if (!connectionId || !markdown.trim() || !title) {
    return NextResponse.json({ error: "Missing connectionId, markdown or title" }, { status: 400 });
  }

  const row = await prisma.publishConnection.findFirst({
    where: { id: connectionId, supabaseUserId: user.id },
  });
  if (!row) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && !!t.trim()).map((t) => t.trim().slice(0, 60)).slice(0, 15)
    : undefined;
  const bodyMarkdown = stripLeadingH1(markdown);
  const metaDescription = str(body.metaDescription, 500);

  try {
    const conn = rowToConn(row);
    const result = await getAdapter(conn.platform).publishArticle(conn, {
      title,
      html: markdownToArticleHtml(bodyMarkdown),
      markdown: bodyMarkdown,
      slug: str(body.slug, 120),
      excerpt: metaDescription,
      metaTitle: str(body.metaTitle, 300),
      metaDescription,
      tags,
      status,
    });
    return NextResponse.json({ ok: true, url: result.url, editUrl: result.editUrl, remoteId: result.remoteId });
  } catch (e) {
    if (e instanceof PublishError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[publish] failed:", e);
    return NextResponse.json({ error: "Publishing failed" }, { status: 500 });
  }
}
