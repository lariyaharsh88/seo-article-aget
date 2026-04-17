import { NextResponse } from "next/server";
import { SiteDomain } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import { ensureUniqueSlug, slugify } from "@/lib/blog-slug";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  topics?: string | string[];
};

function parseTopics(input: Body["topics"]): string[] {
  const raw =
    typeof input === "string"
      ? input
      : Array.isArray(input)
        ? input.join(",")
        : "";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim().replace(/\s+/g, " ");
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, 180));
  }
  return out.slice(0, 50);
}

function toTitle(topic: string): string {
  return topic
    .split(" ")
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
    .join(" ");
}

function isAuthorized(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === BLOG_ADMIN_EMAIL;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email?.trim().toLowerCase();
  if (!isAuthorized(adminEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topics = parseTopics(body.topics);
  if (topics.length === 0) {
    return NextResponse.json(
      { error: "Provide comma-separated topics." },
      { status: 400 },
    );
  }

  const created: Array<{
    id: string;
    topic: string;
    title: string;
    slug: string;
  }> = [];

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    const title = `${toTitle(topic)} — Draft`;
    const baseSlug = slugify(topic).slice(0, 80) || `topic-${Date.now()}-${i}`;
    const slug = await ensureUniqueSlug(baseSlug);

    const content =
      `## ${toTitle(topic)}\n\n` +
      `Draft stub created from the education blog topic list. Replace this with full content, then publish.\n`;

    const row = await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt: null,
        content,
        published: false,
        siteDomain: SiteDomain.education,
        authorEmail: adminEmail!,
        authorName: DEFAULT_ARTICLE_AUTHOR_NAME,
      },
      select: { id: true, title: true, slug: true },
    });
    created.push({ id: row.id, topic, title: row.title, slug: row.slug });
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    created,
  });
}
