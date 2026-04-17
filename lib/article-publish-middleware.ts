/**
 * Pre-publish quality gate: thin content, keyword stuffing, template/duplicate structure.
 * Pure functions — safe for Edge/Node. No DB calls (callers can persist fingerprints).
 */

export type QualitySeverity = "error" | "warn" | "info";

export type ArticleQualityIssue = {
  code: string;
  severity: QualitySeverity;
  message: string;
};

export type ArticleQualityMetrics = {
  wordCount: number;
  primaryKeyword: string;
  primaryOccurrences: number;
  primaryDensityPercent: number;
  h2Count: number;
  h3Count: number;
  tableCount: number;
  externalLinkCount: number;
  internalLinkCount: number;
  faqJsonLdPresent: boolean;
  minWordsUnderH2: number;
};

export type ArticleQualityReport = {
  ok: boolean;
  issues: ArticleQualityIssue[];
  metrics: ArticleQualityMetrics;
  /** Normalized heading skeleton for duplicate-structure checks across articles. */
  headingFingerprint: string;
  suggestions: string[];
};

const AI_SLUG_PATTERNS = [
  /\bin today's fast-paced\b/i,
  /\bit's no secret\b/i,
  /\bwhether you're a beginner or\b/i,
  /\bdelve into\b/i,
  /\bleverage\b/i,
  /\bunlock your\b/i,
  /\brobust solution\b/i,
  /\bgame-changer\b/i,
  /\bcutting-edge\b/i,
];

function stripCodeFences(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ");
}

function countWords(markdown: string): number {
  const text = stripCodeFences(markdown)
    .replace(/[#>*`_[\]\(\)\-|]/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle.trim()) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const m = haystack.match(re);
  return m?.length ?? 0;
}

function extractHeadings(markdown: string): { h2: string[]; h3: string[] } {
  const h2: string[] = [];
  const h3: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("## ") && !t.startsWith("###")) {
      h2.push(t.replace(/^##\s+/, "").trim().toLowerCase());
    } else if (t.startsWith("### ")) {
      h3.push(t.replace(/^###\s+/, "").trim().toLowerCase());
    }
  }
  return { h2, h3 };
}

function countMarkdownTables(markdown: string): number {
  const lines = markdown.split(/\r?\n/);
  let n = 0;
  let i = 0;
  while (i < lines.length) {
    if (/^\s*\|.+\|\s*$/.test(lines[i]) && i + 1 < lines.length && /^\s*\|[-:\s|]+\|\s*$/.test(lines[i + 1])) {
      n++;
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) i++;
      continue;
    }
    i++;
  }
  return n;
}

function countLinks(markdown: string): { internal: number; external: number } {
  const re = /\[([^\]]*)\]\(([^)]+)\)/g;
  let internal = 0;
  let external = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const href = m[2].trim();
    if (href.startsWith("#") || href.startsWith("/")) {
      internal++;
      continue;
    }
    if (/^https?:\/\//i.test(href)) {
      try {
        const host = new URL(href).hostname;
        if (
          host.includes("rankflowhq.com") ||
          host === "localhost" ||
          host.endsWith(".vercel.app")
        ) {
          internal++;
        } else {
          external++;
        }
      } catch {
        external++;
      }
    }
  }
  return { internal, external };
}

function hasFaqJsonLd(markdown: string): boolean {
  const jsonBlocks = Array.from(markdown.matchAll(/```json\s*([\s\S]*?)```/gi));
  for (const block of jsonBlocks) {
    const raw = block[1]?.trim() ?? "";
    if (!raw.includes("FAQPage") && !raw.includes('"FAQPage"')) continue;
    try {
      const parsed = JSON.parse(raw) as { "@type"?: string };
      const t = parsed["@type"];
      if (t === "FAQPage" || (Array.isArray(t) && t.includes("FAQPage"))) return true;
    } catch {
      continue;
    }
  }
  return false;
}

