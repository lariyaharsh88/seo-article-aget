import { NextResponse } from "next/server";
import {
  analyzeArticleQuality,
  type ArticleQualityReport,
} from "@/lib/article-publish-middleware";

export const runtime = "nodejs";

interface Body {
  markdown?: string;
  primaryKeyword?: string;
  minWordCount?: number;
  maxPrimaryDensityPercent?: number;
  /** For duplicate-outline detection across a batch of drafts */
  previousHeadingFingerprints?: string[];
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const markdown = body.markdown?.trim() ?? "";
  if (!markdown) {
    return NextResponse.json({ error: "`markdown` is required" }, { status: 400 });
  }

  const primary =
    body.primaryKeyword?.trim() ||
    (() => {
      const line = markdown.split(/\r?\n/).find((l) => l.trim().startsWith("# "));
      return line?.replace(/^#\s+/, "").trim().slice(0, 120) ?? "";
    })();

  const report: ArticleQualityReport = analyzeArticleQuality(markdown, primary, {
    minWordCount: body.minWordCount,
    maxPrimaryDensityPercent: body.maxPrimaryDensityPercent,
    previousHeadingFingerprints: body.previousHeadingFingerprints,
  });

  return NextResponse.json(report);
}
