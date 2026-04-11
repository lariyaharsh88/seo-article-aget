import type { Keyword, SeoMeta } from "@/lib/types";

export type SeoScoreStatus = "good" | "ok" | "poor";

export interface SeoScoreAspect {
  id: string;
  label: string;
  /** 0–100 */
  score: number;
  status: SeoScoreStatus;
  tips: string[];
}

export interface ArticleSeoScoreResult {
  overall: number;
  aspects: SeoScoreAspect[];
  wordCount: number;
  focusKeyword: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function statusFromScore(score: number): SeoScoreStatus {
  if (score >= 80) return "good";
  if (score >= 50) return "ok";
  return "poor";
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip markdown enough for word counts and keyword search. */
export function markdownToPlainText(md: string): string {
  let t = md;
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`[^`]+`/g, " ");
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1 ");
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1 ");
  t = t.replace(/^#{1,6}\s+/gm, " ");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  t = t.replace(/^>\s+/gm, "");
  t = t.replace(/^[-*+]\s+/gm, "");
  t = t.replace(/^\d+\.\s+/gm, "");
  return t.replace(/\s+/g, " ").trim();
}

function wordCount(text: string): number {
  const w = text.trim().split(/\s+/).filter(Boolean);
  return w.length;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function extractH1(md: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function extractH2s(md: string): string[] {
  const out: string[] = [];
  const re = /^##\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

function countOccurrences(haystackNorm: string, needleNorm: string): number {
  if (!needleNorm || needleNorm.length < 2) return 0;
  let count = 0;
  let pos = 0;
  while (pos < haystackNorm.length) {
    const i = haystackNorm.indexOf(needleNorm, pos);
    if (i === -1) break;
    count += 1;
    pos = i + needleNorm.length;
  }
  return count;
}

function resolveFocusKeyword(
  meta: SeoMeta | null,
  keywords: Keyword[],
  primaryKeyword: string,
  topicFirstLine: string,
): string {
  const fromMeta = meta?.focusKeyword?.trim();
  if (fromMeta) return fromMeta;
  const primary = keywords.find((k) => k.type === "primary")?.keyword?.trim();
  if (primary) return primary;
  const pk = primaryKeyword.trim();
  if (pk) return pk;
  return topicFirstLine.trim().split(/\s+/).slice(0, 6).join(" ") || "";
}

/**
 * Heuristic SEO score (Yoast / Rank Math–style): uses on-page signals only.
 * Does not call external APIs.
 */
export function computeArticleSeoScore(
  markdown: string,
  meta: SeoMeta | null,
  keywords: Keyword[],
  opts: { primaryKeyword: string; topicFirstLine: string },
): ArticleSeoScoreResult {
  const topicLine = opts.topicFirstLine.trim() || "";
  const focusKeyword = resolveFocusKeyword(
    meta,
    keywords,
    opts.primaryKeyword,
    topicLine,
  );
  const kwNorm = norm(focusKeyword);
  const plain = markdownToPlainText(markdown);
  const plainNorm = norm(plain);
  const words = wordCount(plain);
  const wc = words;

  const aspects: SeoScoreAspect[] = [];

  // --- Title & SERP ---
  const titleTips: string[] = [];
  let titleScore = 50;
  const metaTitle = meta?.metaTitle?.trim() ?? "";
  const metaDesc = meta?.metaDescription?.trim() ?? "";
  const h1 = extractH1(markdown);

  if (metaTitle) {
    const len = metaTitle.length;
    if (len >= 45 && len <= 60) titleScore = 100;
    else if (len >= 35 && len <= 65) titleScore = 78;
    else titleScore = clamp(55 - Math.abs(len - 52) * 2, 25, 70);
    if (kwNorm && !norm(metaTitle).includes(kwNorm)) {
      titleScore = clamp(titleScore - 20, 0, 100);
      titleTips.push("Include the focus keyword in the meta title.");
    }
  } else if (h1) {
    titleScore = 62;
    titleTips.push("Run the audit stage to generate a meta title for SERPs.");
    if (kwNorm && !norm(h1).includes(kwNorm)) {
      titleScore = clamp(titleScore - 15, 0, 100);
      titleTips.push("Put the focus keyword in the H1 (or meta title once generated).");
    }
  } else {
    titleScore = 35;
    titleTips.push("Add an H1 (`# Title`) or run the audit for a meta title.");
  }

