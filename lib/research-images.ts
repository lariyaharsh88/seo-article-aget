import type { ResearchImageAsset } from "@/lib/types";

/** One Markdown block: small heading, image, italic insight, quoted data point. */
export function researchImageToMarkdownBlock(asset: ResearchImageAsset): string {
  const title = asset.alt.trim() || "Illustration";
  const alt = asset.alt.replace(/[\[\]]/g, "").trim() || "Illustration";
  const dp = asset.dataPoint.trim();
  const quote =
    dp.length > 0
      ? `\n\n> ${dp.replace(/\n/g, " ")}`
      : "";
  return `### ${title}\n\n![${alt}](${asset.url})\n\n*${asset.insight.trim()}*${quote}`;
}

export function appendResearchImagesSection(
  article: string,
  assets: ResearchImageAsset[],
): string {
  if (assets.length === 0) return article;
  const body = assets.map(researchImageToMarkdownBlock).join("\n\n");
  const section = `\n\n## Data points illustrated\n\n${body}\n`;
  const base = article.trimEnd();
  return base ? `${base}${section}` : section.trimStart();
}

/**
 * Inserts each image block immediately after `## …` sections (first block after first H2, etc.).
 * Images that do not match a section are appended at the end.
 */
export function spreadResearchImagesAfterHeadings(
  article: string,
  assets: ResearchImageAsset[],
): string {
  if (assets.length === 0) return article;
  const blocks = assets.map(researchImageToMarkdownBlock);
  const sep = /\n(?=## )/;
  const chunks = article.split(sep);
  if (chunks.length < 2) {
    return appendResearchImagesSection(article, assets);
  }
  let result = chunks[0] ?? "";
  for (let i = 1; i < chunks.length; i++) {
    result += chunks[i];
    if (i - 1 < blocks.length) {
      result += `\n\n${blocks[i - 1]}`;
    }
  }
  if (chunks.length - 1 < blocks.length) {
    result += `\n\n${blocks.slice(chunks.length - 1).join("\n\n")}`;
  }
  return result;
}
