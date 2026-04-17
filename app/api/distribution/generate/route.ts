import { NextResponse } from "next/server";
import { buildBacklinkIdeasForArticle } from "@/lib/distribution/backlink-ideas";
import { buildRssSubmissionChecklist } from "@/lib/distribution/rss-submission";
import { buildSocialDistributionPack } from "@/lib/distribution/social-copy";

export const runtime = "nodejs";

interface Body {
  title?: string;
  canonicalUrl?: string;
  markdown?: string;
  primaryKeyword?: string;
  includeBacklinks?: boolean;
  includeRssChecklist?: boolean;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
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

  return NextResponse.json({
    pack,
    ...(body.includeBacklinks !== false
      ? {
          backlinkIdeas: buildBacklinkIdeasForArticle({
            title,
            canonicalUrl,
            primaryKeyword: body.primaryKeyword,
          }),
        }
      : {}),
    ...(body.includeRssChecklist !== false
      ? { rssSubmission: buildRssSubmissionChecklist() }
      : {}),
  });
}