  if (metaDesc) {
    const dlen = metaDesc.length;
    let descPts = 0;
    if (dlen >= 120 && dlen <= 155) descPts = 100;
    else if (dlen >= 100 && dlen <= 170) descPts = 75;
    else descPts = clamp(60 - Math.abs(dlen - 140) / 3, 30, 65);
    titleScore = Math.round((titleScore + descPts) / 2);
    if (kwNorm && !norm(metaDesc).includes(kwNorm)) {
      titleScore = clamp(titleScore - 12, 0, 100);
      titleTips.push("Use the focus keyword naturally in the meta description.");
    }
  } else {
    titleScore = Math.round(titleScore * 0.85);
    titleTips.push("Add a meta description (audit stage) — aim for ~120–155 characters.");
  }

  aspects.push({
    id: "title_meta",
    label: "Title & SERP snippet",
    score: clamp(titleScore, 0, 100),
    status: statusFromScore(titleScore),
    tips: titleTips.slice(0, 4),
  });

  // --- Focus keyword ---
  const kwTips: string[] = [];
  let kwScore = 50;
  if (!kwNorm || kwNorm.length < 2) {
    kwScore = 40;
    kwTips.push("Set a focus keyword (primary keyword field or audit output).");
  } else {
    const inTitle =
      (metaTitle && norm(metaTitle).includes(kwNorm)) ||
      (h1 && norm(h1).includes(kwNorm));
    const firstWords = plainNorm.split(/\s+/).slice(0, 100).join(" ");
    const inIntro = firstWords.includes(kwNorm);
    const h2text = extractH2s(markdown).join(" ");
    const inH2 = norm(h2text).includes(kwNorm);
    const occ = countOccurrences(plainNorm, kwNorm);
    const density = wc > 0 ? (occ / wc) * 100 : 0;

    kwScore = 40;
    if (inTitle) kwScore += 25;
    else kwTips.push("Use the focus keyword in the title (H1 or meta title).");
    if (inIntro) kwScore += 20;
    else kwTips.push("Mention the focus keyword in the first ~100 words.");
    if (inH2) kwScore += 15;
    else kwTips.push("Include the keyword in at least one H2.");
    if (density >= 0.4 && density <= 2.8) kwScore += 15;
    else if (density > 2.8) {
      kwScore -= 15;
      kwTips.push("Keyword density looks high — vary wording to avoid stuffing.");
    } else if (wc > 200 && occ < 2) {
      kwTips.push("Use the keyword naturally a few more times in the body.");
    }
    kwScore = clamp(kwScore, 0, 100);
  }

  aspects.push({
    id: "focus_keyword",
    label: "Focus keyword",
    score: kwScore,
    status: statusFromScore(kwScore),
    tips: kwTips.slice(0, 4),
  });

  // --- Content length ---
  let lenScore = 40;
  const lenTips: string[] = [];
  if (wc >= 1800) lenScore = 98;
  else if (wc >= 1200) lenScore = 90;
  else if (wc >= 800) lenScore = 82;
  else if (wc >= 600) lenScore = 72;
  else if (wc >= 400) lenScore = 58;
  else if (wc >= 300) lenScore = 48;
  else {
    lenScore = clamp(25 + wc / 15, 20, 45);
    lenTips.push("Longer, substantive articles often compete better (aim for 800+ words when appropriate).");
  }

  aspects.push({
    id: "content_length",
    label: "Content length",
    score: clamp(lenScore, 0, 100),
    status: statusFromScore(lenScore),
    tips: lenTips.slice(0, 2),
  });

