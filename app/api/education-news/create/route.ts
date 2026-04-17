import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
import { slugify } from "@/lib/blog-slug";
import { ensureUniqueRepurposedSlug } from "@/lib/education-news/repurpose-news-slug";
import { notifyGoogleSitemaps } from "@/lib/google-indexing";
import { notifyIndexNowIfConfigured } from "@/lib/indexnow-submit";
import { prisma } from "@/lib/prisma";
import { absoluteUrlForSiteDomain } from "@/lib/site-domain";
import { getSiteUrl } from "@/lib/site-url";
import { notifyTelegramNewsRepurposed } from "@/lib/telegram-channel";

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

function extractFirstMarkdownH1(markdown: string): string | null {
  const lines = markdown.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      const h1 = line.replace(/^#\s+/, "").trim();
      if (h1) return h1.slice(0, 500);
    }
    if (line.startsWith("##")) break;
  }
  return null;
}

function isAuthorized(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === BLOG_ADMIN_EMAIL;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(session?.user?.email)) {
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

  const created: Array<{ id: string; topic: string; title: string; url: string }> =
    [];
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

      const md = result.article.trim();
      if (!md || md.length < 200) {
        errors.push({
          topic,
          error: "Pipeline returned too little text for a news article.",
        });
        continue;
      }

      const m = result.meta;
      const optimizedTitle = (
        m?.metaTitle?.trim() ||
        extractFirstMarkdownH1(md) ||
        toTitle(topic)
      ).slice(0, 500);

      const baseSlug = slugify(
        m?.urlSlug?.trim() || m?.metaTitle?.trim() || firstLine,
      ).slice(0, 80);
      const repurposedSlug = await ensureUniqueRepurposedSlug(
        baseSlug || `news-${Date.now()}-${i}`,
      );
      const sitePath = `/news/${repurposedSlug}`;
      const repurposedCanonicalUrl = absoluteUrlForSiteDomain(
        SiteDomain.education,
        sitePath,
      );

      const stamp = `${Date.now()}-${i}`;
      const syntheticUrl = `https://education.rankflowhq.com/topic/pipeline/${repurposedSlug}-${stamp}`;

      const row = await prisma.educationNewsArticle.create({
        data: {
          url: syntheticUrl,
          title: optimizedTitle,
          source: "Topic pipeline",
          lastmod: new Date().toISOString(),
          siteDomain: SiteDomain.education,
          authorName: DEFAULT_ARTICLE_AUTHOR_NAME,
          rawArticleText: `Generated from topic:\n${topic.slice(0, 4000)}`,
          repurposedMarkdown: md,
          repurposedAt: new Date(),
          repurposeStatus: "ready",
          repurposedSlug,
          repurposedCanonicalUrl,
          errorMessage: null,
        },
        select: { id: true, title: true, url: true },
      });

      created.push({
        id: row.id,
        topic,
        title: row.title,
        url: repurposedCanonicalUrl,
      });

      notifyTelegramNewsRepurposed({
        title: row.title,
        repurposedMarkdown: md,
        slug: repurposedSlug,
        siteDomain: SiteDomain.education,
      });

      void notifyIndexNowIfConfigured({
        articleUrl: repurposedCanonicalUrl,
      });

      try {
        const articleOrigin = new URL(repurposedCanonicalUrl).origin;
        void notifyGoogleSitemaps({
          siteOrigin: articleOrigin,
          sitemapPaths: ["/sitemap.xml", "/news/sitemap.xml"],
        });
      } catch {
        /* ignore */
      }

      try {
        revalidatePath("/news");
        revalidatePath(sitePath);
        revalidatePath("/news/sitemap.xml");
        revalidatePath("/education/sitemap.xml");
      } catch {
        /* no cache */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ topic, error: msg.slice(0, 500) });
    }
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    created,
    errors,
    partialFailure: errors.length > 0 && created.length > 0,
  });
}
