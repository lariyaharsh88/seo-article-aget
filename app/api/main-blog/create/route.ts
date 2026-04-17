import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { SiteDomain } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { assertArticlePipelineEnvConfigured } from "@/lib/article-bulk-env";
import { MAX_FULL_ARTICLE_TOPICS_PER_REQUEST } from "@/lib/article-bulk-limits";
import {
  DEFAULT_ARTICLE_PIPELINE_AUDIENCE,
  runArticlePipeline,
} from "@/lib/article-pipeline";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";
import { DEFAULT_ARTICLE_AUTHOR_NAME } from "@/lib/article-author";
import { ensureUniqueSlug, slugify } from "@/lib/blog-slug";
import { notifyGoogleSitemaps } from "@/lib/google-indexing";
import { notifyIndexNowUrlsIfConfigured } from "@/lib/indexnow-submit";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { notifyTelegramNewBlogPost } from "@/lib/telegram-channel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

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
  return out;
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

  const envErr = assertArticlePipelineEnvConfigured();
  if (envErr) {
    return NextResponse.json({ error: envErr }, { status: 503 });
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
  if (topics.length > MAX_FULL_ARTICLE_TOPICS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_FULL_ARTICLE_TOPICS_PER_REQUEST} topics per request (full Gemini pipeline per topic). Split into multiple runs.`,
      },
      { status: 400 },
    );
  }

  const fetchBaseUrl = getSiteUrl();
  const noop = () => {};

  const created: Array<{
    id: string;
    topic: string;
    title: string;
    slug: string;
  }> = [];
  const errors: Array<{ topic: string; error: string }> = [];

  for (let i = 0; i < topics.length; i += 1) {
    const topic = topics[i];
    const firstLine =
      topic.trim().split("\n")[0]?.trim() || topic.trim() || "Topic";
    const primaryKeyword = firstLine;

    try {
      const result = await runArticlePipeline(
        {
          topic,
          audience: DEFAULT_ARTICLE_PIPELINE_AUDIENCE,
          intent: "informational",
          sourceUrl: "",
          primaryKeyword,
          searchConsoleQueries: [],
          googleSuggestions: [],
          fetchBaseUrl,
        },
        {
          onStage: noop,
          onDoneStage: noop,
          onLog: noop,
          onKeywords: noop,
          onSources: noop,
          onPaas: noop,
          onFeaturedSnippet: noop,
          onArticleDelta: noop,
          onMeta: noop,
          onResearchTopic: noop,
          onResearchContext: noop,
        },
      );

      const bodyMd = result.article.trim();
      if (!bodyMd) {
        errors.push({
          topic,
          error: "Pipeline returned empty article body.",
        });
        continue;
      }

      const m = result.meta;
      const title = (m?.metaTitle?.trim() || toTitle(topic)).slice(0, 500);
      const baseSlug = slugify(
        m?.urlSlug?.trim() || m?.metaTitle?.trim() || firstLine,
      );
      const slug = await ensureUniqueSlug(
        baseSlug.slice(0, 80) || `article-${Date.now()}-${i}`,
      );
      const excerpt =
        typeof m?.metaDescription === "string" && m.metaDescription.trim()
          ? m.metaDescription.trim().slice(0, 500)
          : null;

      const row = await prisma.blogPost.create({
        data: {
          slug,
          title,
          excerpt,
          content: bodyMd,
          published: true,
          siteDomain: SiteDomain.main,
          authorEmail: adminEmail!,
          authorName: DEFAULT_ARTICLE_AUTHOR_NAME,
        },
        select: { id: true, title: true, slug: true },
      });

      created.push({
        id: row.id,
        topic,
        title: row.title,
        slug: row.slug,
      });

      const articleUrl = `${getSiteUrl().replace(/\/$/, "")}/blog/${encodeURIComponent(
        row.slug,
      )}`;
      notifyTelegramNewBlogPost({
        title: row.title,
        excerpt,
        content: bodyMd,
        slug: row.slug,
      });
      void notifyGoogleSitemaps({
        siteOrigin: getSiteUrl(),
        sitemapPaths: ["/sitemap.xml", "/blogs/sitemap.xml"],
      });
      void notifyIndexNowUrlsIfConfigured({
        urls: [articleUrl],
        includeNewsSitemap: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ topic, error: msg.slice(0, 500) });
    }
  }

  try {
    revalidatePath("/blogs");
    revalidatePath("/blog");
    revalidatePath("/blogs/sitemap.xml");
    revalidatePath("/sitemap.xml");
    revalidateTag("blog-posts");
    for (const row of created) {
      revalidatePath(`/blogs/${row.slug}`);
      revalidatePath(`/blog/${row.slug}`);
    }
  } catch {
    /* script / edge without cache */
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    created,
    errors,
    partialFailure: errors.length > 0 && created.length > 0,
  });
}