function minWordsPerH2Section(markdown: string): number {
  const stripped = stripCodeFences(markdown);
  const sections = stripped.split(/^## /m).filter(Boolean);
  if (sections.length <= 1) return countWords(stripped);
  let minW = Infinity;
  for (const chunk of sections) {
    const w = countWords(chunk);
    if (w < minW) minW = w;
  }
  return minW === Infinity ? 0 : minW;
}

function headingFingerprint(h2: string[]): string {
  const normalized = h2
    .map((h) =>
      h
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
  return normalized.join(" > ");
}

/**
 * Analyze markdown before publish. Optional `previousFingerprints` flags duplicate outline patterns.
 */
export function analyzeArticleQuality(
  markdown: string,
  primaryKeyword: string,
  opts?: {
    minWordCount?: number;
    maxPrimaryDensityPercent?: number;
    minWordsPerSection?: number;
    previousHeadingFingerprints?: string[];
  },
): ArticleQualityReport {
  const minWordCount = opts?.minWordCount ?? 900;
  const maxPrimaryDensity = opts?.maxPrimaryDensityPercent ?? 3.2;
  const minWordsPerSection = opts?.minWordsPerSection ?? 120;
  const prev = opts?.previousHeadingFingerprints ?? [];

  const issues: ArticleQualityIssue[] = [];
  const suggestions: string[] = [];

  const wc = countWords(markdown);
  const primary = primaryKeyword.trim();
  const occ = countOccurrences(markdown, primary);
  const density = wc > 0 && primary.length > 0 ? (occ / wc) * 100 : 0;
  const { h2, h3 } = extractHeadings(markdown);
  const fp = headingFingerprint(h2);
  const tables = countMarkdownTables(markdown);
  const links = countLinks(markdown);
  const jsonLd = hasFaqJsonLd(markdown);
  const minUnderH2 = minWordsPerH2Section(markdown);

  const metrics: ArticleQualityMetrics = {
    wordCount: wc,
    primaryKeyword: primary,
    primaryOccurrences: occ,
    primaryDensityPercent: Math.round(density * 100) / 100,
    h2Count: h2.length,
    h3Count: h3.length,
    tableCount: tables,
    externalLinkCount: links.external,
    internalLinkCount: links.internal,
    faqJsonLdPresent: jsonLd,
    minWordsUnderH2: minUnderH2,
  };

  if (wc < minWordCount) {
    issues.push({
      code: "thin.word_count",
      severity: "error",
      message: `Word count ${wc} is below minimum ${minWordCount} — expand with examples, data section, or FAQ.`,
    });
    suggestions.push("Add a data-backed subsection and 2–3 deeper FAQ answers with specifics.");
  }

  if (h2.length < 3 && wc < 2500) {
    issues.push({
      code: "thin.structure",
      severity: "warn",
      message: "Few H2 sections for the length — readers and crawlers may see thin coverage.",
    });
  }

  if (primary && density > maxPrimaryDensity) {
    issues.push({
      code: "stuffing.primary_density",
      severity: "error",
      message: `Primary keyword density ${density.toFixed(2)}% exceeds ~${maxPrimaryDensity}% — vary phrasing and remove repeats.`,
    });
    suggestions.push("Use synonyms, entities, and pronouns; merge redundant sentences.");
  }

  if (primary && occ > 0) {
    const intro = markdown.slice(0, 1200).toLowerCase();
    const introOcc = countOccurrences(intro, primary.toLowerCase());
    if (introOcc > 8) {
      issues.push({
        code: "stuffing.intro_burst",
        severity: "warn",
        message: "Primary keyword appears many times in the opening — risk of stuffing.",
      });
    }
  }

  if (minUnderH2 < minWordsPerSection && h2.length >= 2) {
    issues.push({
      code: "thin.section",
      severity: "warn",
      message: `At least one H2 section is light (~${minUnderH2} words) — aim for ~${minWordsPerSection}+ words of substance per major section.`,
    });
  }

  if (tables < 2) {
    issues.push({
      code: "format.tables",
      severity: "warn",
      message: `Expected at least 2 markdown tables; found ${tables}.`,
    });
  }

  if (!jsonLd) {
    issues.push({
      code: "schema.faq_missing",
      severity: "warn",
      message: "No FAQ JSON-LD block detected in a ```json``` fence — add FAQPage schema matching on-page FAQs.",
    });
  }

  if (links.external < 2) {
    issues.push({
      code: "eeat.external_links",
      severity: "info",
      message: "Few outbound links to authoritative sources — add official references for key claims.",
    });
  }

  if (links.internal < 3) {
    issues.push({
      code: "eeat.internal_links",
      severity: "info",
      message: "Consider more internal links to relevant site hubs (see internal linking rules).",
    });
  }

  for (const rx of AI_SLUG_PATTERNS) {
    if (rx.test(markdown)) {
      issues.push({
        code: "voice.ai_pattern",
        severity: "info",
        message: "Possible generic AI phrasing detected — rewrite affected sentences with specific facts or shorter wording.",
      });
      break;
    }
  }

  if (fp.length > 0 && prev.includes(fp)) {
    issues.push({
      code: "duplicate.heading_skeleton",
      severity: "warn",
      message: "Heading skeleton matches a previous article in this session — vary H2 order/names for topical diversity.",
    });
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const ok = errors === 0;

  return {
    ok,
    issues,
    metrics,
    headingFingerprint: fp,
    suggestions,
  };
}