  // --- Structure (headings) ---
  const h2s = extractH2s(markdown);
  const h3Count = (markdown.match(/^###\s+/gm) ?? []).length;
  let structScore = 45;
  const structTips: string[] = [];
  if (h2s.length >= 3) structScore = 92;
  else if (h2s.length === 2) structScore = 78;
  else if (h2s.length === 1) structScore = 58;
  else structScore = 38;
  if (h2s.length < 2) structTips.push("Add multiple H2 sections (`##`) to break up the topic.");
  if (h3Count === 0 && wc > 500) structTips.push("Use H3 (`###`) under major sections for scanability.");
  if (h3Count >= 2) structScore = clamp(structScore + 5, 0, 100);

  aspects.push({
    id: "structure",
    label: "Heading structure",
    score: clamp(structScore, 0, 100),
    status: statusFromScore(structScore),
    tips: structTips.slice(0, 3),
  });

  // --- Readability ---
  const sents = sentences(plain);
  let readScore = 70;
  const readTips: string[] = [];
  if (sents.length > 0) {
    const avgLen =
      sents.reduce((a, s) => a + wordCount(s), 0) / sents.length;
    if (avgLen >= 12 && avgLen <= 22) readScore = 90;
    else if (avgLen <= 30) readScore = 72;
    else {
      readScore = 52;
      readTips.push("Some sentences are long — split for easier reading (aim ~15–20 words per sentence on average).");
    }
    const longRatio =
      sents.filter((s) => wordCount(s) > 35).length / sents.length;
    if (longRatio > 0.25) {
      readScore = clamp(readScore - 15, 0, 100);
      readTips.push("Reduce very long sentences (35+ words).");
    }
  }
  if (meta?.readabilityGrade) {
    const g = meta.readabilityGrade.match(/\d+/);
    if (g) {
      const grade = Number(g[0]);
      if (grade <= 10) readScore = clamp(readScore + 8, 0, 100);
      else if (grade > 14) readTips.push("Consider simplifying for a wider audience (audit suggests higher grade level).");
    }
  }

  aspects.push({
    id: "readability",
    label: "Readability",
    score: clamp(readScore, 0, 100),
    status: statusFromScore(readScore),
    tips: readTips.slice(0, 3),
  });

  // --- Media & links ---
  const imgCount = (markdown.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length;
  const extLinks = (markdown.match(/\]\(https?:\/\/[^)]+\)/g) ?? []).length;
  let mediaScore = 45;
  const mediaTips: string[] = [];
  if (imgCount >= 1) mediaScore += 28;
  else mediaTips.push("Add at least one image with alt text (`![desc](url)`).");
  if (extLinks >= 2) mediaScore += 27;
  else if (extLinks === 1) {
    mediaScore += 18;
    mediaTips.push("Add outbound links to authoritative sources where relevant.");
  } else {
    mediaTips.push("Link out to sources (markdown links) to support claims.");
  }
  mediaScore = clamp(mediaScore, 0, 100);

  aspects.push({
    id: "media_links",
    label: "Media & links",
    score: mediaScore,
    status: statusFromScore(mediaScore),
    tips: mediaTips.slice(0, 3),
  });

  // --- URL / slug ---
  const slugTips: string[] = [];
  let slugScore = 70;
  const slug = meta?.urlSlug?.trim() ?? "";
  if (slug && kwNorm) {
    const slugNorm = norm(slug.replace(/-/g, " "));
    const kwTokens = kwNorm.split(/\s+/).filter((t) => t.length > 2);
    const hits = kwTokens.filter((t) => slugNorm.includes(t)).length;
    if (kwTokens.length > 0) {
      slugScore = Math.round((hits / kwTokens.length) * 100);
    } else {
      slugScore = 72;
    }
    if (slugScore < 70) slugTips.push("Include important focus-keyword terms in the URL slug.");
  } else {
    slugScore = 55;
    slugTips.push("Run the audit stage to suggest a keyword-friendly URL slug.");
  }

  aspects.push({
    id: "slug",
    label: "URL slug",
    score: clamp(slugScore, 0, 100),
    status: statusFromScore(slugScore),
    tips: slugTips.slice(0, 2),
  });

  const weights = [1.15, 1.2, 0.9, 1, 0.95, 0.85, 0.75];
  let sum = 0;
  let wsum = 0;
  aspects.forEach((a, i) => {
    const w = weights[i] ?? 1;
    sum += a.score * w;
    wsum += w;
  });
  const overall = Math.round(sum / wsum);

  return {
    overall: clamp(overall, 0, 100),
    aspects,
    wordCount: wc,
    focusKeyword: focusKeyword || "(not set)",
  };
}
