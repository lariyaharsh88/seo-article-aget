import { NextResponse } from "next/server";
import { SiteDomain } from "@prisma/client";
import { slugify } from "@/lib/blog-slug";
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

export async function POST(request: Request) {
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

  const now = new Date();
  const created: Array<{ id: string; topic: string; title: string; url: string }> = [];

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    const title = `${toTitle(topic)} - Latest Update`;
    const stamp = `${Date.now()}-${i + 1}`;
    const slug = slugify(topic).slice(0, 70) || `topic-${i + 1}`;
    const url = `https://education.rankflowhq.com/topic/${slug}-${stamp}`;

    const row = await prisma.educationNewsArticle.create({
      data: {
        url,
        title,
        source: "Manual Topic",
        lastmod: now.toISOString(),
        siteDomain: SiteDomain.education,
        repurposeStatus: "pending",
      },
      select: { id: true, title: true, url: true },
    });
    created.push({ id: row.id, topic, title: row.title, url: row.url });
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    created,
  });
}
