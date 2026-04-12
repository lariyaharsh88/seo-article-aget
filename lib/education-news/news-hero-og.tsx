import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo-site";

const W = 1200;
const H = 630;

/** Short headline for 1200×630 template (one–two lines, word-safe). */
export function shortenNewsTitleForFeatured(title: string, maxLen = 86): string {
  const t = title.replace(/\s+/g, " ").trim();
  if (!t) return "News";
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  const wordCut = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${wordCut.trimEnd()}…`;
}

async function fetchRemoteImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "RankFlowHQ/1.0 news-featured" },
    });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > 2_000_000) return null;
    const ct =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    if (!ct.startsWith("image/")) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadSiteLogoDataUrl(): Promise<string | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "brand",
      "rankflowhq-logo.png",
    );
    const buf = await readFile(filePath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export type NewsHeroImageOptions = {
  title: string;
  /** Per-article exam/board logo URL (HTTPS). */
  examLogoUrl?: string | null;
};

/**
 * 1200×630 PNG for Open Graph / news hero (uploaded to Blob + CDN).
 * Left column: exam/board logo if URL works, else RankFlowHQ logo (general template).
 * Right: concise title + “RankFlowHQ News”.
 */
export async function getNewsHeroImageBuffer(
  titleOrOpts: string | NewsHeroImageOptions,
): Promise<Buffer> {
  const opts: NewsHeroImageOptions =
    typeof titleOrOpts === "string" ? { title: titleOrOpts } : titleOrOpts;

  const displayTitle = shortenNewsTitleForFeatured(opts.title);
  const envExam = process.env.NEWS_FEATURED_EXAM_LOGO_URL?.trim() || null;
  const examCandidate = opts.examLogoUrl?.trim() || envExam || null;

  let leftImageDataUrl: string | null = null;
  let leftIsExam = false;

  if (examCandidate) {
    leftImageDataUrl = await fetchRemoteImageAsDataUrl(examCandidate);
    leftIsExam = Boolean(leftImageDataUrl);
  }
  if (!leftImageDataUrl) {
    leftImageDataUrl = await loadSiteLogoDataUrl();
    leftIsExam = false;
  }

  const titleFontSize =
    displayTitle.length > 72 ? 38 : displayTitle.length > 48 ? 44 : 50;

  const res = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          background:
            "linear-gradient(145deg,#0c0f14 0%,#151b24 52%,#0f1419 100%)",
        }}
      >
        <div
          style={{
            width: 260,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 36,
            background: "rgba(255,255,255,0.04)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {leftImageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse runtime
            <img
              src={leftImageDataUrl}
              alt=""
              width={leftIsExam ? 200 : 150}
              height={leftIsExam ? 200 : 150}
              style={{
                objectFit: "contain",
                borderRadius: leftIsExam ? 18 : 14,
              }}
            />
          ) : (
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 16,
                background: "rgba(125,211,192,0.12)",
              }}
            />
          )}
          <span
            style={{
              marginTop: 14,
              fontSize: 16,
              fontWeight: 600,
              color: leftIsExam ? "#9ae6d4" : "#8b9cb3",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {leftIsExam ? "Exam / board" : SITE_NAME}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "52px 52px 52px 44px",
          }}
        >
          <span
            style={{
              fontSize: titleFontSize,
              fontWeight: 700,
              color: "#e8eef7",
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              maxHeight: 320,
              overflow: "hidden",
            }}
          >
            {displayTitle}
          </span>
          <span
            style={{
              marginTop: 28,
              fontSize: 22,
              fontWeight: 600,
              color: "#7dd3c0",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {SITE_NAME} News
          </span>
        </div>
      </div>
    ),
    { width: W, height: H },
  );

  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
